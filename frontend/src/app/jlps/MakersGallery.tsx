'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

type Item = {
  _id: string;
  title?: string;
  cost?: number;
  currency?: string;
  theme?: string;
  images?: string[];
  artist?: { firstName?: string; lastName?: string; grade?: string };
};

const fmt = (n?: number) =>
  n || n === 0
    ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n)
    : '';

const gradeLabel = (g?: string) => (!g ? '' : /^\d/.test(g) ? `Grade ${g}` : g);

/** Live "sneak peek" of crafts JLPS makers have listed (community=jlps only). */
export default function MakersGallery() {
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    api
      .get('/api/explore/artworks', { params: { community: 'jlps', limit: 12 } })
      .then((r) => setItems(r.data?.data?.items || []))
      .catch(() => setItems([]));
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--berry)]">
          Sneak peek
        </p>
        <h2 className="mt-2 text-4xl font-bold sm:text-5xl">Meet the makers 👀</h2>
        <p className="mx-auto mt-3 max-w-xl text-lg text-[#3b4a6b]">
          Fresh from JLPS craft tables. Everything goes on sale Dec 10!
        </p>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
        {items.map((it, i) => {
          const name = [it.artist?.firstName, it.artist?.lastName].filter(Boolean).join(' ');
          return (
            <Link
              key={it._id}
              href={`/art-work/${it._id}`}
              className="jlps-card jlps-pop overflow-hidden"
              style={{ rotate: `${i % 2 ? 1 : -1}deg` }}
            >
              <div className="aspect-square bg-[#eaf4ff]">
                {it.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.images[0]}
                    alt={it.title || 'Craft'}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-4">
                <p className="truncate text-lg font-bold">{it.title || 'Untitled'}</p>
                <p className="truncate text-sm text-[#3b4a6b]">
                  {name}
                  {it.artist?.grade ? ` · ${gradeLabel(it.artist.grade)}` : ''}
                </p>
                {fmt(it.cost) && (
                  <p className="mt-1 text-base font-bold text-[var(--berry)]">{fmt(it.cost)}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
