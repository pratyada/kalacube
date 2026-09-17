import { Logger } from '@nestjs/common';
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
  /**
   * Place a print order to be produced & shipped to the buyer.
   *
   * `designUrl` (the artwork image) drives a *custom-design* line item on the
   * configured base SKU. When it is absent the adapter falls back to buying a
   * pre-listed catalog product by SKU (`search_from_my_products = 1`). To wire
   * real custom prints end-to-end, OrdersService should pass `designUrl` (the
   * artwork image URL), `unitPrice`, and the full buyer `ship` address.
   */
  placeOrder(input: {
    orderId: string;
    productId?: string;
    qty: number;
    unitPrice?: number;
    title?: string;
    /** Artwork image URL to print (custom design). Falls back to catalog SKU. */
    designUrl?: string;
    /** Optional mockup image URL (defaults to designUrl). */
    mockupUrl?: string;
    ship: {
      name: string;
      phone?: string;
      email?: string;
      address?: string;
      pincode?: string;
      city?: string;
      province?: string;
      countryCode?: string;
    };
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
 * Live impl — Qikink REST API (verified against the sandbox `sandbox.qikink.com`).
 *
 * Auth: `POST {base}/api/token` (application/x-www-form-urlencoded) with form
 * fields `ClientId` + `client_secret` → `{ ClientId, Accesstoken, expires_in }`.
 * Every other call sends headers `ClientId: <id>` and `Accesstoken: <token>`.
 *
 * Create: `POST {base}/api/order/create` — a JSON body (NOT form-encoded; the
 * form variant makes CodeIgniter throw "Undefined property: line_items"). Custom
 * prints use `search_from_my_products: 0` with a `designs[]` block on a base SKU
 * + `print_type_id`. Response: `{ message, order_id, status_code }`.
 *
 * Status/tracking: `GET {base}/api/order?id=<order_id>` → an array; element 0
 * has `status`, `created_on`, `shipping.{awb,tracking_link,courier_provider_name}`.
 *
 * createProductFromArtwork: Qikink does NOT require pre-registering a product for
 * custom-design orders — the artwork image is supplied inline at order time via
 * the `designs[].design_link`. So this returns a lightweight, network-free ref
 * (no API call) and the image is printed straight from its URL on placeOrder.
 */
export class LivePodAdapter implements PodAdapter {
  private readonly logger = new Logger(LivePodAdapter.name);
  private tokenCache?: { token: string; expiresAt: number };

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly baseUrl: string,
    /** Base catalog SKU the artwork is printed onto (QIKINK_DEFAULT_SKU). */
    private readonly defaultSku: string,
    /** Print method id for that SKU (QIKINK_DEFAULT_PRINT_TYPE_ID, default 1). */
    private readonly defaultPrintTypeId: number,
  ) {}

  /** Fetch + cache the Qikink access token (reused until ~60s before expiry). */
  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this.tokenCache && this.tokenCache.expiresAt > now) {
      return this.tokenCache.token;
    }
    const body = new URLSearchParams({
      ClientId: this.clientId,
      client_secret: this.clientSecret,
    });
    const res = await fetch(`${this.baseUrl}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Qikink token auth failed (HTTP ${res.status}): ${text.slice(0, 200)}`);
    }
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error('Qikink token auth returned non-JSON response');
    }
    const token = json?.Accesstoken;
    if (!token) throw new Error('Qikink token auth response missing Accesstoken');
    const ttlSec = Number(json?.expires_in) || 3600;
    this.tokenCache = { token, expiresAt: now + (ttlSec - 60) * 1000 };
    this.logger.log('Qikink token acquired');
    return token;
  }

  private async authHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
    const token = await this.getToken();
    return { ClientId: this.clientId, Accesstoken: token, ...(extra || {}) };
  }

  async createProductFromArtwork(input: {
    artworkId: string;
    title: string;
    imageUrl?: string;
  }): Promise<PodProduct> {
    // No pre-registration needed for custom-design orders — see class docblock.
    // The lightweight ref just records the artwork; the image is printed inline
    // from its URL at placeOrder time.
    const productId = `qk_design_${input.artworkId}`;
    this.logger.log(`Qikink createProductFromArtwork "${input.title}" → ${productId} (inline design; no API call)`);
    return { productId, stub: false };
  }

  async placeOrder(input: {
    orderId: string;
    productId?: string;
    qty: number;
    unitPrice?: number;
    title?: string;
    designUrl?: string;
    mockupUrl?: string;
    ship: {
      name: string;
      phone?: string;
      email?: string;
      address?: string;
      pincode?: string;
      city?: string;
      province?: string;
      countryCode?: string;
    };
  }): Promise<PodOrder> {
    const qty = Math.max(1, input.qty || 1);
    const unit = Number.isFinite(input.unitPrice) ? Number(input.unitPrice) : 0;
    // order_number is capped at 15 chars by Qikink. Derive a stable, unique-ish
    // code from the Mongo order id (24-hex): "KC" + last 13 chars = 15 chars.
    const orderNumber = `KC${input.orderId.slice(-13)}`;
    const [firstName, ...rest] = (input.ship.name || 'Customer').trim().split(/\s+/);
    const lastName = rest.join(' ') || '.';

    const designUrl = input.designUrl;
    const lineItem: Record<string, unknown> = {
      quantity: String(qty),
      price: String(unit),
      sku: this.defaultSku,
    };
    if (designUrl) {
      // Custom-design line item (artwork printed onto the base SKU).
      lineItem.search_from_my_products = 0;
      lineItem.print_type_id = this.defaultPrintTypeId;
      lineItem.designs = [
        {
          design_code: `KC-${(input.productId || input.orderId).slice(-12)}`,
          width_inches: '12',
          height_inches: '16',
          placement_sku: 'fr',
          design_link: designUrl,
          mockup_link: input.mockupUrl || designUrl,
        },
      ];
    } else {
      // No artwork image supplied → buy the pre-listed catalog product by SKU.
      this.logger.warn(
        `Qikink placeOrder ${input.orderId}: no designUrl — using catalog SKU ${this.defaultSku} (search_from_my_products=1)`,
      );
      lineItem.search_from_my_products = 1;
    }

    const payload = {
      order_number: orderNumber,
      qikink_shipping: '1', // 1 = Qikink ships to the buyer
      gateway: 'Prepaid',
      total_order_value: String(unit * qty),
      line_items: [lineItem],
      shipping_address: {
        first_name: firstName || 'Customer',
        last_name: lastName,
        address1: input.ship.address || 'NA',
        address2: '',
        phone: input.ship.phone || '0000000000',
        email: input.ship.email || 'orders@kalacube.com',
        city: input.ship.city || 'NA',
        zip: input.ship.pincode || '000000',
        province: input.ship.province || '',
        country_code: input.ship.countryCode || 'IN',
      },
    };

    const res = await fetch(`${this.baseUrl}/api/order/create`, {
      method: 'POST',
      headers: await this.authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
    const providerOrderId = json?.order_id;
    if (!res.ok || !providerOrderId) {
      const detail = json?.error || json?.message || text.slice(0, 200);
      this.logger.error(
        `Qikink order/create failed for ${input.orderId} (order_number ${orderNumber}): ${detail}`,
      );
      throw new Error(`Qikink order/create failed: ${detail}`);
    }
    this.logger.log(
      `Qikink order placed: order ${input.orderId} → provider order_id ${providerOrderId}`,
    );

    // Best-effort enrich with AWB/tracking (usually null until Qikink processes).
    let awb: string | undefined;
    let trackingUrl: string | undefined;
    try {
      const t = await this.getTracking(String(providerOrderId));
      const raw = (t as any).raw;
      awb = raw?.shipping?.awb || undefined;
      trackingUrl = raw?.shipping?.tracking_link || undefined;
    } catch (err) {
      this.logger.warn(`Qikink post-create tracking lookup skipped: ${(err as Error).message}`);
    }

    return { providerOrderId: String(providerOrderId), awb, trackingUrl, stub: false };
  }

  async getTracking(providerOrderId: string): Promise<PodTracking> {
    const res = await fetch(
      `${this.baseUrl}/api/order?id=${encodeURIComponent(providerOrderId)}`,
      { method: 'GET', headers: await this.authHeaders() },
    );
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Qikink order status failed (HTTP ${res.status}): ${text.slice(0, 200)}`);
    }
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error('Qikink order status returned non-JSON response');
    }
    const order = Array.isArray(json) ? json[0] : json;
    if (!order) {
      return { status: 'UNKNOWN', events: [], stub: false };
    }
    const status = String(order.status || 'UNKNOWN');
    const events: { status: string; note?: string; at: Date }[] = [
      {
        status,
        note: order.shipping?.courier_provider_name
          ? `Courier: ${order.shipping.courier_provider_name}`
          : undefined,
        at: order.created_on ? new Date(order.created_on) : new Date(),
      },
    ];
    const result: PodTracking & { raw?: unknown } = { status, events, stub: false };
    // Attach the raw order so placeOrder can lift AWB/tracking without a 2nd map.
    (result as any).raw = order;
    return result;
  }
}

export function createPodAdapter(config: ConfigService): PodAdapter {
  const clientId = (config.get<string>('QIKINK_CLIENT_ID') || '').trim();
  const clientSecret = (config.get<string>('QIKINK_CLIENT_SECRET') || '').trim();
  if (clientId && clientSecret) {
    const baseUrl =
      (config.get<string>('QIKINK_BASE_URL') || '').trim() || 'https://api.qikink.com';
    // Base SKU the artwork is printed onto. Sandbox has no poster/canvas SKU set
    // up, so the default is a verified-working sandbox apparel SKU. In prod set
    // QIKINK_DEFAULT_SKU to the real poster/canvas/frame SKU from the KalaCUBE
    // Qikink catalog (+ its matching QIKINK_DEFAULT_PRINT_TYPE_ID).
    const defaultSku =
      (config.get<string>('QIKINK_DEFAULT_SKU') || '').trim() || 'MRnHS-Wh-S';
    const defaultPrintTypeId =
      Number(config.get<string>('QIKINK_DEFAULT_PRINT_TYPE_ID')) || 1;
    new Logger('PodAdapter').log(
      `LIVE Qikink mode (QIKINK_* set) base=${baseUrl} sku=${defaultSku} ptid=${defaultPrintTypeId}`,
    );
    return new LivePodAdapter(clientId, clientSecret, baseUrl, defaultSku, defaultPrintTypeId);
  }
  new Logger('PodAdapter').log('STUB Qikink mode (no QIKINK_* keys)');
  return new StubPodAdapter();
}
