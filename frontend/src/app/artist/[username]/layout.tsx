import type { Metadata } from 'next';
import {
  SITE,
  fetchArtist,
  artistDisplayName,
  clamp,
  DIMENSION_LABEL,
} from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const data = await fetchArtist(username);
  if (!data) {
    return {
      title: 'Artist not found',
      description: 'This artist could not be found on KalaCUBE.',
      robots: { index: false, follow: true },
    };
  }
  const { user, profile, artworks } = data;
  const name = artistDisplayName(user);
  const dims: string[] = (profile?.artDimensions || []).map(
    (d: string) => DIMENSION_LABEL[d] || d,
  );
  const count = Array.isArray(artworks) ? artworks.length : 0;
  const dimText = dims.length ? dims.join(', ') : 'art';
  const description = clamp(
    profile?.statement ||
      profile?.headline ||
      `${name} is an artist on KalaCUBE with ${count} original ${count === 1 ? 'work' : 'works'} across ${dimText}. Explore the portfolio and connect.`,
  );
  const title = `${name} — Artist Portfolio (${count} ${count === 1 ? 'work' : 'works'})`;
  const canonical = `/artist/${user.username}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${name} — Artist Portfolio | KalaCUBE`,
      description,
      url: `${SITE}${canonical}`,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} — Artist on KalaCUBE`,
      description,
    },
  };
}

export default async function ArtistLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await fetchArtist(username);

  let jsonLd: object | null = null;
  if (data) {
    const { user, profile, artworks } = data;
    const name = artistDisplayName(user);
    const socials: Record<string, string> = user.socialLinks || {};
    const sameAs = Object.values(socials).filter(Boolean) as string[];
    const dims: string[] = (profile?.artDimensions || []).map(
      (d: string) => DIMENSION_LABEL[d] || d,
    );
    const url = `${SITE}/artist/${user.username}`;

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      url,
      mainEntity: {
        '@type': 'Person',
        name,
        alternateName: `@${user.username}`,
        url,
        jobTitle: 'Artist',
        ...(user.avatar?.url ? { image: user.avatar.url } : {}),
        ...(profile?.statement ? { description: profile.statement } : {}),
        ...(sameAs.length ? { sameAs } : {}),
        ...(dims.length ? { knowsAbout: dims } : {}),
        ...(user.location?.city || user.location?.country
          ? {
              address: {
                '@type': 'PostalAddress',
                ...(user.location?.city ? { addressLocality: user.location.city } : {}),
                ...(user.location?.country ? { addressCountry: user.location.country } : {}),
              },
            }
          : {}),
        makesOffer: (Array.isArray(artworks) ? artworks : [])
          .slice(0, 12)
          .map((w: any) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'VisualArtwork',
              name: w.title || 'Untitled',
              url: `${SITE}/art-work/${w._id}`,
              ...(w.images?.[0] ? { image: w.images[0] } : {}),
            },
          })),
      },
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
          { '@type': 'ListItem', position: 2, name: 'Artists', item: `${SITE}/all-artist` },
          { '@type': 'ListItem', position: 3, name, item: url },
        ],
      },
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
