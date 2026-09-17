import { Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Print-on-demand abstraction (Qikink). Track B: Qikink prints, packs and ships
 * prints/merch direct to the buyer; KalaCUBE never touches inventory.
 *
 * Env to go live: QIKINK_CLIENT_ID, QIKINK_CLIENT_SECRET (+ optional
 * QIKINK_BASE_URL). Absent → StubPodAdapter (no network calls).
 */
export interface PodProduct {
  productId: string;
  stub: boolean;
}
export interface PodOrder {
  providerOrderId: string;
  awb?: string;
  trackingUrl?: string;
  stub: boolean;
}
export interface PodTracking {
  status: string;
  events: { status: string; note?: string; at: Date }[];
  stub: boolean;
}

export interface PodAdapter {
  /** Register a printable product derived from an artwork's image/metadata. */
  createProductFromArtwork(input: {
    artworkId: string;
    title: string;
    imageUrl?: string;
  }): Promise<PodProduct>;
  /** Place a print order to be produced & shipped to the buyer. */
  placeOrder(input: {
    orderId: string;
    productId?: string;
    qty: number;
    ship: { name: string; phone?: string; address?: string; pincode?: string };
  }): Promise<PodOrder>;
  /** Poll fulfilment status for a placed POD order. */
  getTracking(providerOrderId: string): Promise<PodTracking>;
}

/** Default, network-free implementation. */
export class StubPodAdapter implements PodAdapter {
  private readonly logger = new Logger(StubPodAdapter.name);

  async createProductFromArtwork(input: {
    artworkId: string;
    title: string;
  }): Promise<PodProduct> {
    const productId = `stub_qk_prod_${input.artworkId}`;
    this.logger.log(`[STUB] Qikink createProductFromArtwork "${input.title}" → ${productId}`);
    return { productId, stub: true };
  }

  async placeOrder(input: { orderId: string }): Promise<PodOrder> {
    const providerOrderId = `stub_qk_ord_${Date.now()}`;
    this.logger.log(`[STUB] Qikink placeOrder ${input.orderId} → ${providerOrderId}`);
    return {
      providerOrderId,
      awb: `STUBAWB${Math.floor(Math.random() * 1e9)}`,
      trackingUrl: `https://track.kalacube.com/stub/${providerOrderId}`,
      stub: true,
    };
  }

  async getTracking(providerOrderId: string): Promise<PodTracking> {
    this.logger.log(`[STUB] Qikink getTracking ${providerOrderId}`);
    return {
      status: 'IN_TRANSIT',
      events: [{ status: 'PRINTED', note: 'Stub event', at: new Date() }],
      stub: true,
    };
  }
}

/**
 * Live impl — Qikink REST API. NOT YET WIRED. Env creds gate its selection; the
 * method bodies below are the finish-line TODOs.
 */
export class LivePodAdapter implements PodAdapter {
  private readonly logger = new Logger(LivePodAdapter.name);
  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly baseUrl: string,
  ) {}

  async createProductFromArtwork(): Promise<PodProduct> {
    // TODO(go-live): auth (client_id/secret → token) then POST to Qikink
    // /api/product create with the artwork image + variant mapping.
    this.logger.warn('LIVE Qikink createProductFromArtwork not yet wired');
    throw new NotImplementedException('LivePodAdapter.createProductFromArtwork not implemented');
  }
  async placeOrder(): Promise<PodOrder> {
    // TODO(go-live): POST Qikink /api/order with line items + shipping address.
    throw new NotImplementedException('LivePodAdapter.placeOrder not implemented');
  }
  async getTracking(): Promise<PodTracking> {
    // TODO(go-live): GET Qikink order status.
    throw new NotImplementedException('LivePodAdapter.getTracking not implemented');
  }
}

export function createPodAdapter(config: ConfigService): PodAdapter {
  const clientId = (config.get<string>('QIKINK_CLIENT_ID') || '').trim();
  const clientSecret = (config.get<string>('QIKINK_CLIENT_SECRET') || '').trim();
  if (clientId && clientSecret) {
    const baseUrl =
      (config.get<string>('QIKINK_BASE_URL') || '').trim() || 'https://api.qikink.com';
    new Logger('PodAdapter').log('LIVE Qikink mode (QIKINK_* set)');
    return new LivePodAdapter(clientId, clientSecret, baseUrl);
  }
  new Logger('PodAdapter').log('STUB Qikink mode (no QIKINK_* keys)');
  return new StubPodAdapter();
}
