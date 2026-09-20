export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isActive: boolean;
  isFeatured?: boolean;
  pilotSeller?: boolean;
  avatar?: { url?: string };
  location?: { city?: string; state?: string; country?: string };
  bio?: string;
  createdAt?: string;
}

export interface AdminOrder {
  _id: string;
  buyer?: { name?: string; email?: string; phone?: string };
  shipTo?: { city?: string; state?: string; pincode?: string };
  artistId?: {
    username?: string;
    firstName?: string;
    lastName?: string;
  } | null;
  items?: { title?: string; kind?: string; qty?: number; unitPrice?: number }[];
  amount?: { art?: number; shipping?: number; gst?: number; total?: number };
  currency?: string;
  track?: 'original' | 'pod';
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  fulfilmentStatus?: string;
  shipment?: { awb?: string; courier?: string; trackingUrl?: string };
  payout?: { net?: number; status?: string };
  createdAt?: string;
}

export interface OrdersSummary {
  paidOrders: number;
  grossPaid: number;
  byStatus: Record<string, number>;
}

export const FULFILMENT_STATUSES = [
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

export interface AdminArtwork {
  _id: string;
  title?: string;
  status?: string;
  images?: string[];
  cost?: number;
  currency?: string;
  artist?: {
    username?: string;
    firstName?: string;
    lastName?: string;
  } | null;
  createdAt?: string;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface DimensionCount {
  dimension: string;
  count: number;
}

export interface AdminStats {
  totalUsers: number;
  artists: number;
  artworks: number;
  submitted: number;
  artspaces: number;
  events: number;
  artstyles: number;
  newSignups30d: number;
  featured: number;
  artworksByStatus: StatusCount[];
  topDimensions: DimensionCount[];
}

export interface Campaign {
  _id: string;
  subject: string;
  segment: string;
  recipientCount: number;
  sentBy: string;
  createdAt: string;
}

export interface RecipientPreview {
  segment: string;
  count: number;
  sample: string[];
}

export type AdminSection =
  | 'dashboard'
  | 'orders'
  | 'artists'
  | 'artworks'
  | 'featured'
  | 'email'
  | 'campaigns'
  | 'artspaces'
  | 'events';

export const ROLES = [
  'user',
  'artist',
  'curator',
  'art-space',
  'admin',
  'superadmin',
];

export const ARTWORK_STATUSES = ['submitted', 'draft', 'hidden', 'approved'];

export const displayName = (u: {
  firstName?: string;
  lastName?: string;
  username?: string;
}): string =>
  `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || 'Unknown';
