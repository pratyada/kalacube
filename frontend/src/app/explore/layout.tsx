import type { Metadata } from 'next';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Buy Original Indian Art Online',
  description:
    "Browse and buy original artworks from India's artists on KalaCUBE. Filter by art type, category and art style across Handicraft, Visual Art and Performing Arts.",
  alternates: { canonical: '/explore' },
  openGraph: {
    title: 'The Gallery — Buy Original Indian Art | KalaCUBE',
    description:
      "Browse and buy original artworks from India's artists. Filter by art type, category and art style.",
    url: '/explore',
    type: 'website',
  },
};

const jsonLd = breadcrumbJsonLd([
  ['Home', '/'],
  ['Explore the Gallery', '/explore'],
]);

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
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
