'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Artist {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  artDimensions?: string[];
  artworkCount: number;
  avatar?: { url?: string };
}

const DIMENSION_LABEL: Record<string, string> = {
  handicraft: 'Handicraft',
  visual_art: 'Visual Art',
  performing_arts: 'Performing Arts',
};

function initials(a: Artist) {
  const n = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.username;
  return n.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('');
}

const DIMENSION_FILTERS = [
  { key: '', label: 'All' },
  { key: 'handicraft', label: 'Handicraft' },
  { key: 'visual_art', label: 'Visual Art' },
  { key: 'performing_arts', label: 'Performing Arts' },
];

export default function AllArtistPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dimension, setDimension] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      api
        .get('/api/explore/artists', {
          params: { limit: 48, dimension: dimension || undefined, search: search || undefined },
        })
        .then(({ data }) => {
          const p = data.data || {};
          setArtists(p.items || []);
          setTotal(p.total || 0);
        })
        .catch(() => setArtists([]))
        .finally(() => setLoading(false));
    }, 250); // debounce search typing
    return () => clearTimeout(t);
  }, [dimension, search]);

  return (
    <main className="min-h-screen bg-[#faf8f5] text-neutral-900">
      <header className="border-b border-neutral-200 px-6 py-10 text-center">
        <p className="text-xs tracking-[0.3em] text-[#a06f1e] uppercase">
          The KalaCUBE Community
        </p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">Artists</h1>
        <p className="mt-3 text-neutral-600">
          {loading ? 'Loading…' : `${total} artist${total === 1 ? '' : 's'}`}
        </p>

        {/* Filters */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-2">
            {DIMENSION_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setDimension(f.key)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  dimension === f.key
                    ? 'border-[#a06f1e] bg-[#a06f1e] text-white'
                    : 'border-neutral-300 text-neutral-600 hover:border-[#a06f1e]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artists by name…"
            className="w-full max-w-sm rounded-full border border-neutral-300 px-4 py-2 text-sm outline-none focus:border-[#a06f1e]"
          />
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {artists.map((a) => (
              <Link
                key={a._id}
                href={`/artist/${a.username}`}
                className="group rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-[#cda45c]/50 hover:bg-neutral-100"
              >
                {a.avatar?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.avatar.url}
                    alt={a.username}
                    loading="lazy"
                    className="h-20 w-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#cda45c]/30 to-[#cda45c]/5 font-serif text-2xl text-[#a06f1e]">
                    {initials(a)}
                  </div>
                )}
                <h3 className="mt-4 font-serif text-lg leading-tight">
                  {`${a.firstName || ''} ${a.lastName || ''}`.trim() || a.username}
                </h3>
                <p className="text-sm text-neutral-500">@{a.username}</p>
                {a.headline && (
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{a.headline}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {(a.artDimensions || []).map((d) => (
                    <span key={d} className="rounded-full border border-[#cda45c]/30 px-2 py-0.5 text-[#a06f1e]">
                      {DIMENSION_LABEL[d] || d}
                    </span>
                  ))}
                  {a.artworkCount > 0 && (
                    <span className="text-neutral-500">{a.artworkCount} works</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
