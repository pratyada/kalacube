// Server-side SEO helpers shared by generateMetadata, opengraph-image, and
// sitemap routes. Keep this framework-agnostic and side-effect free.
import { API_BASE, SITE, fetchArtist } from '@/lib/blog';

export { API_BASE, SITE, fetchArtist };

// Brand palette (guideline §04).
export const NAVY = '#0B1F52';
export const CREAM = '#faf7f2';
export const INDIGO = '#202f9a';

export const DIMENSION_LABEL: Record<string, string> = {
  handicraft: 'Handicraft',
  visual_art: 'Visual Art',
  performing_arts: 'Performing Arts',
};

export function artistDisplayName(user: {
  firstName?: string;
  lastName?: string;
  username?: string;
}): string {
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Artist';
}

/** Truncate to a meta-description-friendly length on a word boundary. */
export function clamp(text: string, max = 158): string {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

/**
 * Build a schema.org BreadcrumbList JSON-LD object from an ordered list of
 * [name, path] pairs. Paths are resolved against the canonical SITE origin.
 */
export function breadcrumbJsonLd(trail: Array<[string, string]>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: path.startsWith('http') ? path : `${SITE}${path}`,
    })),
  };
}

export async function fetchArtwork(id: string): Promise<any | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/explore/artworks/${encodeURIComponent(id)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function fetchArtistsList(limit = 500): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/explore/artists?limit=${limit}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.items || [];
  } catch {
    return [];
  }
}

export async function fetchArtworksList(limit = 1000): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/explore/artworks?limit=${limit}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.items || [];
  } catch {
    return [];
  }
}
