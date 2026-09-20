// Server-side helpers for SEO blog pages.
export const API_BASE =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const SITE = 'https://kalacube.com';
export const MUSEE = 'https://www.museeliving.com';

export function slugify(s: string) {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Best-effort museeliving editorial URL for an artist (by display name). */
export function museeArtistUrl(firstName?: string, lastName?: string, username?: string) {
  const name = `${firstName || ''} ${lastName || ''}`.trim();
  const slug = name ? slugify(name) : slugify(username || '');
  return `${MUSEE}/blog/artist-${slug}/`;
}

export async function fetchArtists(limit = 60) {
  try {
    const res = await fetch(`${API_BASE}/api/explore/artists?limit=${limit}`, {
      cache: 'no-store',
    });
    const json = await res.json();
    return json.data?.items || [];
  } catch {
    return [];
  }
}

/** A topical blog post (art-style / category guide) by slug, or null. */
export async function fetchPost(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/explore/post/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

/** All topical blog posts (list view, no HTML body). */
export async function fetchPosts() {
  try {
    const res = await fetch(`${API_BASE}/api/explore/posts`, { cache: 'no-store' });
    const json = await res.json();
    return json.data?.items || [];
  } catch {
    return [];
  }
}

export async function fetchArtist(username: string) {
  try {
    const res = await fetch(`${API_BASE}/api/explore/artists/${encodeURIComponent(username)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}
