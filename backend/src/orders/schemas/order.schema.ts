import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/** Which fulfilment pipe an order runs through. */
export type OrderTrack = 'original' | 'pod';

/** Money movement, independent of physical fulfilment. */
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

/**
 * The fulfilment state machine (see KALACUBE_FULFILMENT_PLAYBOOK.md):
 *   PAID → SHIPMENT_CREATED → PICKUP_SCHEDULED → PICKED_UP → IN_TRANSIT
 *        → DELIVERED → RETURN_WINDOW → PAID_OUT
 * Branches:
 *   NDR → RTO                         (undelivered)
 *   RETURN_REQUESTED → REVERSE_PICKUP → REFUNDED
 * `PENDING` is the pre-payment state an order is created in.
 */
export type FulfilmentStatus =
  | 'PENDING'
  | 'PAID'
  | 'SHIPMENT_CREATED'
  | 'PICKUP_SCHEDULED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'RETURN_WINDOW'
  | 'PAID_OUT'
  | 'NDR'
  | 'RTO'
  | 'RETURN_REQUESTED'
  | 'REVERSE_PICKUP'
  | 'REFUNDED';

export const FULFILMENT_STATUSES: FulfilmentStatus[] = [
  'PENDING',
  'PAID',
  'SHIPMENT_CREATED',
  'PICKUP_SCHEDULED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'RETURN_WINDOW',
  'PAID_OUT',
  'NDR',
  'RTO',
  'RETURN_REQUESTED',
  'REVERSE_PICKUP',
  'REFUNDED',
];

/** One purchased line — an original piece or a POD print of an artwork. */
export interface OrderItem {
  artworkId: string;
  title: string;
  kind: 'original' | 'print';
  qty: number;
  unitPrice: number;
}

/** A single tracking event streamed off the courier/POD webhook. */
export interface ShipmentEvent {
  status: string;
  note?: string;
  at: Date;
}

/**
 * A buyer's order against one artist. Collection: `orders`.
 *
 * Two fulfilment tracks share one shape: `original` (KalaCUBE ships via
 * Shiprocket) and `pod` (Qikink prints & ships direct). Payment is captured &
 * held on checkout; the artist payout is released after the return window.
 *
 * Nested objects use inline raw type definitions (matching the codebase's
 * artwork schema) so Mongoose resolves them without separate sub-schema classes.
 */
@Schema({ timestamps: { createdAt: true, updatedAt: true }, collection: 'orders' })
export class Order extends Document {
  @Prop({
    type: { name: String, email: String, phone: String },
    required: true,
  })
  buyer: { name: string; email: string; phone?: string };

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  artistId: Types.ObjectId;

  @Prop({
    type: [
      {
        artworkId: String,
        title: String,
        kind: { type: String, enum: ['original', 'print'], default: 'original' },
        qty: { type: Number, default: 1 },
        unitPrice: { type: Number, default: 0 },
      },
    ],
    default: [],
  })
  items: OrderItem[];

  // All-in price breakdown, in the smallest sensible major unit (INR rupees).
  @Prop({
    type: { art: Number, shipping: Number, gst: Number, total: Number },
    required: true,
  })
  amount: { art: number; shipping: number; gst: number; total: number };

  @Prop({ default: 'INR' }) currency: string;

  @Prop({ enum: ['original', 'pod'], required: true, index: true })
  track: OrderTrack;

  @Prop({
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending',
    index: true,
  })
  paymentStatus: PaymentStatus;

  // Razorpay order/payment id (or stub ref). Indexed for webhook reconciliation.
  @Prop({ index: true }) paymentRef: string;

  @Prop({
    enum: FULFILMENT_STATUSES,
    default: 'PENDING',
    index: true,
  })
  fulfilmentStatus: FulfilmentStatus;

  @Prop({
    type: {
      provider: String, // 'shiprocket' | 'qikink'
      awb: String,
      courier: String,
      labelUrl: String,
      pickupDate: Date,
      trackingUrl: String,
      events: [{ status: String, note: String, at: Date }],
    },
    default: {},
  })
  shipment: {
    provider?: string;
    awb?: string;
    courier?: string;
    labelUrl?: string;
    pickupDate?: Date;
    trackingUrl?: string;
    events?: ShipmentEvent[];
  };

  @Prop({
    type: {
      gross: Number,
      commission: Number,
      net: Number,
      status: String, // 'pending' | 'processing' | 'paid' | 'failed'
    },
    default: {},
  })
  payout: {
    gross?: number;
    commission?: number;
    net?: number;
    status?: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Primary access pattern: an artist's sales, newest first.
OrderSchema.index({ artistId: 1, createdAt: -1 });
// Reconcile payment webhooks by their gateway reference.
OrderSchema.index({ paymentRef: 1 });
