'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Artist {
  _id: string; username: string; firstName?: string; lastName?: string;
  headline?: string; artDimensions?: string[]; artworkCount: number;
  avatar?: { url?: string };
}
interface Artwork {
  _id: string; title?: string; medium?: string; images?: string[];
  artist?: { username: string; firstName?: string; lastName?: string };
}

const DIMENSIONS = [
  { key: 'handicraft', label: 'Handicraft', blurb: 'Hands that shape tradition into form.' },
  { key: 'visual_art', label: 'Visual Art', blurb: 'Colour, line, and light on every surface.' },
  { key: 'performing_arts', label: 'Performing Arts', blurb: 'Movement, sound, and living expression.' },
];

function initials(a: Artist) {
  const n = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.username;
  return n.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('');
}

export default function Home() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);

  useEffect(() => {
    api.get('/api/explore/artists', { params: { limit: 8 } })
      .then(({ data }) => setArtists(data.data?.items || [])).catch(() => {});
    api.get('/api/explore/artworks', { params: { limit: 10 } })
      .then(({ data }) => setArtworks(data.data?.items || [])).catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-[#faf8f5] text-neutral-900">
      {/* Hero */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(205,164,92,0.12),_transparent_60%)]" />
        <p className="relative text-xs uppercase tracking-[0.4em] text-[#a06f1e]">
          Kala · Art in three dimensions
        </p>
        <h1 className="relative mt-6 max-w-3xl font-serif text-5xl leading-tight md:text-7xl">
          Where India&apos;s artists <span className="text-[#a06f1e]">come alive</span>
        </h1>
        <p className="relative mt-6 max-w-xl text-lg text-neutral-600">
          A living gallery of handicraft, visual art, and performing arts — from
          the makers shaping culture today.
        </p>
        <div className="relative mt-10 flex gap-4">
          <Link href="/explore" className="rounded-full bg-[#cda45c] px-7 py-3 text-sm font-semibold text-black transition hover:bg-[#dbb673]">
            Explore the Gallery
          </Link>
          <Link href="/all-artist" className="rounded-full border border-neutral-300 px-7 py-3 text-sm font-semibold transition hover:border-[#cda45c]/60">
            Meet the Artists
          </Link>
        </div>
      </section>

      {/* Three dimensions */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {DIMENSIONS.map((d) => (
            <div key={d.key} className="rounded-2xl border border-neutral-200 bg-white p-8">
              <h3 className="font-serif text-2xl text-[#a06f1e]">{d.label}</h3>
              <p className="mt-3 text-neutral-600">{d.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured artists */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="font-serif text-3xl">Featured Artists</h2>
          <Link href="/all-artist" className="text-sm text-[#a06f1e] hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {artists.map((a) => (
            <Link key={a._id} href={`/artist/${a.username}`}
              className="group rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-[#cda45c]/50">
              {a.avatar?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.avatar.url} alt={a.username} loading="lazy" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#cda45c]/30 to-[#cda45c]/5 font-serif text-xl text-[#a06f1e]">
                  {initials(a)}
                </div>
              )}
              <h3 className="mt-3 truncate font-serif text-base">
                {`${a.firstName || ''} ${a.lastName || ''}`.trim() || a.username}
              </h3>
              {a.headline && <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{a.headline}</p>}
              <p className="mt-2 text-xs text-neutral-600">{a.artworkCount} works</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent artworks */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="font-serif text-3xl">From the Gallery</h2>
          <Link href="/explore" className="text-sm text-[#a06f1e] hover:underline">Explore →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {artworks.map((w) => (
            <Link key={w._id} href={`/art-work/${w._id}`}
              className="group overflow-hidden rounded-xl border border-neutral-200 transition hover:border-[#cda45c]/50">
              <div className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 p-3 text-center">
                {w.images && w.images.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.images[0]} alt={w.title || 'Artwork'} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                  <span className="font-serif text-[#a06f1e]/70 line-clamp-3">{w.title || 'Untitled'}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-neutral-200 px-6 py-12 text-center text-sm text-neutral-500">
        KalaCUBE — LinkedIn for Artists across Handicraft, Visual Art & Performing Arts.
      </footer>
    </main>
  );
}
