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

export interface LogisticsAdapter {
  createShipment(input: {
    orderId: string;
    pickup: { name: string; pincode?: string; address?: string };
    drop: { name: string; phone?: string; pincode?: string; address?: string };
    parcel?: { weightKg?: number; declaredValue?: number };
  }): Promise<CreatedShipment>;
  schedulePickup(awb: string): Promise<ScheduledPickup>;
  track(awb: string): Promise<TrackingResult>;
  createReturn(input: { orderId: string; awb: string }): Promise<CreatedReturn>;
}

/** Default, network-free implementation. */
export class StubLogisticsAdapter implements LogisticsAdapter {
  private readonly logger = new Logger(StubLogisticsAdapter.name);

  async createShipment(input: { orderId: string }): Promise<CreatedShipment> {
    const awb = `STUBSR${Math.floor(Math.random() * 1e9)}`;
    this.logger.log(`[STUB] Shiprocket createShipment ${input.orderId} → AWB ${awb}`);
    return {
      awb,
      courier: 'Stub Express',
      labelUrl: `https://track.kalacube.com/stub/label/${awb}.pdf`,
      trackingUrl: `https://track.kalacube.com/stub/${awb}`,
      provider: 'shiprocket',
      stub: true,
    };
  }

  async schedulePickup(awb: string): Promise<ScheduledPickup> {
    const pickupDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    this.logger.log(`[STUB] Shiprocket schedulePickup ${awb} → ${pickupDate.toDateString()}`);
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
 * Live impl — Shiprocket REST API. NOT YET WIRED. Creds gate its selection.
 */
export class LiveLogisticsAdapter implements LogisticsAdapter {
  private readonly logger = new Logger(LiveLogisticsAdapter.name);
  constructor(
    private readonly email: string,
    private readonly password: string,
    private readonly baseUrl: string,
  ) {}

  // TODO(go-live): POST /v1/external/auth/login {email,password} → cache token.
  async createShipment(): Promise<CreatedShipment> {
    // TODO(go-live): POST /v1/external/orders/create/adhoc → assign AWB →
    // generate label + manifest. Map to CreatedShipment.
    this.logger.warn('LIVE Shiprocket createShipment not yet wired');
    throw new NotImplementedException('LiveLogisticsAdapter.createShipment not implemented');
  }
  async schedulePickup(): Promise<ScheduledPickup> {
    // TODO(go-live): POST /v1/external/courier/generate/pickup.
    throw new NotImplementedException('LiveLogisticsAdapter.schedulePickup not implemented');
  }
  async track(): Promise<TrackingResult> {
    // TODO(go-live): GET /v1/external/courier/track/awb/{awb} (webhook is primary).
    throw new NotImplementedException('LiveLogisticsAdapter.track not implemented');
  }
  async createReturn(): Promise<CreatedReturn> {
    // TODO(go-live): POST /v1/external/orders/create/return.
    throw new NotImplementedException('LiveLogisticsAdapter.createReturn not implemented');
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
