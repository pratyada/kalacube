import { Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Artist payout abstraction (Razorpay Route / Cashfree Easy Split). After the
 * return window closes, the artist's net (gross − commission) settles to their
 * UPI/bank automatically. The Razorpay secret is NEVER held in KalaCUBE — live
 * payouts route through the Netavon backend (NETAVON_PAYOUT_URL).
 *
 * Env to go live: NETAVON_PAYOUT_URL (preferred, keeps the secret on Netavon).
 * Absent → StubPayoutAdapter (no network calls).
 */
export interface PayoutResult {
  payoutId: string;
  status: 'processing' | 'paid' | 'failed';
  stub: boolean;
}

export interface PayoutAdapter {
  releasePayout(input: {
    orderId: string;
    artistId: string;
    gross: number;
    commission: number;
    net: number;
  }): Promise<PayoutResult>;
}

/** Default, network-free implementation. */
export class StubPayoutAdapter implements PayoutAdapter {
  private readonly logger = new Logger(StubPayoutAdapter.name);

  async releasePayout(input: {
    orderId: string;
    net: number;
  }): Promise<PayoutResult> {
    const payoutId = `stub_payout_${Date.now()}`;
    this.logger.log(
      `[STUB] releasePayout order ${input.orderId} net ₹${input.net} → ${payoutId} (no funds moved)`,
    );
    return { payoutId, status: 'processing', stub: true };
  }
}

/**
 * Live impl — routes payout through Netavon (Razorpay Route transfer). NOT YET
 * WIRED.
 */
export class LivePayoutAdapter implements PayoutAdapter {
  private readonly logger = new Logger(LivePayoutAdapter.name);
  constructor(private readonly payoutUrl: string) {}

  async releasePayout(): Promise<PayoutResult> {
    // TODO(go-live): POST { product:'kalacube', account, amount } to the Netavon
    // payout endpoint (Razorpay Route transfer / Cashfree Easy Split). The
    // linked-account/beneficiary must exist for the artist first.
    this.logger.warn('LIVE payout releasePayout not yet wired');
    throw new NotImplementedException('LivePayoutAdapter.releasePayout not implemented');
  }
}

export function createPayoutAdapter(config: ConfigService): PayoutAdapter {
  const payoutUrl = (config.get<string>('NETAVON_PAYOUT_URL') || '').trim();
  if (payoutUrl) {
    new Logger('PayoutAdapter').log('LIVE payout mode (NETAVON_PAYOUT_URL set)');
    return new LivePayoutAdapter(payoutUrl);
  }
  new Logger('PayoutAdapter').log('STUB payout mode (no NETAVON_PAYOUT_URL)');
  return new StubPayoutAdapter();
}
