/**
 * Selling markets. A seller's market is decided by their PROFILE location:
 *   - IN (India)  → INR · Razorpay · Shiprocket courier (existing pilot)
 *   - CA (Canada) → CAD · Stripe · KalaCUBE local delivery / Canada shipping
 * Community markets (e.g. JLPS, Toronto) are always CA.
 */
export type Market = 'IN' | 'CA';

export function sellerMarket(
  u?: {
    community?: string;
    location?: { country?: string };
  } | null,
): Market {
  if (!u) return 'IN';
  if (u.community) return 'CA';
  return /^\s*canada\s*$/i.test(u.location?.country || '') ? 'CA' : 'IN';
}

export function marketCurrency(m: Market): 'INR' | 'CAD' {
  return m === 'CA' ? 'CAD' : 'INR';
}

/**
 * KalaCUBE local-delivery zone: CityPlace + downtown Toronto, by FSA (the
 * first 3 characters of a Canadian postal code). Override with the
 * COMMERCE_CA_LOCAL_FSAS env (comma-separated) without a code change.
 */
export const DEFAULT_CA_LOCAL_FSAS = [
  'M5V', // CityPlace, King West, Entertainment District, Fort York
  'M5J', // Harbourfront, Union Station, Toronto Islands
  'M5H', // Financial District (Richmond/Adelaide)
  'M5K', // TD Centre
  'M5L', // Commerce Court
  'M5X', // First Canadian Place
  'M5C', // St. James / Old Town
  'M5E', // St. Lawrence / Berczy Park
  'M5A', // Corktown, Distillery, Regent Park
  'M5B', // Garden District, TMU
  'M5G', // Hospital Row / Bay St
  'M5T', // Kensington, Chinatown, Grange Park
  'M5S', // University of Toronto
  'M4Y', // Church–Wellesley
  'M6J', // Trinity–Bellwoods, Little Portugal
  'M6K', // Liberty Village, Parkdale (east)
];

/** Canadian postal code → normalized "A1A 1A1", or null if invalid. */
export function normalizePostal(raw?: string): string | null {
  const s = (raw || '').toUpperCase().replace(/[\s-]/g, '');
  if (!/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/.test(s))
    return null;
  return `${s.slice(0, 3)} ${s.slice(3)}`;
}

export function parseFsaList(raw?: string): string[] {
  const list = (raw || '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z]\d[A-Z]$/.test(s));
  return list.length ? list : DEFAULT_CA_LOCAL_FSAS;
}

export function inLocalZone(postal: string, fsas: string[]): boolean {
  const n = normalizePostal(postal);
  return !!n && fsas.includes(n.slice(0, 3));
}

/** Categories that can only ever be delivered locally (food). */
export const LOCAL_ONLY_CATEGORIES = ['Homemade Treats'];

/**
 * Is this artwork restricted to KalaCUBE local delivery? Community (JLPS)
 * items always are (the portal hand-delivers in CityPlace/downtown); treats
 * always are; otherwise the seller's per-item choice.
 */
export function isLocalOnly(art: {
  localOnly?: boolean;
  community?: string;
  theme?: string;
}): boolean {
  return (
    !!art.community ||
    !!art.localOnly ||
    LOCAL_ONLY_CATEGORIES.includes((art.theme || '').trim())
  );
}
