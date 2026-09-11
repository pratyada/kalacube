import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Explore the Gallery',
  description:
    "Browse original artworks from India's artists on KalaCUBE. Filter by art type, category and art style across Handicraft, Visual Art and Performing Arts.",
  alternates: { canonical: '/explore' },
  openGraph: {
    title: 'The Gallery — KalaCUBE',
    description:
      "Browse original artworks from India's artists. Filter by art type, category and art style.",
    url: '/explore',
    type: 'website',
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
