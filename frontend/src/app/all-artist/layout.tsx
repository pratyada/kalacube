import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Artists',
  description:
    "Meet the artists of KalaCUBE — painters, sculptors, photographers and makers across Handicraft, Visual Art and Performing Arts. Discover portfolios and connect.",
  alternates: { canonical: '/all-artist' },
  openGraph: {
    title: 'Artists — KalaCUBE',
    description:
      "Meet India's artists across Handicraft, Visual Art and Performing Arts. Discover portfolios and connect.",
    url: '/all-artist',
    type: 'website',
  },
};

export default function ArtistsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
