import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import {
  FulfilmentStatus,
  Order,
  OrderTrack,
} from './schemas/order.schema';
import { Artwork } from '../explore/schemas/artwork.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { UserRepository } from '../user/user.repository';
import { EmailService } from '../email/email.service';
import type { PaymentAdapter } from './adapters/payment.adapter';
import type { PodAdapter } from './adapters/pod.adapter';
import type { LogisticsAdapter } from './adapters/logistics.adapter';
import type { PayoutAdapter } from './adapters/payout.adapter';

/** DI tokens for the env-gated external adapters. */
export const PAYMENT_ADAPTER = 'PAYMENT_ADAPTER';
export const POD_ADAPTER = 'POD_ADAPTER';
export const LOGISTICS_ADAPTER = 'LOGISTICS_ADAPTER';
export const PAYOUT_ADAPTER = 'PAYOUT_ADAPTER';

/** HTML-escape untrusted input before dropping it into an email body. */
function esc(s?: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
    const resolved: {
      artworkId: string;
      title: string;
      kind: 'original' | 'print';
      qty: number;
      unitPrice: number;
      artist: Types.ObjectId;
    }[] = [];

    for (const item of dto.items) {
      if (!Types.ObjectId.isValid(item.artworkId)) {
        throw new BadRequestException(`Invalid artwork id: ${item.artworkId}`);
      }
      const art = await this.artworkModel.findById(item.artworkId).lean();
      if (!art) throw new NotFoundException(`Artwork not found: ${item.artworkId}`);
      if (!art.artist) throw new BadRequestException('Artwork has no artist');
      resolved.push({
        artworkId: item.artworkId,
        title: art.title || 'Untitled',
        kind: item.kind === 'print' ? 'print' : 'original',
        qty: Math.max(1, item.qty || 1),
        unitPrice: Number(art.cost || 0),
        artist: art.artist as Types.ObjectId,
      });
    }

    const artistId = resolved[0].artist;
    if (resolved.some((r) => r.artist.toString() !== artistId.toString())) {
      throw new BadRequestException('All items must be from the same artist');
    }

    // Track: POD when every line is a print, else originals.
    const track: OrderTrack = resolved.every((r) => r.kind === 'print')
      ? 'pod'
      : 'original';

    // All-in pricing (server-authoritative).
    const art = resolved.reduce((s, r) => s + r.unitPrice * r.qty, 0);
    const shipping = this.shippingFlat();
    const gst = Math.round(art * this.gstRate());
    const total = art + shipping + gst;

    const artist = await this.userRepo.findUserById(artistId.toString());
    if (!artist) throw new NotFoundException('Artist not found');

    // Create a HELD payment (stub by default — no real charge).
    const payment = await this.payment.createOrder(total, { track });

    const order = await this.orderModel.create({
      buyer: {
        name: dto.buyerName.trim(),
        email: dto.buyerEmail.trim().toLowerCase(),
        phone: dto.buyerPhone?.trim(),
      },
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
        this.pushEvent(order, 'SHIPMENT_CREATED', 'POD order placed with Qikink');
      } else {
        const shipment = await this.logistics.createShipment({
          orderId: order._id.toString(),
          pickup: { name: 'Artist' },
          drop: { name: order.buyer.name, phone: order.buyer.phone },
        });
        order.shipment = {
          ...(order.shipment || {}),
          provider: shipment.provider,
          awb: shipment.awb,
          courier: shipment.courier,
          labelUrl: shipment.labelUrl,
          trackingUrl: shipment.trackingUrl,
          events: order.shipment?.events || [],
        };
        order.fulfilmentStatus = 'SHIPMENT_CREATED';
        this.pushEvent(order, 'SHIPMENT_CREATED', 'Shipment created with Shiprocket');

        const pickup = await this.logistics.schedulePickup(shipment.awb);
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
      this.logger.error('Shipment creation failed; order left at PAID', err as Error);
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

  /** Order + current tracking. Public so the buyer's tracking view can read it. */
  async getOne(id: string) {
    const order = await this.getOrderOr404(id);
    return this.publicOrder(order);
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

  // ---- helpers -------------------------------------------------------------

  private async getOrderOr404(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Order not found');
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
    const o: any = typeof (order as any).toObject === 'function'
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
            <p><strong>Total:</strong> ${inr(order.amount.total)}</p>
            <p style="color:#6b7280">Order reference: ${order._id.toString()}</p>
          </div>
          <p style="color:#6b7280;font-size:13px">You can track your order here: <a href="${this.clientUrl()}/orders/${order._id.toString()}">${this.clientUrl()}/orders/${order._id.toString()}</a></p>
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
              : 'We\'ve created the shipping label and scheduled a doorstep pickup. Pack the piece per the art-safe guide; the courier comes to you.'
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
