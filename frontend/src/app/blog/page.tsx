import type { Metadata } from 'next';
import { fetchArtists } from '@/lib/blog';
import JournalExplorer, { type JournalArtist } from '@/components/JournalExplorer';

export const metadata: Metadata = {
  title: 'KalaCUBE Journal — Stories of India’s Artists & Handmade Art',
  description:
    'Portfolios, art-style guides, and stories from KalaCUBE — a home for India’s handicraft, visual, and performing artists. In an age of AI, human hands and original art still prevail.',
  alternates: { canonical: 'https://kalacube.com/blog' },
  openGraph: {
    title: 'KalaCUBE Journal',
    description: 'Stories of India’s artists and handmade art.',
    url: 'https://kalacube.com/blog',
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';

export default async function BlogIndex() {
  // Server-fetch the default (unfiltered) page so the artist links are in the
  // initial HTML for SEO; the client island hydrates the filters on top.
  const initialArtists = (await fetchArtists(48)) as JournalArtist[];

  return (
    <main className="min-h-screen bg-[#faf7f2] text-neutral-900">
      <section className="border-b border-neutral-200 px-6 py-16 text-center">
        <p className="text-xs tracking-[0.4em] text-[#202f9a] uppercase">The KalaCUBE Journal</p>
        <h1 className="mx-auto mt-4 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
          Where handmade art meets its story
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-600">
          Artist portfolios, art-style guides, and dispatches from Dehradun’s art
          renaissance. In a world of AI, the artist’s hand still prevails.
        </p>
      </section>

      <JournalExplorer initialArtists={initialArtists} />
    </main>
  );
}
