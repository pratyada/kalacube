/**
 * Commerce (checkout / orders) is behind a build-time flag so real buyers keep
 * using the Enquire flow until this is flipped live. Absent/anything-but-"true"
 * = OFF. In production leave `NEXT_PUBLIC_COMMERCE_ENABLED` unset to keep the
 * live Enquire/Buy path unchanged.
 */
export const COMMERCE_ENABLED =
  process.env.NEXT_PUBLIC_COMMERCE_ENABLED === 'true';

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

/** Ordered "happy path" for the tracking timeline. */
export const HAPPY_PATH: FulfilmentStatus[] = [
  'PAID',
  'SHIPMENT_CREATED',
  'PICKUP_SCHEDULED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'RETURN_WINDOW',
  'PAID_OUT',
];

export const STATUS_LABEL: Record<FulfilmentStatus, string> = {
  PENDING: 'Payment pending',
  PAID: 'Paid',
  SHIPMENT_CREATED: 'Shipment created',
  PICKUP_SCHEDULED: 'Pickup scheduled',
  PICKED_UP: 'Picked up',
  IN_TRANSIT: 'In transit',
  DELIVERED: 'Delivered',
  RETURN_WINDOW: 'Return window',
  PAID_OUT: 'Paid out',
  NDR: 'Delivery issue',
  RTO: 'Returned to origin',
  RETURN_REQUESTED: 'Return requested',
  REVERSE_PICKUP: 'Reverse pickup',
  REFUNDED: 'Refunded',
};

/** Tailwind brand pill classes per status. */
export const STATUS_PILL: Record<FulfilmentStatus, string> = {
  PENDING: 'border-navy/20 bg-navy/5 text-navy/60',
  PAID: 'border-teal/40 bg-teal/10 text-teal-deep',
  SHIPMENT_CREATED: 'border-indigo/30 bg-indigo/10 text-indigo',
  PICKUP_SCHEDULED: 'border-indigo/30 bg-indigo/10 text-indigo',
  PICKED_UP: 'border-indigo/30 bg-indigo/10 text-indigo',
  IN_TRANSIT: 'border-orange/40 bg-orange/10 text-orange-deep',
  DELIVERED: 'border-teal/40 bg-teal/10 text-teal-deep',
  RETURN_WINDOW: 'border-yellow/50 bg-yellow/15 text-navy',
  PAID_OUT: 'border-teal/50 bg-teal/15 text-teal-deep',
  NDR: 'border-magenta/40 bg-magenta/10 text-magenta-deep',
  RTO: 'border-magenta/40 bg-magenta/10 text-magenta-deep',
  RETURN_REQUESTED: 'border-magenta/40 bg-magenta/10 text-magenta-deep',
  REVERSE_PICKUP: 'border-magenta/40 bg-magenta/10 text-magenta-deep',
  REFUNDED: 'border-navy/20 bg-navy/5 text-navy/60',
};

export function formatINR(n?: number, currency = 'INR') {
  if (n === undefined || n === null || Number.isNaN(n)) return '';
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₹${Math.round(n).toLocaleString('en-IN')}`;
  }
}

export interface OrderItem {
  artworkId: string;
  title: string;
  kind: 'original' | 'print';
  qty: number;
  unitPrice: number;
}

export interface Order {
  _id: string;
  buyer: { name: string; email: string; phone?: string };
  items: OrderItem[];
  amount: { art: number; shipping: number; gst: number; total: number };
  currency: string;
  track: 'original' | 'pod';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  fulfilmentStatus: FulfilmentStatus;
  shipment?: {
    provider?: string;
    awb?: string;
    courier?: string;
    labelUrl?: string;
    pickupDate?: string;
    trackingUrl?: string;
    events?: { status: string; note?: string; at: string }[];
  };
  payout?: { gross?: number; commission?: number; net?: number; status?: string };
  createdAt: string;
}
