'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

interface Category {
  domain: string;
  category: string;
  count: number;
  specialists: { name: string; count: number }[];
}

const PAGE_SIZE = 48;

const DIMENSION_LABEL: Record<string, string> = {
  handicraft: 'Handicraft',
  visual_art: 'Visual Art',
  performing_arts: 'Performing Arts',
};

function initials(a: Artist) {
  const n = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.username;
  return n.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('');
}

export default function AllArtistPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);

  const [domain, setDomain] = useState('');
  const [category, setCategory] = useState('');
  const [specialist, setSpecialist] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    api
      .get('/api/explore/categories')
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPage = useCallback(
    async (nextPage: number, replace: boolean) => {
      const id = ++reqId.current;
      replace ? setLoading(true) : setLoadingMore(true);
      try {
        const { data } = await api.get('/api/explore/artists', {
          params: {
            page: nextPage,
            limit: PAGE_SIZE,
            domain: domain || undefined,
            category: category || undefined,
            specialist: specialist || undefined,
            search: debounced || undefined,
          },
        });
        if (id !== reqId.current) return;
        const p = data.data || {};
        const incoming: Artist[] = p.items || [];
        setTotal(p.total || 0);
        setArtists((prev) => (replace ? incoming : [...prev, ...incoming]));
        setPage(nextPage);
      } catch {
        if (id === reqId.current && replace) setArtists([]);
      } finally {
        if (id === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [domain, category, specialist, debounced],
  );

  useEffect(() => {
    fetchPage(1, true);
  }, [fetchPage]);

  const artTypes = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of categories) map.set(c.domain, (map.get(c.domain) || 0) + c.count);
    return Array.from(map, ([name, count]) => ({ name, count })).sort(
      (a, b) => b.count - a.count,
    );
  }, [categories]);

  const domainCategories = useMemo(
    () => categories.filter((c) => c.domain === domain),
    [categories, domain],
  );
  const activeCat = domainCategories.find((c) => c.category === category);

  const selectDomain = (d: string) => {
    setDomain(d);
    setCategory('');
    setSpecialist('');
  };
  const selectCategory = (c: string) => {
    setCategory(c);
    setSpecialist('');
  };

  const hasMore = artists.length < total;

  const rung = (active: boolean, size: 'lg' | 'sm' = 'lg') =>
    `rounded-full border transition ${
      size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-3 py-1 text-xs'
    } ${
      active
        ? 'border-[#a06f1e] bg-[#a06f1e] text-white'
        : 'border-neutral-300 text-neutral-600 hover:border-[#cda45c]'
    }`;

  const LevelLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="w-20 shrink-0 text-[10px] font-medium uppercase tracking-widest text-neutral-400">
      {children}
    </span>
  );

  return (
    <main className="min-h-screen bg-[#faf8f5] text-neutral-900">
      <header className="border-b border-neutral-200 px-6 py-10 text-center">
        <p className="text-xs tracking-[0.3em] text-[#a06f1e] uppercase">
          The KalaCUBE Community
        </p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">Artists</h1>
        <p className="mt-3 text-neutral-600">
          {loading
            ? 'Loading…'
            : `${total.toLocaleString()} artist${total === 1 ? '' : 's'}${
                domain || debounced ? ' match your filters' : ''
              }`}
        </p>
        {(domain || category || specialist) && (
          <p className="mt-2 text-xs text-neutral-500">
            {domain}
            {category && <span className="text-[#a06f1e]"> › {category}</span>}
            {specialist && <span className="text-[#a06f1e]"> › {specialist}</span>}
            <button
              onClick={() => selectDomain('')}
              className="ml-3 text-neutral-400 underline hover:text-neutral-700"
            >
              clear
            </button>
          </p>
        )}
      </header>

      {/* Ladder filter */}
      <div className="sticky top-16 z-10 space-y-2 border-b border-neutral-200 bg-[#faf8f5]/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto max-w-7xl space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <LevelLabel>Art type</LevelLabel>
            <button onClick={() => selectDomain('')} className={rung(domain === '')}>
              All
            </button>
            {artTypes.map((t) => (
              <button
                key={t.name}
                onClick={() => selectDomain(t.name)}
                className={rung(domain === t.name)}
              >
                {t.name}
              </button>
            ))}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artists…"
              className="ml-auto w-48 rounded-full border border-neutral-300 px-4 py-1.5 text-sm outline-none focus:border-[#cda45c] focus:ring-2 focus:ring-[#cda45c]/30"
            />
          </div>

          {domain && domainCategories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-2">
              <LevelLabel>Category</LevelLabel>
              <button onClick={() => selectCategory('')} className={rung(category === '', 'sm')}>
                All {domain}
              </button>
              {domainCategories.map((c) => (
                <button
                  key={c.category}
                  onClick={() => selectCategory(c.category)}
                  className={rung(category === c.category, 'sm')}
                >
                  {c.category}
                </button>
              ))}
            </div>
          )}

          {activeCat && activeCat.specialists.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-2">
              <LevelLabel>Art style</LevelLabel>
              <button onClick={() => setSpecialist('')} className={rung(specialist === '', 'sm')}>
                All {activeCat.category}
              </button>
              {activeCat.specialists.map((s) => (
                <button
                  key={s.name}
                  onClick={() => setSpecialist(s.name)}
                  className={rung(specialist === s.name, 'sm')}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : artists.length === 0 ? (
          <p className="py-20 text-center text-neutral-500">No artists match your filters.</p>
        ) : (
          <>
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
                      <span
                        key={d}
                        className="rounded-full border border-[#cda45c]/30 px-2 py-0.5 text-[#a06f1e]"
                      >
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

            <div className="mt-10 flex flex-col items-center gap-3">
              <p className="text-xs text-neutral-500">
                Showing {artists.length.toLocaleString()} of {total.toLocaleString()}
              </p>
              {hasMore && (
                <button
                  onClick={() => fetchPage(page + 1, false)}
                  disabled={loadingMore}
                  className="rounded-full border border-[#a06f1e] px-8 py-2.5 text-sm font-medium text-[#a06f1e] transition hover:bg-[#a06f1e] hover:text-white disabled:opacity-60"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
