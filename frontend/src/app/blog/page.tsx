import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchArtists, slugify } from '@/lib/blog';

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
  const artists = await fetchArtists(60);

  return (
    <main className="min-h-screen bg-[#faf8f5] text-neutral-900">
      <section className="border-b border-neutral-200 px-6 py-16 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-[#a06f1e]">The KalaCUBE Journal</p>
        <h1 className="mx-auto mt-4 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
          Where handmade art meets its story
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-600">
          Artist portfolios, art-style guides, and dispatches from Dehradun’s art
          renaissance. In a world of AI, the artist’s hand still prevails.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <h2 className="mb-8 font-serif text-3xl">Artist Portfolios</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((a: any) => (
            <Link
              key={a._id}
              href={`/blog/${a.username}`}
              className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                {a.avatar?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.avatar.url} alt={a.username} className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#cda45c]/20 font-serif text-lg text-[#a06f1e]">
                    {(a.firstName?.[0] || a.username?.[0] || 'A').toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-serif text-lg">
                    {`${a.firstName || ''} ${a.lastName || ''}`.trim() || a.username}
                  </h3>
                  <p className="text-sm text-neutral-500">{a.artworkCount} works</p>
                </div>
              </div>
              {a.headline && <p className="mt-4 line-clamp-2 text-sm text-neutral-600">{a.headline}</p>}
              <span className="mt-4 inline-block text-sm text-[#a06f1e] group-hover:underline">Read portfolio →</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
