import type { Metadata } from 'next';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Discover Indian Artists & Portfolios',
  description:
    "Meet the artists of KalaCUBE — painters, sculptors, photographers and artisans across Handicraft, Visual Art and Performing Arts. Discover portfolios and connect.",
  alternates: { canonical: '/all-artist' },
  openGraph: {
    title: 'Discover Indian Artists & Portfolios — KalaCUBE',
    description:
      "Meet India's artists and artisans across Handicraft, Visual Art and Performing Arts. Discover portfolios and connect.",
    url: '/all-artist',
    type: 'website',
  },
};

const jsonLd = breadcrumbJsonLd([
  ['Home', '/'],
  ['Artists', '/all-artist'],
]);

export default function ArtistsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
