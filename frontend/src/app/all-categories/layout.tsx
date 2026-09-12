import type { Metadata } from 'next';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Indian Art Styles & Categories',
  description:
    "Explore India's art by style and category — Madhubani, Pichwai, Warli and Gond to painting, photography, jewellery, textiles and sculpture — on KalaCUBE.",
  alternates: { canonical: '/all-categories' },
  openGraph: {
    title: 'Indian Art Styles & Categories — KalaCUBE',
    description:
      "Explore India's art by style and category across Handicraft, Visual Art and Performing Arts.",
    url: '/all-categories',
    type: 'website',
  },
};

const jsonLd = breadcrumbJsonLd([
  ['Home', '/'],
  ['Categories', '/all-categories'],
]);

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
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
