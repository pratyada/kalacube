import type { Metadata } from 'next';
import Link from 'next/link';
import { API_BASE } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'KalaCUBE Journal — Stories of India’s Artists & Handmade Art',
  description:
    'Feature stories on India’s handicraft, visual, and performing artists — from the community that grew around Musée Art Café, Dehradun. In an age of AI, human hands and original art still prevail.',
  alternates: { canonical: 'https://kalacube.com/blog' },
  openGraph: {
    title: 'KalaCUBE Journal',
    description: 'Feature stories of India’s artists and handmade art.',
    url: 'https://kalacube.com/blog',
    type: 'website',
  },
};

export const dynamic = 'force-dynamic';

const DIM: Record<string, string> = {
  handicraft: 'Handicraft',
  visual_art: 'Visual Art',
  performing_arts: 'Performing Arts',
};

type JournalPost = {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  excerpt?: string;
  avatar?: { url?: string };
  coverImage?: { url?: string };
  coverArt?: string[] | string;
  artDimensions?: string[];
};

async function fetchJournal(): Promise<JournalPost[]> {
  try {
    const res = await fetch(`${API_BASE}/api/explore/journal?limit=80`, {
      cache: 'no-store',
    });
    const json = await res.json();
    return json.data?.items || [];
  } catch {
    return [];
  }
}

function coverOf(p: JournalPost): string | undefined {
  const art = Array.isArray(p.coverArt) ? p.coverArt[0] : p.coverArt;
  return p.coverImage?.url || art || p.avatar?.url;
}

export default async function BlogIndex() {
  const posts = await fetchJournal();

  return (
    <main className="min-h-screen bg-[#faf7f2] text-neutral-900">
      <section className="border-b border-neutral-200 px-6 py-16 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-[#202f9a]">The KalaCUBE Journal</p>
        <h1 className="mx-auto mt-4 max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
          Where handmade art meets its story
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-600">
          Feature stories on India’s artists — from the community that grew
          around Musée Art Café, Dehradun. In a world of AI, the artist’s hand
          still prevails.
        </p>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Pinned editorial */}
        <Link
          href="/blog/ai-and-the-future-of-human-art"
          className="group mb-12 block overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-[#202f9a]/40 hover:shadow-lg"
        >
          <div className="grid md:grid-cols-[1.2fr_1fr]">
            <div className="p-8 md:p-10">
              <span className="text-xs uppercase tracking-[0.2em] text-[#202f9a]">Editorial</span>
              <h2 className="mt-3 font-serif text-3xl leading-snug group-hover:text-[#202f9a]">
                AI and the Future of Human Art
              </h2>
              <p className="mt-4 text-neutral-600">
                Why original, human-made art matters more than ever — and what it
                means to be an artist in the age of the algorithm.
              </p>
              <span className="mt-6 inline-block text-sm font-medium text-[#202f9a]">
                Read the essay →
              </span>
            </div>
            <div className="hidden bg-gradient-to-br from-[#202f9a]/10 to-[#eef1ff] md:block" />
          </div>
        </Link>

        <h2 className="mb-2 font-serif text-3xl">Artist Features</h2>
        <p className="mb-8 text-neutral-500">
          {posts.length} stories · fresh from the studio
        </p>

        {posts.length === 0 ? (
          <p className="rounded-xl border border-neutral-200 bg-white p-10 text-center text-neutral-500">
            New stories are being written — check back shortly.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => {
              const name = `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.username;
              const cover = coverOf(p);
              const dim = (p.artDimensions || []).map((d) => DIM[d] || d)[0];
              return (
                <Link
                  key={p._id}
                  href={`/blog/${p.username}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-[#202f9a]/40 hover:shadow-lg"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-neutral-100">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cover}
                        alt={name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center font-serif text-4xl text-[#202f9a]/30">
                        {name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    {dim && (
                      <span className="text-[11px] uppercase tracking-[0.15em] text-[#202f9a]">
                        {dim}
                      </span>
                    )}
                    <h3 className="mt-1 font-serif text-xl leading-snug group-hover:text-[#202f9a]">
                      {name}
                    </h3>
                    {p.headline && (
                      <p className="mt-1 text-sm italic text-neutral-500">{p.headline}</p>
                    )}
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-600">
                      {p.excerpt}
                    </p>
                    <span className="mt-4 inline-block text-sm font-medium text-[#202f9a]">
                      Read the story →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
