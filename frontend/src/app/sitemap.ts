import type { MetadataRoute } from 'next';
import { SITE, fetchArtistsList, fetchArtworksList } from '@/lib/seo';

// Regenerate the sitemap at most hourly so new artists/artworks surface without
// rebuilding, while still being cached between requests.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/explore`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/all-artist`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/all-categories`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/roadmap`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE}/blog/ai-and-the-future-of-human-art`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/events`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE}/faqs`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE}/refund-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE}/shipping-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE}/pricing-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const [artists, artworks] = await Promise.all([
    fetchArtistsList(500),
    fetchArtworksList(1000),
  ]);

  // Percent-encode dynamic path segments so special characters (e.g. a username
  // like "ruffle&clay") produce valid URLs and don't break the sitemap XML.
  const enc = (s: string) => encodeURIComponent(String(s));

  const artistRoutes: MetadataRoute.Sitemap = artists
    .filter((a: any) => a?.username)
    .flatMap((a: any) => [
      // No reliable per-artist timestamp from the API — omit lastModified
      // rather than stamp a misleading "now" on every artist page.
      {
        url: `${SITE}/artist/${enc(a.username)}`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${SITE}/blog/${enc(a.username)}`,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      },
    ]);

  const artworkRoutes: MetadataRoute.Sitemap = artworks
    .filter((w: any) => w?._id)
    .map((w: any) => ({
      url: `${SITE}/art-work/${enc(w._id)}`,
      // Real per-artwork date so the sitemap signal is honest (not "always now").
      lastModified: w.createdAt ? new Date(w.createdAt) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      ...(w.images?.[0] ? { images: [w.images[0] as string] } : {}),
    }));

  return [...staticRoutes, ...artistRoutes, ...artworkRoutes];
}
