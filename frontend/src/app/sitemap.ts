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
    { url: `${SITE}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE}/events`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE}/faqs`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const [artists, artworks] = await Promise.all([
    fetchArtistsList(500),
    fetchArtworksList(1000),
  ]);

  const artistRoutes: MetadataRoute.Sitemap = artists
    .filter((a: any) => a?.username)
    .flatMap((a: any) => [
      {
        url: `${SITE}/artist/${a.username}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      },
      {
        url: `${SITE}/blog/${a.username}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      },
    ]);

  const artworkRoutes: MetadataRoute.Sitemap = artworks
    .filter((w: any) => w?._id)
    .map((w: any) => ({
      url: `${SITE}/art-work/${w._id}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      ...(w.images?.[0] ? { images: [w.images[0] as string] } : {}),
    }));

  return [...staticRoutes, ...artistRoutes, ...artworkRoutes];
}
