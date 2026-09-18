import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Payments abstraction (Razorpay).
 *
 * Option A (approved for the shipping pilot): KalaCUBE holds its OWN live
 * Razorpay keys in SSM (`/kalacube/prod/RAZORPAY_KEY_ID` + `_SECRET`, same
 * NETAVON Razorpay account) and talks to the Razorpay REST API directly — no
 * Netavon proxy. Implemented with native `fetch` + `crypto` (no `razorpay`
 * npm dep → no arm64 native-binary deploy risk).
 *
 * Two impls behind this interface:
 *  - StubPaymentAdapter  → default; realistic mock, no network calls.
 *  - LivePaymentAdapter  → used only when RAZORPAY_KEY_ID + _SECRET are set.
 */
export interface CreatedPayment {
  /** Gateway order id (Razorpay `order_...`) or a stub ref. */
  orderId: string;
  /** Public key id the browser Checkout needs (never a secret). */
  keyId?: string;
  amount: number; // in paise
  currency: string;
  /** True when no real gateway was contacted (test/stub mode). */
  stub: boolean;
}

export interface PaymentAdapter {
  /** Create a held payment/order for `amountInr` rupees. */
  createOrder(amountInr: number, meta?: Record<string, any>): Promise<CreatedPayment>;
  /** Verify a client payment signature. Stub always returns true. */
  verifyPayment(sig: {
    orderId?: string;
    paymentId?: string;
    signature?: string;
  }): Promise<boolean>;
}

/** Default, network-free implementation. Safe to deploy with no keys. */
export class StubPaymentAdapter implements PaymentAdapter {
  private readonly logger = new Logger(StubPaymentAdapter.name);

  async createOrder(amountInr: number): Promise<CreatedPayment> {
    const orderId = `stub_order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.logger.log(
      `[STUB] createOrder ₹${amountInr} → ${orderId} (no external call; funds NOT captured)`,
    );
    return {
      orderId,
      keyId: undefined,
      amount: Math.round(amountInr * 100),
      currency: 'INR',
      stub: true,
    };
  }

  async verifyPayment(): Promise<boolean> {
    this.logger.log('[STUB] verifyPayment → true (test mode, no signature check)');
    return true;
  }
}

/**
 * Live impl — talks to the Razorpay REST API directly with the KalaCUBE keys.
 * `createOrder` opens a Razorpay order (the browser Checkout then collects the
 * payment against it); `verifyPayment` checks the HMAC signature Razorpay
 * returns to the client so a forged confirm can't mark an order paid.
 */
export class LivePaymentAdapter implements PaymentAdapter {
  private readonly logger = new Logger(LivePaymentAdapter.name);
  private readonly base = 'https://api.razorpay.com/v1';

  constructor(
    private readonly keyId: string,
    private readonly keySecret: string,
  ) {}

  private authHeader(): string {
    return (
      'Basic ' +
      Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')
    );
  }

  async createOrder(amountInr: number, meta?: Record<string, any>): Promise<CreatedPayment> {
    const amount = Math.round(amountInr * 100); // paise
    // Razorpay `receipt` is capped at 40 chars; keep it short + unique.
    const receipt = `kc_${Date.now().toString(36)}`.slice(0, 40);
    const res = await fetch(`${this.base}/orders`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        receipt,
        payment_capture: 1,
        notes: meta || {},
      }),
    });
    const body = (await res.json()) as { id?: string; error?: { description?: string } };
    if (!res.ok || !body?.id) {
      const msg = body?.error?.description || `HTTP ${res.status}`;
      this.logger.error(`Razorpay createOrder failed: ${msg}`);
      throw new Error(`Razorpay order creation failed: ${msg}`);
    }
    this.logger.log(`LIVE createOrder ₹${amountInr} → ${body.id}`);
    return {
      orderId: body.id,
      keyId: this.keyId, // public key id — safe to send to the browser
      amount,
      currency: 'INR',
      stub: false,
    };
  }

  async verifyPayment(sig: {
    orderId?: string;
    paymentId?: string;
    signature?: string;
  }): Promise<boolean> {
    const { orderId, paymentId, signature } = sig;
    if (!orderId || !paymentId || !signature) {
      this.logger.warn('verifyPayment missing orderId/paymentId/signature → false');
      return false;
    }
    // Razorpay client signature = HMAC_SHA256(order_id + "|" + payment_id, secret)
    const expected = createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    const ok = a.length === b.length && timingSafeEqual(a, b);
    if (!ok) this.logger.warn(`verifyPayment signature mismatch for order ${orderId}`);
    return ok;
  }
}

/**
 * Factory: pick the live adapter only when BOTH Razorpay keys are configured;
 * otherwise fall back to the safe stub. This is the single switch point — no
 * other code knows whether payments are live.
 */
export function createPaymentAdapter(config: ConfigService): PaymentAdapter {
  const keyId = (config.get<string>('RAZORPAY_KEY_ID') || '').trim();
  const keySecret = (config.get<string>('RAZORPAY_KEY_SECRET') || '').trim();
  if (keyId && keySecret) {
    new Logger('PaymentAdapter').log(`LIVE payment mode (Razorpay ${keyId.slice(0, 12)}…)`);
    return new LivePaymentAdapter(keyId, keySecret);
  }
  new Logger('PaymentAdapter').log('STUB payment mode (no RAZORPAY_KEY_ID/SECRET)');
  return new StubPaymentAdapter();
}
