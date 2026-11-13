import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Stripe Checkout (CAD) — the payment path for the CANADA market (JLPS
 * winter craft market + any Canada-located seller). India keeps Razorpay.
 *
 * Implemented with native `fetch` against the Stripe REST API (no `stripe`
 * npm dep → nothing extra to package for Lambda), mirroring payment.adapter.
 *
 * Flow: backend creates a hosted Checkout Session → browser redirects to
 * `url` → Stripe redirects back to our success page with the session id →
 * backend RETRIEVES the session from Stripe (server-to-server) and only marks
 * the order paid when Stripe says `payment_status === 'paid'`. The client can
 * never forge a paid state.
 */
export interface CheckoutLine {
  name: string;
  unitAmountCents: number;
  qty: number;
}

export interface CreatedCheckout {
  sessionId: string;
  /** Hosted Stripe Checkout URL (null in stub mode). */
  url: string | null;
  stub: boolean;
}

export interface CheckoutStatus {
  paid: boolean;
  paymentIntent?: string;
  amountTotalCents?: number;
  currency?: string;
}

export interface StripeAdapter {
  readonly live: boolean;
  createCheckout(input: {
    orderId: string;
    currency: string; // 'cad'
    lines: CheckoutLine[];
    customerEmail?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CreatedCheckout>;
  getCheckout(sessionId: string): Promise<CheckoutStatus>;
}

/** Stripe wants application/x-www-form-urlencoded with bracketed nesting. */
function formEncode(obj: Record<string, unknown>, prefix = ''): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item !== null && typeof item === 'object') {
          out.push(
            ...formEncode(item as Record<string, unknown>, `${key}[${i}]`),
          );
        } else {
          out.push(
            `${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`,
          );
        }
      });
    } else if (typeof v === 'object') {
      out.push(...formEncode(v as Record<string, unknown>, key));
    } else {
      out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
    }
  }
  return out;
}

export class StubStripeAdapter implements StripeAdapter {
  readonly live = false;
  private readonly logger = new Logger(StubStripeAdapter.name);

  async createCheckout(input: { orderId: string }): Promise<CreatedCheckout> {
    const sessionId = `stub_cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.logger.log(
      `[STUB] Stripe checkout for order ${input.orderId} → ${sessionId}`,
    );
    return { sessionId, url: null, stub: true };
  }

  async getCheckout(): Promise<CheckoutStatus> {
    this.logger.log('[STUB] getCheckout → paid (test mode)');
    return { paid: true };
  }
}

export class LiveStripeAdapter implements StripeAdapter {
  readonly live = true;
  private readonly logger = new Logger(LiveStripeAdapter.name);
  private readonly base = 'https://api.stripe.com/v1';

  constructor(private readonly secretKey: string) {}

  private async call<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>,
  ) {
    const res = await fetch(`${this.base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        ...(body
          ? { 'Content-Type': 'application/x-www-form-urlencoded' }
          : {}),
      },
      body: body ? formEncode(body).join('&') : undefined,
    });
    const json = (await res.json()) as T & { error?: { message?: string } };
    if (!res.ok) {
      const msg = json?.error?.message || `HTTP ${res.status}`;
      this.logger.error(`Stripe ${method} ${path} failed: ${msg}`);
      throw new Error(`Stripe error: ${msg}`);
    }
    return json;
  }

  async createCheckout(input: {
    orderId: string;
    currency: string;
    lines: CheckoutLine[];
    customerEmail?: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CreatedCheckout> {
    const session = await this.call<{ id: string; url: string }>(
      'POST',
      '/checkout/sessions',
      {
        mode: 'payment',
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        customer_email: input.customerEmail,
        client_reference_id: input.orderId,
        metadata: { orderId: input.orderId, product: 'kalacube' },
        payment_intent_data: {
          metadata: { orderId: input.orderId, product: 'kalacube' },
        },
        line_items: input.lines.map((l) => ({
          quantity: l.qty,
          price_data: {
            currency: input.currency,
            unit_amount: l.unitAmountCents,
            product_data: { name: l.name.slice(0, 250) },
          },
        })),
      },
    );
    this.logger.log(
      `LIVE Stripe checkout ${session.id} for order ${input.orderId}`,
    );
    return { sessionId: session.id, url: session.url, stub: false };
  }

  async getCheckout(sessionId: string): Promise<CheckoutStatus> {
    const s = await this.call<{
      payment_status: string;
      payment_intent?: string;
      amount_total?: number;
      currency?: string;
    }>('GET', `/checkout/sessions/${encodeURIComponent(sessionId)}`);
    return {
      paid: s.payment_status === 'paid',
      paymentIntent: s.payment_intent,
      amountTotalCents: s.amount_total,
      currency: s.currency,
    };
  }
}

/** Live only when STRIPE_SECRET_KEY is set (sk_test_… or sk_live_…). */
export function createStripeAdapter(config: ConfigService): StripeAdapter {
  const key = (config.get<string>('STRIPE_SECRET_KEY') || '').trim();
  if (key) {
    new Logger('StripeAdapter').log(
      `LIVE Stripe mode (${key.startsWith('sk_live_') ? 'LIVE keys' : 'TEST keys'})`,
    );
    return new LiveStripeAdapter(key);
  }
  new Logger('StripeAdapter').log('STUB Stripe mode (no STRIPE_SECRET_KEY)');
  return new StubStripeAdapter();
}
