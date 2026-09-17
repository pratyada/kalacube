import { Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Payments abstraction (Razorpay). KalaCUBE NEVER holds the Razorpay secret —
 * live orders are created through the NETAVON shared payments backend (same
 * Razorpay account, product #2). See KALACUBE_PAYMENTS.md.
 *
 * Two impls behind this interface:
 *  - StubPaymentAdapter  → default; realistic mock, no network calls.
 *  - LivePaymentAdapter  → used only when NETAVON_ORDERS_URL is configured.
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
 * Live impl — routes order creation through the Netavon shared backend so the
 * Razorpay secret stays out of KalaCUBE. NOT YET WIRED: the subscriptions
 * endpoint exists, but the one-off *orders* endpoint is still TBD (see
 * KALACUBE_PAYMENTS.md). Finish the two calls below to go live.
 */
export class LivePaymentAdapter implements PaymentAdapter {
  private readonly logger = new Logger(LivePaymentAdapter.name);
  constructor(private readonly ordersUrl: string) {}

  async createOrder(amountInr: number, meta?: Record<string, any>): Promise<CreatedPayment> {
    // TODO(go-live): POST { product:'kalacube', amount: amountInr*100, currency:'INR', meta }
    //   to `${this.ordersUrl}` (the Netavon create-order endpoint) and map the
    //   { order_id, key_id } response to CreatedPayment. Never send/hold a secret.
    this.logger.warn(
      `LIVE payment createOrder called (${amountInr}) but the Netavon orders endpoint is not yet wired`,
    );
    void meta;
    throw new NotImplementedException(
      'LivePaymentAdapter.createOrder: wire the Netavon orders endpoint (see KALACUBE_PAYMENTS.md)',
    );
  }

  async verifyPayment(): Promise<boolean> {
    // TODO(go-live): verify razorpay_signature via the Netavon backend (HMAC
    // with the secret that lives ONLY on the Netavon side).
    throw new NotImplementedException(
      'LivePaymentAdapter.verifyPayment: wire signature verification via Netavon',
    );
  }
}

/**
 * Factory: pick the live adapter only when the Netavon orders endpoint is
 * configured; otherwise fall back to the safe stub. This is the single switch
 * point — no other code knows whether payments are live.
 */
export function createPaymentAdapter(config: ConfigService): PaymentAdapter {
  const ordersUrl = (config.get<string>('NETAVON_ORDERS_URL') || '').trim();
  if (ordersUrl) {
    new Logger('PaymentAdapter').log('LIVE payment mode (Netavon orders endpoint set)');
    return new LivePaymentAdapter(ordersUrl);
  }
  new Logger('PaymentAdapter').log('STUB payment mode (no NETAVON_ORDERS_URL)');
  return new StubPaymentAdapter();
}
