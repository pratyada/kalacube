import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Categories',
  description:
    "Explore India's art by category — painting, photography, jewellery, textiles, sculpture and more across Handicraft, Visual Art and Performing Arts on KalaCUBE.",
  alternates: { canonical: '/all-categories' },
  openGraph: {
    title: 'Categories — KalaCUBE',
    description:
      "Explore India's art by category across Handicraft, Visual Art and Performing Arts.",
    url: '/all-categories',
    type: 'website',
  },
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
