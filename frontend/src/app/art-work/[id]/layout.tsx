import type { Metadata } from 'next';
import { SITE, fetchArtwork, artistDisplayName, clamp } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const art = await fetchArtwork(id);
  if (!art) {
    return {
      title: 'Artwork not found',
      description: 'This artwork could not be found on KalaCUBE.',
      robots: { index: false, follow: true },
    };
  }
  const title = art.title || 'Untitled';
  const artistName = art.artist ? artistDisplayName(art.artist) : null;
  const bits = [art.medium, art.material, art.theme].filter(Boolean);
  const descParts: string[] = [];
  if (artistName) descParts.push(`${title} by ${artistName}.`);
  if (bits.length) descParts.push(`${bits.join(', ')}.`);
  if (art.description) descParts.push(art.description);
  descParts.push('View this original work on KalaCUBE.');
  const description = clamp(descParts.join(' '));
  const canonical = `/art-work/${id}`;

  return {
    title: artistName ? `${title} by ${artistName}` : title,
    description,
    alternates: { canonical },
    openGraph: {
      title: artistName ? `${title} — ${artistName} | KalaCUBE` : `${title} | KalaCUBE`,
      description,
      url: `${SITE}${canonical}`,
      type: 'article',
      ...(art.images?.[0] ? { images: [{ url: art.images[0] }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: artistName ? `${title} by ${artistName}` : title,
      description,
      ...(art.images?.[0] ? { images: [art.images[0]] } : {}),
    },
  };
}

export default async function ArtworkLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const art = await fetchArtwork(id);

  let jsonLd: object | null = null;
  if (art) {
    const title = art.title || 'Untitled';
    const artistName = art.artist ? artistDisplayName(art.artist) : null;
    const url = `${SITE}/art-work/${id}`;

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'VisualArtwork',
      name: title,
      url,
      ...(art.images?.length ? { image: art.images } : {}),
      ...(art.description ? { description: art.description } : {}),
      ...(art.medium ? { artMedium: art.medium } : {}),
      ...(art.material ? { artworkSurface: art.material } : {}),
      ...(art.theme ? { genre: art.theme } : {}),
      ...(art.dimensions?.width ? { width: `${art.dimensions.width}` } : {}),
      ...(art.dimensions?.height ? { height: `${art.dimensions.height}` } : {}),
      ...(artistName && art.artist
        ? {
            creator: {
              '@type': 'Person',
              name: artistName,
              url: `${SITE}/artist/${art.artist.username}`,
            },
            author: {
              '@type': 'Person',
              name: artistName,
              url: `${SITE}/artist/${art.artist.username}`,
            },
          }
        : {}),
      ...(art.cost
        ? {
            offers: {
              '@type': 'Offer',
              price: art.cost,
              priceCurrency: art.currency || 'INR',
              availability: 'https://schema.org/InStock',
              url,
            },
          }
        : {}),
      isPartOf: { '@type': 'WebSite', name: 'KalaCUBE', url: SITE },
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
