import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { randomBytes, timingSafeEqual } from 'crypto';
import { FulfilmentStatus, Order, OrderTrack } from './schemas/order.schema';
import { Artwork } from '../explore/schemas/artwork.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { UserRepository } from '../user/user.repository';
import { EmailService } from '../email/email.service';
import type { PaymentAdapter } from './adapters/payment.adapter';
import type { PodAdapter } from './adapters/pod.adapter';
import type { LogisticsAdapter } from './adapters/logistics.adapter';
import type { PayoutAdapter } from './adapters/payout.adapter';
import type { StripeAdapter } from './adapters/stripe.adapter';
import {
  inLocalZone,
  isLocalOnly,
  normalizePostal,
  parseFsaList,
  sellerMarket,
} from './market';

/** DI tokens for the env-gated external adapters. */
export const PAYMENT_ADAPTER = 'PAYMENT_ADAPTER';
export const POD_ADAPTER = 'POD_ADAPTER';
export const LOGISTICS_ADAPTER = 'LOGISTICS_ADAPTER';
export const PAYOUT_ADAPTER = 'PAYOUT_ADAPTER';
export const STRIPE_ADAPTER = 'STRIPE_ADAPTER';

/** HTML-escape untrusted input before dropping it into an email body. */
function esc(s?: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Map a Shiprocket status string → our fulfilment state (null = ignore). */
function mapShiprocketStatus(s: string): FulfilmentStatus | null {
  const t = (s || '').toUpperCase();
  if (t.includes('DELIVERED')) return 'DELIVERED';
  if (t.includes('RTO')) return 'RTO';
  if (t.includes('UNDELIVERED') || t.includes('NDR')) return 'NDR';
  if (
    t.includes('OUT FOR DELIVERY') ||
    t.includes('IN TRANSIT') ||
    t.includes('IN-TRANSIT') ||
    t.includes('SHIPPED')
  )
    return 'IN_TRANSIT';
  if (
    t.includes('PICKED UP') ||
    t.includes('OUT FOR PICKUP') ||
    t.includes('PICKUP DONE')
  )
    return 'PICKED_UP';
  if (t.includes('PICKUP SCHEDULED') || t.includes('PICKUP GENERATED'))
    return 'PICKUP_SCHEDULED';
  return null;
}

function inr(n: number): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
  }
}

/** Currency-aware money for emails (INR keeps the legacy formatter). */
function money(n: number, currency?: string): string {
  if (!currency || currency === 'INR') return inr(n);
  try {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;

type ResolvedLine = {
  artworkId: string;
  title: string;
  kind: 'original' | 'print';
  qty: number;
  unitPrice: number;
  artist: Types.ObjectId;
  localOnly: boolean;
  available: boolean;
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Artwork.name) private artworkModel: Model<Artwork>,
    private readonly userRepo: UserRepository,
    private readonly email: EmailService,
    private readonly config: ConfigService,
    @Inject(PAYMENT_ADAPTER) private readonly payment: PaymentAdapter,
    @Inject(POD_ADAPTER) private readonly pod: PodAdapter,
    @Inject(LOGISTICS_ADAPTER) private readonly logistics: LogisticsAdapter,
    @Inject(PAYOUT_ADAPTER) private readonly payout: PayoutAdapter,
    @Inject(STRIPE_ADAPTER) private readonly stripe: StripeAdapter,
  ) {}

  private shippingFlat(): number {
    return Number(this.config.get('COMMERCE_SHIPPING_FLAT') ?? 150);
  }
  private gstRate(): number {
    return Number(this.config.get('COMMERCE_GST_RATE') ?? 0.12);
  }
  private commissionRate(): number {
    return Number(this.config.get('COMMERCE_COMMISSION_RATE') ?? 0.15);
  }

  /**
   * Public checkout. Resolves the artwork(s), computes the all-in price
   * (art + shipping + GST) server-side, creates a HELD payment via the payment
   * adapter (stub by default), persists the order as `pending`/`PENDING`, and
   * emails buyer + artist. Returns the order and the client payment payload.
   */
  async create(dto: CreateOrderDto) {
    // Honeypot filled → treat as spam. Acknowledge without persisting.
    if (dto.company && dto.company.trim().length > 0) {
      this.logger.warn('Dropped honeypot-flagged order submission');
      return { ok: true };
    }

    if (!dto.items?.length) throw new BadRequestException('No items');

    // Resolve every artwork. All items must belong to ONE artist (a cart is
    // scoped to a single artist for v1).
    const resolved: ResolvedLine[] = [];

    for (const item of dto.items) {
      if (!Types.ObjectId.isValid(item.artworkId)) {
        throw new BadRequestException(`Invalid artwork id: ${item.artworkId}`);
      }
      const art = await this.artworkModel.findById(item.artworkId).lean();
      if (!art)
        throw new NotFoundException(`Artwork not found: ${item.artworkId}`);
      if (!art.artist) throw new BadRequestException('Artwork has no artist');
      resolved.push({
        artworkId: item.artworkId,
        title: art.title || 'Untitled',
        kind: item.kind === 'print' ? 'print' : 'original',
        qty: Math.max(1, item.qty || 1),
        unitPrice: Number(art.cost || 0),
        artist: art.artist as Types.ObjectId,
        localOnly: isLocalOnly(art as any),
        available: (art as any).available !== false,
      });
    }

    const artistId = resolved[0].artist;
    if (resolved.some((r) => r.artist.toString() !== artistId.toString())) {
      throw new BadRequestException('All items must be from the same artist');
    }

    // Market is decided by the SELLER's profile country. Canada (incl. JLPS)
    // runs on CAD + Stripe + KalaCUBE delivery; India keeps the flow below.
    const seller = await this.userRepo.findUserById(artistId.toString());
    if (!seller) throw new NotFoundException('Artist not found');
    if (sellerMarket(seller as any) === 'CA') {
      return this.createCanada(dto, resolved, seller);
    }

    // Track: POD when every line is a print, else originals.
    const track: OrderTrack = resolved.every((r) => r.kind === 'print')
      ? 'pod'
      : 'original';

    // Originals ship via courier → a full deliverable address is mandatory.
    if (track === 'original') {
      const missing: string[] = [];
      if (!dto.buyerPhone?.trim()) missing.push('phone');
      if (!dto.shippingAddress?.trim()) missing.push('address');
      if (!dto.shippingCity?.trim()) missing.push('city');
      if (!dto.shippingState?.trim()) missing.push('state');
      if (!/^\d{6}$/.test((dto.shippingPincode || '').trim()))
        missing.push('pincode');
      if (missing.length) {
        throw new BadRequestException(
          `Shipping details required for original artwork: ${missing.join(', ')}`,
        );
      }
    }

    // All-in pricing (server-authoritative).
    const art = resolved.reduce((s, r) => s + r.unitPrice * r.qty, 0);
    const shipping = this.shippingFlat();
    const gst = Math.round(art * this.gstRate());
    const total = art + shipping + gst;

    const artist = await this.userRepo.findUserById(artistId.toString());
    if (!artist) throw new NotFoundException('Artist not found');

    // Per-artist commerce gate: only pilot sellers accept online orders.
    if (!(artist as any).pilotSeller) {
      throw new ForbiddenException(
        'This artist is not open for online checkout yet',
      );
    }

    // Create a HELD payment (stub by default — no real charge).
    const payment = await this.payment.createOrder(total, { track });

    const order = await this.orderModel.create({
      buyer: {
        name: dto.buyerName.trim(),
        email: dto.buyerEmail.trim().toLowerCase(),
        phone: dto.buyerPhone?.trim(),
      },
      shipTo: {
        address: dto.shippingAddress?.trim(),
        city: dto.shippingCity?.trim(),
        state: dto.shippingState?.trim(),
        pincode: dto.shippingPincode?.trim(),
        country: 'India',
      },
      publicToken: randomBytes(16).toString('hex'),
      artistId,
      items: resolved.map((r) => ({
        artworkId: r.artworkId,
        title: r.title,
        kind: r.kind,
        qty: r.qty,
        unitPrice: r.unitPrice,
      })),
      amount: { art, shipping, gst, total },
      currency: 'INR',
      track,
      paymentStatus: 'pending',
      paymentRef: payment.orderId,
      fulfilmentStatus: 'PENDING',
      shipment: { events: [] },
      payout: {
        gross: art,
        commission: Math.round(art * this.commissionRate()),
        net: art - Math.round(art * this.commissionRate()),
        status: 'pending',
      },
    });

    try {
      await this.notifyArtistNewOrder(artist, order);
      await this.confirmBuyerOrder(order);
    } catch (err) {
      this.logger.error('Order email dispatch failed', err as Error);
    }

    return {
      ok: true,
      order: this.publicOrder(order),
      payment,
    };
  }

  /**
   * Mark an order paid and advance the fulfilment state machine: verify payment
   * → PAID → create the shipment via the right adapter (POD or logistics) →
   * SHIPMENT_CREATED → schedule pickup (originals) → PICKUP_SCHEDULED.
   */
  async confirm(id: string, dto: ConfirmOrderDto) {
    const order = await this.getOrderOr404(id);
    if (order.market === 'CA') return this.confirmCanada(order, dto);

    if (order.paymentStatus === 'paid') {
      return { ok: true, order: this.publicOrder(order), alreadyPaid: true };
    }

    const verified = await this.payment.verifyPayment({
      orderId: dto.razorpayOrderId || order.paymentRef,
      paymentId: dto.razorpayPaymentId,
      signature: dto.razorpaySignature,
    });
    if (!verified) throw new BadRequestException('Payment verification failed');

    order.paymentStatus = 'paid';
    if (dto.razorpayPaymentId) order.paymentRef = dto.razorpayPaymentId;
    order.fulfilmentStatus = 'PAID';
    this.pushEvent(order, 'PAID', 'Payment captured (held)');

    // Create the shipment on the correct track.
    try {
      if (order.track === 'pod') {
        const podOrder = await this.pod.placeOrder({
          orderId: order._id.toString(),
          qty: order.items.reduce((s, i) => s + (i.qty || 1), 0),
          ship: {
            name: order.buyer.name,
            phone: order.buyer.phone,
          },
        });
        order.shipment = {
          ...(order.shipment || {}),
          provider: 'qikink',
          awb: podOrder.awb,
          trackingUrl: podOrder.trackingUrl,
          events: order.shipment?.events || [],
        };
        order.fulfilmentStatus = 'SHIPMENT_CREATED';
        this.pushEvent(
          order,
          'SHIPMENT_CREATED',
          'POD order placed with Qikink',
        );
      } else {
        // Resolve the artist's registered pickup address (falls back to their
        // profile location for city/state when the pickup sub-doc is sparse).
        const artist = await this.userRepo.findUserById(
          order.artistId.toString(),
        );
        const pk = (artist as any)?.pickup || {};
        const shipment = await this.logistics.createShipment({
          orderId: order._id.toString(),
          items: order.items.map((i) => ({
            name: i.title || 'Original artwork',
            sku: `KC-${order._id.toString().slice(-8)}`,
            units: i.qty || 1,
            sellingPrice: i.unitPrice || order.amount.art,
          })),
          pickup: {
            name: artist?.firstName || artist?.username || 'Artist',
            phone: pk.phone || artist?.phone,
            address: pk.address,
            city: pk.city || artist?.location?.city,
            state: pk.state || artist?.location?.state,
            pincode: pk.pincode,
            shiprocketLocation: pk.shiprocketLocation,
          },
          drop: {
            name: order.buyer.name,
            phone: order.buyer.phone,
            email: order.buyer.email,
            address: order.shipTo?.address,
            city: order.shipTo?.city,
            state: order.shipTo?.state,
            pincode: order.shipTo?.pincode,
          },
          parcel: {
            weightKg: 1,
            declaredValue: order.amount.art,
            lengthCm: 30,
            breadthCm: 30,
            heightCm: 5,
          },
        });
        order.shipment = {
          ...(order.shipment || {}),
          provider: shipment.provider,
          shipmentId: shipment.shipmentId,
          awb: shipment.awb,
          courier: shipment.courier,
          labelUrl: shipment.labelUrl,
          trackingUrl: shipment.trackingUrl,
          events: order.shipment?.events || [],
        };
        order.fulfilmentStatus = 'SHIPMENT_CREATED';
        this.pushEvent(
          order,
          'SHIPMENT_CREATED',
          'Shipment created with Shiprocket',
        );

        const pickup = await this.logistics.schedulePickup(
          shipment.shipmentId || shipment.awb,
        );
        order.shipment.pickupDate = pickup.pickupDate;
        order.fulfilmentStatus = 'PICKUP_SCHEDULED';
        this.pushEvent(
          order,
          'PICKUP_SCHEDULED',
          `Doorstep pickup on ${pickup.pickupDate.toDateString()}`,
        );
      }
    } catch (err) {
      // Never lose the payment record because a (stubbed) shipment call failed.
      this.logger.error(
        'Shipment creation failed; order left at PAID',
        err as Error,
      );
    }

    await order.save();

    try {
      await this.notifyArtistPaid(order);
    } catch (err) {
      this.logger.error('Paid-order email dispatch failed', err as Error);
    }

    return { ok: true, order: this.publicOrder(order) };
  }

  /** The signed-in artist's own sales (newest first) + status counts. */
  async listMine(userId: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return { items: [], counts: {} };
    }
    const artistId = new Types.ObjectId(userId);
    const [items, grouped] = await Promise.all([
      this.orderModel.find({ artistId }).sort({ createdAt: -1 }).lean(),
      this.orderModel.aggregate([
        { $match: { artistId } },
        { $group: { _id: '$fulfilmentStatus', n: { $sum: 1 } } },
      ]),
    ]);
    const counts: Record<string, number> = { total: 0 };
    for (const g of grouped) {
      counts[g._id] = g.n;
      counts.total += g.n;
    }
    return { items, counts };
  }

  /**
   * PUBLIC order tracking by capability token (`publicToken`) — returns a
   * PII-stripped view (no buyer email/phone, no shipTo, no prepaid label).
   */
  async getPublicTracking(token: string) {
    if (!token || token.length < 8)
      throw new NotFoundException('Order not found');
    const order = await this.orderModel.findOne({ publicToken: token }).lean();
    if (!order) throw new NotFoundException('Order not found');
    return this.trackingView(order);
  }

  private trackingView(o: any) {
    return {
      _id: o._id,
      publicToken: o.publicToken,
      items: o.items,
      amount: o.amount,
      currency: o.currency,
      track: o.track,
      paymentStatus: o.paymentStatus,
      fulfilmentStatus: o.fulfilmentStatus,
      buyer: { name: o.buyer?.name }, // name only — no email/phone
      shipment: o.shipment
        ? {
            provider: o.shipment.provider,
            courier: o.shipment.courier,
            awb: o.shipment.awb,
            pickupDate: o.shipment.pickupDate,
            trackingUrl: o.shipment.trackingUrl,
            events: o.shipment.events,
          }
        : undefined,
      createdAt: o.createdAt,
    };
  }

  /**
   * Shiprocket tracking webhook → advance the fulfilment state machine. Verified
   * by a shared secret (x-api-key). Idempotent: only writes on a real change.
   */
  async handleShiprocketWebhook(body: any, token: string) {
    const expected = (
      this.config.get<string>('SHIPROCKET_WEBHOOK_TOKEN') || ''
    ).trim();
    if (!expected) {
      this.logger.warn(
        'Shiprocket webhook hit but SHIPROCKET_WEBHOOK_TOKEN is unset',
      );
      throw new ForbiddenException('webhook not configured');
    }
    const a = Buffer.from(expected);
    const b = Buffer.from((token || '').trim());
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new ForbiddenException('bad webhook token');
    }
    const awb = String(body?.awb ?? body?.data?.awb ?? '').trim();
    const srStatus = String(
      body?.current_status ?? body?.shipment_status ?? body?.status ?? '',
    ).trim();
    if (!awb) return { ok: true, ignored: 'no awb' };
    const order = await this.orderModel.findOne({ 'shipment.awb': awb });
    if (!order) return { ok: true, ignored: 'unknown awb' };
    const mapped = mapShiprocketStatus(srStatus);
    if (mapped && order.fulfilmentStatus !== mapped) {
      order.fulfilmentStatus = mapped;
      this.pushEvent(order, mapped, `Shiprocket: ${srStatus}`);
      await order.save();
    }
    return { ok: true, status: order.fulfilmentStatus };
  }

  /** Artist/admin-scoped fulfilment transition. */
  async updateStatus(
    id: string,
    user: { _id?: Types.ObjectId; role?: string },
    status: FulfilmentStatus,
  ) {
    const order = await this.getOrderOr404(id);
    const isOwner = order.artistId.toString() === user?._id?.toString();
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    if (!isOwner && !isAdmin) throw new ForbiddenException('Not your order');

    order.fulfilmentStatus = status;
    this.pushEvent(order, status, 'Status updated');

    // Releasing the payout is a terminal, side-effecting transition.
    if (status === 'PAID_OUT') {
      try {
        const result = await this.payout.releasePayout({
          orderId: order._id.toString(),
          artistId: order.artistId.toString(),
          gross: order.payout?.gross || order.amount.art,
          commission: order.payout?.commission || 0,
          net: order.payout?.net || order.amount.art,
        });
        order.payout = { ...(order.payout || {}), status: result.status };
      } catch (err) {
        this.logger.error('Payout release failed', err as Error);
      }
    }
    if (status === 'REFUNDED') order.paymentStatus = 'refunded';

    await order.save();
    return { ok: true, order: this.publicOrder(order) };
  }

  // ---- Canada market (CAD · Stripe · KalaCUBE delivery) --------------------

  /**
   * Canada checkout. Validates the Canadian address + delivery zone, prices in
   * CAD (community/JLPS = 0% commission → 100% to the maker), opens a Stripe
   * Checkout Session and returns its hosted URL. Emails go out only once paid
   * (abandoned checkouts don't spam the family).
   */
  private async createCanada(
    dto: CreateOrderDto,
    lines: ResolvedLine[],
    seller: any,
  ) {
    const isCommunity = !!seller.community;

    // Sales gate: community markets open on a date; other CA sellers use the
    // per-artist pilot gate like India.
    if (isCommunity) {
      const openAt = Date.parse(
        this.config.get<string>('COMMUNITY_SALES_OPEN_AT') || '',
      );
      if (Number.isFinite(openAt) && Date.now() < openAt) {
        throw new ForbiddenException(
          `The market opens on ${new Date(openAt).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', timeZone: 'America/Toronto' })}. See you then!`,
        );
      }
    } else if (!seller.pilotSeller) {
      throw new ForbiddenException(
        'This artist is not open for online checkout yet',
      );
    }

    if (lines.some((l) => !l.available)) {
      throw new BadRequestException('Sorry, this item has already been sold.');
    }
    if (lines.some((l) => l.kind === 'print')) {
      throw new BadRequestException('Prints are not available in Canada yet.');
    }
    // Never take "orders" without a real payment in production.
    if (!this.stripe.live && process.env.NODE_ENV === 'production') {
      throw new ServiceUnavailableException(
        'Online payment is not switched on yet. Please try again soon.',
      );
    }

    const postal = normalizePostal(dto.shippingPincode);
    const missing: string[] = [];
    if (!dto.buyerPhone?.trim()) missing.push('phone');
    if (!dto.shippingAddress?.trim()) missing.push('address');
    if (!dto.shippingCity?.trim()) missing.push('city');
    if (!dto.shippingState?.trim()) missing.push('province');
    if (!postal) missing.push('postal code');
    if (missing.length) {
      throw new BadRequestException(
        `Delivery details required: ${missing.join(', ')}`,
      );
    }

    const fsas = parseFsaList(
      this.config.get<string>('COMMERCE_CA_LOCAL_FSAS'),
    );
    const local = inLocalZone(postal as string, fsas);
    const needsLocal = lines.some((l) => l.localOnly);
    if (needsLocal && !local) {
      throw new BadRequestException(
        `Sorry, ${lines.length > 1 ? 'these items are' : 'this item is'} delivered by hand only within CityPlace and downtown Toronto (postal codes starting ${fsas.join(', ')}).`,
      );
    }
    const delivery: 'local' | 'ship_ca' = local ? 'local' : 'ship_ca';

    const art = round2(lines.reduce((s, l) => s + l.unitPrice * l.qty, 0));
    if (art <= 0) throw new BadRequestException('This item has no price yet.');
    const shipping = round2(
      delivery === 'local'
        ? Number(this.config.get('COMMERCE_CA_LOCAL_DELIVERY_FEE') ?? 0)
        : Number(this.config.get('COMMERCE_CA_SHIPPING_FLAT') ?? 15),
    );
    const total = round2(art + shipping);
    const rate = isCommunity
      ? 0
      : Number(this.config.get('COMMERCE_CA_COMMISSION_RATE') ?? 0.15);
    const commission = round2(art * rate);

    const order = await this.orderModel.create({
      buyer: {
        name: dto.buyerName.trim(),
        email: dto.buyerEmail.trim().toLowerCase(),
        phone: dto.buyerPhone?.trim(),
      },
      shipTo: {
        address: dto.shippingAddress?.trim(),
        city: dto.shippingCity?.trim(),
        state: dto.shippingState?.trim(),
        pincode: postal as string,
        country: 'Canada',
      },
      publicToken: randomBytes(16).toString('hex'),
      artistId: lines[0].artist,
      items: lines.map((l) => ({
        artworkId: l.artworkId,
        title: l.title,
        kind: l.kind,
        qty: l.qty,
        unitPrice: l.unitPrice,
      })),
      amount: { art, shipping, gst: 0, total },
      currency: 'CAD',
      market: 'CA',
      delivery,
      ...(seller.community ? { community: seller.community } : {}),
      track: 'original',
      paymentStatus: 'pending',
      paymentRef: 'pending',
      fulfilmentStatus: 'PENDING',
      shipment: { events: [] },
      payout: {
        gross: art,
        commission,
        net: round2(art - commission),
        status: 'pending',
      },
    });

    const origin = this.safeOrigin(dto.returnOrigin);
    const checkoutLines = lines.map((l) => ({
      name: l.title,
      unitAmountCents: Math.round(l.unitPrice * 100),
      qty: l.qty,
    }));
    if (shipping > 0) {
      checkoutLines.push({
        name:
          delivery === 'local'
            ? 'Local delivery (downtown Toronto)'
            : 'Shipping (Canada)',
        unitAmountCents: Math.round(shipping * 100),
        qty: 1,
      });
    }

    let checkout;
    try {
      checkout = await this.stripe.createCheckout({
        orderId: order._id.toString(),
        currency: 'cad',
        lines: checkoutLines,
        customerEmail: order.buyer.email,
        successUrl: `${origin}/checkout/success?order=${order._id.toString()}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/art-work/${lines[0].artworkId}?checkout=cancelled`,
      });
    } catch (err) {
      await this.orderModel.findByIdAndDelete(order._id).catch(() => undefined);
      this.logger.error('Stripe checkout creation failed', err as Error);
      throw new ServiceUnavailableException(
        'Could not start payment. Please try again.',
      );
    }
    order.paymentRef = checkout.sessionId;
    await order.save();

    return {
      ok: true,
      order: this.publicOrder(order),
      payment: {
        provider: 'stripe',
        orderId: checkout.sessionId,
        checkoutUrl: checkout.url,
        amount: Math.round(total * 100),
        currency: 'CAD',
        stub: checkout.stub,
      },
    };
  }

  /**
   * Canada confirmation: re-reads the Checkout Session from Stripe
   * (server-to-server) — only Stripe's `paid` marks the order paid. Then marks
   * the piece(s) sold, and emails buyer, maker family and KalaCUBE ops.
   */
  private async confirmCanada(order: Order, dto: ConfirmOrderDto) {
    if (order.paymentStatus === 'paid') {
      return { ok: true, order: this.publicOrder(order), alreadyPaid: true };
    }
    if (dto.stripeSessionId && dto.stripeSessionId !== order.paymentRef) {
      throw new BadRequestException(
        'Payment session does not match this order',
      );
    }
    const st = await this.stripe.getCheckout(order.paymentRef);
    if (!st.paid) throw new BadRequestException('Payment not completed yet');
    const expected = Math.round(order.amount.total * 100);
    if (st.amountTotalCents !== undefined && st.amountTotalCents !== expected) {
      this.logger.error(
        `Stripe amount mismatch on order ${order._id.toString()}: ${st.amountTotalCents} vs ${expected}`,
      );
      throw new BadRequestException(
        'Payment amount mismatch — please contact support',
      );
    }

    order.paymentStatus = 'paid';
    order.fulfilmentStatus = 'PAID';
    order.shipment = {
      ...(order.shipment || {}),
      provider: order.delivery === 'local' ? 'kalacube-local' : 'kalacube',
      events: order.shipment?.events || [],
    };
    this.pushEvent(
      order,
      'PAID',
      `Payment captured via Stripe${st.paymentIntent ? ` (${st.paymentIntent})` : ''}`,
    );
    await order.save();

    // Handmade one-offs: sold = no longer available.
    await this.artworkModel
      .updateMany(
        {
          _id: { $in: order.items.map((i) => new Types.ObjectId(i.artworkId)) },
        },
        { $set: { available: false } },
      )
      .catch((err) =>
        this.logger.error('Could not mark artwork sold', err as Error),
      );

    try {
      await this.confirmBuyerOrder(order);
      await this.notifyCanadaSold(order);
      await this.notifyOpsDelivery(order);
    } catch (err) {
      this.logger.error(
        'Canada paid-order email dispatch failed',
        err as Error,
      );
    }
    return { ok: true, order: this.publicOrder(order) };
  }

  /** Return-to origin for Stripe redirects — only our own sites. */
  private safeOrigin(requested?: string): string {
    const allowed = (this.config.get<string>('CLIENT_URL') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const r = (requested || '').trim().replace(/\/+$/, '');
    if (r && allowed.includes(r)) return r;
    if (
      r &&
      process.env.NODE_ENV !== 'production' &&
      /^http:\/\/localhost:\d+$/.test(r)
    )
      return r;
    return this.clientUrl();
  }

  private async notifyCanadaSold(order: Order) {
    const seller = await this.userRepo.findUserById(order.artistId.toString());
    if (!seller?.email) return;
    const isJlps = (seller as any).community === 'jlps';
    const maker = esc(seller.firstName || seller.username);
    const titles = order.items.map((i) => esc(i.title)).join(', ');
    await this.email.sendEmail({
      to: seller.email,
      subject: isJlps
        ? `🎉 ${maker} made a sale! — JLPS Winter Craft Market`
        : `You made a sale on KalaCUBE — ${titles}`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#0B1F52;max-width:560px;margin:0 auto">
          <h2 style="color:#D81B60">${isJlps ? `🎉 ${maker} just sold something!` : 'You made a sale!'}</h2>
          <div style="background:#FAF7F2;border-radius:12px;padding:16px 20px;margin:16px 0">
            <p><strong>Sold:</strong> ${titles}</p>
            <p><strong>${isJlps ? 'Your family earns' : 'Your earnings'}:</strong> ${money(order.payout?.net ?? order.amount.art, order.currency)}${isJlps ? ' (100%)' : ''}</p>
          </div>
          <p>${order.delivery === 'local' ? 'The KalaCUBE team will contact you within 1 day to collect the item from you and deliver it to the buyer. Please keep it safe and ready.' : 'The KalaCUBE team will contact you within 1 day about shipping.'} You never need to contact the buyer.</p>
          <p><a href="${this.clientUrl()}/dashboard/orders" style="display:inline-block;background:#202F9A;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px">View in your dashboard</a></p>
        </div>`,
    });
  }

  /** Ops alert to KalaCUBE: collect from the family, deliver to the buyer. */
  private async notifyOpsDelivery(order: Order) {
    const ops = 'contact@kalacube.com';
    const seller = await this.userRepo.findUserById(order.artistId.toString());
    const to = order.shipTo || {};
    await this.email.sendEmail({
      to: ops,
      subject: `[${order.community?.toUpperCase() || 'CA'}] Paid order to ${order.delivery === 'local' ? 'deliver' : 'ship'} — ${order._id.toString()}`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#0B1F52;max-width:620px">
          <h3>Paid ${order.delivery === 'local' ? 'LOCAL DELIVERY' : 'CANADA SHIPPING'} order</h3>
          <p><strong>Items:</strong> ${order.items.map((i) => `${esc(i.title)} × ${i.qty}`).join(', ')}<br/>
          <strong>Total paid:</strong> ${money(order.amount.total, order.currency)} · <strong>Payout to family:</strong> ${money(order.payout?.net ?? order.amount.art, order.currency)}</p>
          <p><strong>Collect from (seller account):</strong> ${esc(seller?.firstName)} ${esc(seller?.lastName)} · ${esc(seller?.email)}${(seller as any)?.communityProfile?.grade ? ` · Grade ${esc((seller as any).communityProfile.grade)}` : ''}</p>
          <p><strong>Deliver to:</strong> ${esc(order.buyer.name)} · ${esc(order.buyer.phone)} · ${esc(order.buyer.email)}<br/>
          ${esc(to.address)}, ${esc(to.city)}, ${esc(to.state)} ${esc(to.pincode)}</p>
          <p>Order ref ${order._id.toString()} · Stripe session ${esc(order.paymentRef)}</p>
        </div>`,
    });
  }

  // ---- helpers -------------------------------------------------------------

  private async getOrderOr404(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException('Order not found');
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private pushEvent(order: Order, status: string, note: string) {
    order.shipment = order.shipment || {};
    order.shipment.events = order.shipment.events || [];
    order.shipment.events.push({ status, note, at: new Date() });
  }

  /** Strip nothing sensitive today (buyer created it), but a single shaping point. */
  private publicOrder(order: Order) {
    const o: any =
      typeof (order as any).toObject === 'function'
        ? (order as any).toObject()
        : order;
    return o;
  }

  private clientUrl(): string {
    return (
      this.config.get<string>('CLIENT_URL')?.split(',')[0]?.trim() ||
      'https://kalacube.com'
    );
  }

  private async notifyArtistNewOrder(
    artist: { email: string; firstName?: string; username: string },
    order: Order,
  ) {
    if (!artist.email) return;
    const titles = order.items.map((i) => esc(i.title)).join(', ');
    await this.email.sendEmail({
      to: artist.email,
      subject: `New order on KalaCUBE — ${titles}`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#0B1F52;max-width:560px;margin:0 auto">
          <h2 style="color:#202F9A">You have a new order</h2>
          <p>Hi ${esc(artist.firstName || artist.username)}, a buyer has placed an order for your work on KalaCUBE.</p>
          <div style="background:#FAF7F2;border-radius:12px;padding:16px 20px;margin:16px 0">
            <p><strong>Items:</strong> ${titles}</p>
            <p><strong>Track:</strong> ${order.track === 'pod' ? 'Print-on-demand' : 'Original'}</p>
            <p><strong>Order total:</strong> ${inr(order.amount.total)} (art ${inr(order.amount.art)} + shipping ${inr(order.amount.shipping)} + GST ${inr(order.amount.gst)})</p>
          </div>
          <p style="color:#6b7280;font-size:13px">Payment is being held. Once it's confirmed we'll create the shipment and email you the prepaid label + pickup date. You only pack and hand over the parcel.</p>
          <p><a href="${this.clientUrl()}/dashboard/orders" style="display:inline-block;background:#202F9A;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px">View in your dashboard</a></p>
        </div>`,
    });
  }

  private async confirmBuyerOrder(order: Order) {
    const titles = order.items.map((i) => esc(i.title)).join(', ');
    await this.email.sendEmail({
      to: order.buyer.email,
      subject: 'We received your order — KalaCUBE',
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#0B1F52;max-width:560px;margin:0 auto">
          <h2 style="color:#202F9A">Thanks, ${esc(order.buyer.name)}!</h2>
          <p>We've received your order on KalaCUBE.</p>
          <div style="background:#FAF7F2;border-radius:12px;padding:16px 20px;margin:16px 0">
            <p><strong>Items:</strong> ${titles}</p>
            <p><strong>Total:</strong> ${money(order.amount.total, order.currency)}</p>
            <p style="color:#6b7280">Order reference: ${order._id.toString()}</p>
          </div>
          <p style="color:#6b7280;font-size:13px">You can track your order here: <a href="${this.clientUrl()}/orders/${order.publicToken}">${this.clientUrl()}/orders/${order.publicToken}</a></p>
          <p style="color:#6b7280;font-size:13px">— The KalaCUBE team</p>
        </div>`,
    });
  }

  private async notifyArtistPaid(order: Order) {
    const artist = await this.userRepo.findUserById(order.artistId.toString());
    if (!artist?.email) return;
    const label = order.shipment?.labelUrl;
    const pickup = order.shipment?.pickupDate;
    await this.email.sendEmail({
      to: artist.email,
      subject: `Payment confirmed — pack & hand over your sold artwork`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#0B1F52;max-width:560px;margin:0 auto">
          <h2 style="color:#202F9A">Your sale is confirmed</h2>
          <p>Payment for your order is confirmed and held. ${
            order.track === 'pod'
              ? 'This is a print-on-demand order — our POD partner prints and ships it. You do nothing.'
              : "We've created the shipping label and scheduled a doorstep pickup. Pack the piece per the art-safe guide; the courier comes to you."
          }</p>
          ${
            order.track === 'original'
              ? `<div style="background:#FAF7F2;border-radius:12px;padding:16px 20px;margin:16px 0">
                  ${pickup ? `<p><strong>Pickup:</strong> ${new Date(pickup).toDateString()}</p>` : ''}
                  ${label ? `<p><a href="${esc(label)}">Download prepaid label</a></p>` : ''}
                </div>`
              : ''
          }
          <p><a href="${this.clientUrl()}/dashboard/orders" style="display:inline-block;background:#202F9A;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px">View order</a></p>
        </div>`,
    });
  }
}
