import { Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Logistics abstraction (Shiprocket) for Track A (originals). KalaCUBE creates
 * the shipment, gets an AWB + prepaid label, schedules a doorstep pickup at the
 * artist, tracks via webhook, and handles reverse pickup for returns.
 *
 * Env to go live: SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD (token auth; cache the
 * token). Absent → StubLogisticsAdapter (no network calls).
 */
export interface CreatedShipment {
  /** Shiprocket shipment_id — needed to assign AWB, print label, book pickup. */
  shipmentId?: string;
  awb: string;
  courier: string;
  labelUrl: string;
  trackingUrl: string;
  provider: 'shiprocket';
  stub: boolean;
}
export interface ScheduledPickup {
  pickupDate: Date;
  stub: boolean;
}
export interface TrackingResult {
  status: string;
  events: { status: string; note?: string; at: Date }[];
  stub: boolean;
}
export interface CreatedReturn {
  returnAwb: string;
  stub: boolean;
}

/** Full address for a pickup (artist) or drop (buyer). */
export interface ShipParty {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  /** Shiprocket pickup-location nickname (pickup side only). */
  shiprocketLocation?: string;
}

export interface CreateShipmentInput {
  orderId: string;
  items?: { name: string; sku?: string; units: number; sellingPrice: number }[];
  pickup: ShipParty;
  drop: ShipParty;
  parcel?: {
    weightKg?: number;
    declaredValue?: number;
    lengthCm?: number;
    breadthCm?: number;
    heightCm?: number;
  };
}

export interface LogisticsAdapter {
  createShipment(input: CreateShipmentInput): Promise<CreatedShipment>;
  /** Book a doorstep pickup for a created shipment (by Shiprocket shipment_id). */
  schedulePickup(shipmentId: string): Promise<ScheduledPickup>;
  track(awb: string): Promise<TrackingResult>;
  createReturn(input: { orderId: string; awb: string }): Promise<CreatedReturn>;
}

/** Default, network-free implementation. */
export class StubLogisticsAdapter implements LogisticsAdapter {
  private readonly logger = new Logger(StubLogisticsAdapter.name);

  async createShipment(input: CreateShipmentInput): Promise<CreatedShipment> {
    const awb = `STUBSR${Math.floor(Math.random() * 1e9)}`;
    this.logger.log(`[STUB] Shiprocket createShipment ${input.orderId} → AWB ${awb}`);
    return {
      shipmentId: `stubship_${Math.floor(Math.random() * 1e9)}`,
      awb,
      courier: 'Stub Express',
      labelUrl: `https://track.kalacube.com/stub/label/${awb}.pdf`,
      trackingUrl: `https://track.kalacube.com/stub/${awb}`,
      provider: 'shiprocket',
      stub: true,
    };
  }

  async schedulePickup(shipmentId: string): Promise<ScheduledPickup> {
    const pickupDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    this.logger.log(`[STUB] Shiprocket schedulePickup ${shipmentId} → ${pickupDate.toDateString()}`);
    return { pickupDate, stub: true };
  }

  async track(awb: string): Promise<TrackingResult> {
    this.logger.log(`[STUB] Shiprocket track ${awb}`);
    return {
      status: 'IN_TRANSIT',
      events: [{ status: 'PICKED_UP', note: 'Stub event', at: new Date() }],
      stub: true,
    };
  }

  async createReturn(input: { orderId: string; awb: string }): Promise<CreatedReturn> {
    this.logger.log(`[STUB] Shiprocket createReturn ${input.orderId} (${input.awb})`);
    return { returnAwb: `STUBRET${Math.floor(Math.random() * 1e9)}`, stub: true };
  }
}

/**
 * Live impl — Shiprocket REST API (Track A / originals). Token-cached like the
 * Qikink POD adapter. Pure `fetch` (no SDK). A doorstep pickup is booked at the
 * artist's registered pickup location; the buyer is the billing/shipping party.
 */
export class LiveLogisticsAdapter implements LogisticsAdapter {
  private readonly logger = new Logger(LiveLogisticsAdapter.name);
  private token = '';
  private tokenExp = 0; // epoch ms

  constructor(
    private readonly email: string,
    private readonly password: string,
    private readonly baseUrl: string,
  ) {}

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExp) return this.token;
    const res = await fetch(`${this.baseUrl}/v1/external/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });
    const body = (await res.json()) as { token?: string; message?: string };
    if (!res.ok || !body?.token) {
      throw new Error(`Shiprocket auth failed: ${body?.message || res.status}`);
    }
    this.token = body.token;
    // Tokens last ~10 days; re-auth every 6h to stay well inside that window.
    this.tokenExp = Date.now() + 6 * 60 * 60 * 1000;
    return this.token;
  }

  private async call<T = any>(
    path: string,
    method: 'GET' | 'POST',
    body?: Record<string, any>,
  ): Promise<T> {
    const token = await this.getToken();
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json().catch(() => ({}))) as any;
    if (!res.ok) {
      const msg = json?.message || json?.error || `HTTP ${res.status}`;
      throw new Error(`Shiprocket ${path} failed: ${msg}`);
    }
    return json as T;
  }

  async createShipment(input: CreateShipmentInput): Promise<CreatedShipment> {
    const { pickup, drop, parcel } = input;
    if (!pickup.shiprocketLocation) {
      throw new Error('Missing artist Shiprocket pickup location');
    }
    if (!drop.pincode || !drop.address || !drop.city || !drop.state) {
      throw new Error('Buyer shipping address is incomplete');
    }
    const now = new Date();
    const orderDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const declared = Math.max(1, Math.round(parcel?.declaredValue ?? 0));
    const items =
      input.items && input.items.length
        ? input.items
        : [{ name: 'Original artwork', sku: `KC-${input.orderId.slice(-8)}`, units: 1, sellingPrice: declared }];

    // 1) Create the order (adhoc) → shipment_id.
    const created = await this.call<any>('/v1/external/orders/create/adhoc', 'POST', {
      order_id: `KC-${input.orderId.slice(-12)}`,
      order_date: orderDate,
      pickup_location: pickup.shiprocketLocation,
      billing_customer_name: drop.name || 'Buyer',
      billing_last_name: '',
      billing_address: drop.address,
      billing_city: drop.city,
      billing_state: drop.state,
      billing_pincode: drop.pincode,
      billing_country: 'India',
      billing_email: drop.email || 'buyer@kalacube.com',
      billing_phone: drop.phone || '',
      shipping_is_billing: true,
      order_items: items.map((i) => ({
        name: i.name,
        sku: i.sku || `KC-${input.orderId.slice(-8)}`,
        units: i.units,
        selling_price: i.sellingPrice,
      })),
      payment_method: 'Prepaid',
      sub_total: declared,
      length: parcel?.lengthCm ?? 30,
      breadth: parcel?.breadthCm ?? 30,
      height: parcel?.heightCm ?? 5,
      weight: parcel?.weightKg ?? 1,
    });
    const shipmentId = String(created?.shipment_id ?? created?.data?.shipment_id ?? '');
    if (!shipmentId) throw new Error('Shiprocket did not return a shipment_id');

    // 2) Assign the cheapest available AWB (Shiprocket auto-selects a courier).
    const awbRes = await this.call<any>('/v1/external/courier/assign/awb', 'POST', {
      shipment_id: shipmentId,
    });
    const awbData = awbRes?.response?.data ?? awbRes?.data ?? {};
    const awb = String(awbData.awb_code ?? '');
    const courier = String(awbData.courier_name ?? 'Shiprocket');
    if (!awb) throw new Error('Shiprocket AWB assignment returned no awb_code');

    // 3) Generate the prepaid label (best-effort — pickup still works without it).
    let labelUrl = '';
    try {
      const labelRes = await this.call<any>('/v1/external/courier/generate/label', 'POST', {
        shipment_id: [Number(shipmentId)],
      });
      labelUrl = String(labelRes?.label_url ?? '');
    } catch (e) {
      this.logger.warn(`Label generation failed for shipment ${shipmentId}: ${(e as Error).message}`);
    }

    return {
      shipmentId,
      awb,
      courier,
      labelUrl,
      trackingUrl: `https://shiprocket.co/tracking/${awb}`,
      provider: 'shiprocket',
      stub: false,
    };
  }

  async schedulePickup(shipmentId: string): Promise<ScheduledPickup> {
    const res = await this.call<any>('/v1/external/courier/generate/pickup', 'POST', {
      shipment_id: [Number(shipmentId)],
    });
    const dateStr =
      res?.response?.pickup_scheduled_date ??
      res?.pickup_scheduled_date ??
      null;
    const pickupDate = dateStr ? new Date(dateStr) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    return { pickupDate, stub: false };
  }

  async track(awb: string): Promise<TrackingResult> {
    const res = await this.call<any>(`/v1/external/courier/track/awb/${awb}`, 'GET');
    const td = res?.tracking_data ?? {};
    const activities: any[] = td?.shipment_track_activities ?? [];
    return {
      status: String(td?.shipment_status ?? 'UNKNOWN'),
      events: activities.map((a) => ({
        status: String(a?.status ?? a?.['sr-status-label'] ?? ''),
        note: a?.activity ?? a?.location ?? undefined,
        at: a?.date ? new Date(a.date) : new Date(),
      })),
      stub: false,
    };
  }

  async createReturn(): Promise<CreatedReturn> {
    // DESCOPED for the pilot — reverse pickup is handled manually until we wire
    // POST /v1/external/orders/create/return post-launch.
    throw new NotImplementedException('LiveLogisticsAdapter.createReturn: descoped for pilot');
  }
}

export function createLogisticsAdapter(config: ConfigService): LogisticsAdapter {
  const email = (config.get<string>('SHIPROCKET_EMAIL') || '').trim();
  const password = (config.get<string>('SHIPROCKET_PASSWORD') || '').trim();
  if (email && password) {
    const baseUrl =
      (config.get<string>('SHIPROCKET_BASE_URL') || '').trim() ||
      'https://apiv2.shiprocket.in';
    new Logger('LogisticsAdapter').log('LIVE Shiprocket mode (SHIPROCKET_* set)');
    return new LiveLogisticsAdapter(email, password, baseUrl);
  }
  new Logger('LogisticsAdapter').log('STUB Shiprocket mode (no SHIPROCKET_* keys)');
  return new StubLogisticsAdapter();
}
