'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Artwork {
  _id: string;
  title?: string;
  cost?: number;
  currency?: string;
  medium?: string;
  theme?: string;
  imagePrefix?: string | null;
  images?: string[];
  artist?: { username: string; firstName?: string; lastName?: string };
}

export default function ExplorePage() {
  const [items, setItems] = useState<Artwork[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/explore/artworks', { params: { limit: 48 } })
      .then(({ data }) => {
        const p = data.data || {};
        setItems(p.items || []);
        setTotal(p.total || 0);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#faf8f5] text-neutral-900">
      <header className="border-b border-neutral-200 px-6 py-10 text-center">
        <p className="text-xs tracking-[0.3em] text-[#a06f1e] uppercase">Explore</p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">The Gallery</h1>
        <p className="mt-3 text-neutral-600">
          {loading ? 'Loading…' : `${total} artworks from the KalaCUBE community`}
        </p>
        <Link href="/all-artist" className="mt-4 inline-block text-sm text-[#a06f1e] hover:underline">
          Browse artists →
        </Link>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((w) => (
              <Link
                key={w._id}
                href={`/art-work/${w._id}`}
                className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:border-[#cda45c]/50"
              >
                <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200">
                  {w.images && w.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={w.images[0]}
                      alt={w.title || 'Artwork'}
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex flex-col items-center px-4 text-center">
                      <span className="text-2xl">🎨</span>
                      <span className="mt-2 font-serif text-base text-neutral-800 line-clamp-3">
                        {w.title || 'Untitled'}
                      </span>
                      <span className="mt-2 text-[10px] uppercase tracking-wide text-neutral-400">
                        image loading soon
                      </span>
                    </div>
                  )}
                  <span className="absolute right-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-600">
                    {w.medium || 'art'}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="truncate font-serif text-sm">{w.title || 'Untitled'}</h3>
                  {w.artist && (
                    <p className="truncate text-xs text-neutral-500">
                      {`${w.artist.firstName || ''} ${w.artist.lastName || ''}`.trim() ||
                        '@' + w.artist.username}
                    </p>
                  )}
                  {w.cost ? (
                    <p className="mt-1 text-xs text-[#a06f1e]">
                      {w.currency || 'INR'} {w.cost.toLocaleString()}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
