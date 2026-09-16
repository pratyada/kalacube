'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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

interface Category {
  domain: string;
  category: string;
  count: number;
  specialists: { name: string; count: number }[];
}

const PAGE_SIZE = 48;

/**
 * De-duplicate a page of artworks and spread works so the same artist doesn't
 * appear in consecutive tiles — used only on the default (unfiltered) feed,
 * which otherwise front-loads one artist's near-identical uploads.
 */
function diversify(list: Artwork[]): Artwork[] {
  const seen = new Set<string>();
  const unique: Artwork[] = [];
  for (const w of list) {
    // De-dup by id, and by an artist+title signature to catch re-uploads.
    const sig = `${w.artist?.username || ''}::${(w.title || '').trim().toLowerCase()}`;
    if (seen.has(w._id) || (w.title && seen.has(sig))) continue;
    seen.add(w._id);
    if (w.title) seen.add(sig);
    unique.push(w);
  }
  // Greedy interleave: keep relative order but avoid back-to-back same artist.
  const result: Artwork[] = [];
  const pool = [...unique];
  let last: string | undefined;
  while (pool.length) {
    let idx = pool.findIndex((w) => (w.artist?.username || w._id) !== last);
    if (idx === -1) idx = 0;
    const [picked] = pool.splice(idx, 1);
    result.push(picked);
    last = picked.artist?.username || picked._id;
  }
  return result;
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Artwork[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);

  // The three ladder levels — seeded from the URL query so category cards can
  // deep-link into a pre-filtered gallery (?domain=&category=&specialist=).
  const [domain, setDomain] = useState(() => searchParams.get('domain') || '');
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [specialist, setSpecialist] = useState(
    () => searchParams.get('specialist') || searchParams.get('style') || '',
  );

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
        const { data } = await api.get('/api/explore/artworks', {
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
        let incoming: Artwork[] = p.items || [];
        // On the default, unfiltered feed, de-dup and spread artists so the
        // first screen isn't one artist's repeated works. Filtered/search
        // results keep the server's relevance ordering untouched.
        const isDefault = !domain && !category && !specialist && !debounced;
        if (isDefault) incoming = diversify(incoming);
        setTotal(p.total || 0);
        setItems((prev) => {
          if (replace) return incoming;
          const seen = new Set(prev.map((w) => w._id));
          return [...prev, ...incoming.filter((w) => !seen.has(w._id))];
        });
        setPage(nextPage);
      } catch {
        if (id === reqId.current && replace) setItems([]);
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

  // Ladder derivations.
  const artTypes = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of categories)
      map.set(c.domain, (map.get(c.domain) || 0) + c.count);
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

  const hasMore = items.length < total;

  const rung = (active: boolean, size: 'lg' | 'sm' = 'lg') =>
    `shrink-0 whitespace-nowrap rounded-full border transition ${
      size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-3 py-1 text-xs'
    } ${
      active
        ? 'border-[#202f9a] bg-[#202f9a] text-white'
        : 'border-neutral-300 text-neutral-600 hover:border-[#202f9a]'
    }`;

  const LevelLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="w-20 shrink-0 text-[10px] font-medium uppercase tracking-widest text-neutral-400">
      {children}
    </span>
  );

  return (
    <main className="min-h-screen bg-[#faf7f2] text-neutral-900">
      <header className="border-b border-neutral-200 px-6 py-10 text-center">
        <p className="text-xs tracking-[0.3em] text-[#202f9a] uppercase">Explore</p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">The Gallery</h1>
        <p className="mt-3 text-neutral-600">
          {loading
            ? 'Loading…'
            : `${total.toLocaleString()} artworks${
                domain || debounced ? ' match your filters' : ' from the KalaCUBE community'
              }`}
        </p>
        {/* Breadcrumb of the current ladder selection */}
        {(domain || category || specialist) && (
          <p className="mt-2 text-xs text-neutral-500">
            {domain}
            {category && <span className="text-[#202f9a]"> › {category}</span>}
            {specialist && <span className="text-[#202f9a]"> › {specialist}</span>}
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
      <div className="sticky top-16 z-10 space-y-2 border-b border-neutral-200 bg-[#faf7f2]/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto max-w-7xl space-y-2">
          {/* Level 1 — Art type + search (search stacks full-width on mobile) */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
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
                  <span className="ml-1.5 text-xs opacity-70">{t.count}</span>
                </button>
              ))}
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full shrink-0 rounded-full border border-neutral-300 px-4 py-1.5 text-sm outline-none focus:border-[#202f9a] focus:ring-2 focus:ring-[#202f9a]/30 sm:w-48"
            />
          </div>

          {/* Level 2 — Category (appears once an art type is chosen) */}
          {domain && domainCategories.length > 0 && (
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-t border-neutral-100 pt-2">
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
                  <span className="ml-1 opacity-60">{c.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Level 3 — Art style (appears once a category is chosen) */}
          {activeCat && activeCat.specialists.length > 0 && (
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-t border-neutral-100 pt-2">
              <LevelLabel>Art style</LevelLabel>
              <button
                onClick={() => setSpecialist('')}
                className={rung(specialist === '', 'sm')}
              >
                All {activeCat.category}
              </button>
              {activeCat.specialists.map((s) => (
                <button
                  key={s.name}
                  onClick={() => setSpecialist(s.name)}
                  className={rung(specialist === s.name, 'sm')}
                >
                  {s.name}
                  <span className="ml-1 opacity-60">{s.count}</span>
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
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-20 text-center text-neutral-500">No artworks match your filters.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((w) => (
                <Link
                  key={w._id}
                  href={`/art-work/${w._id}`}
                  className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:border-[#202f9a]/50"
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
                      </div>
                    )}
                    <span className="absolute right-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white">
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
                      <p className="mt-1 text-xs text-[#202f9a]">
                        {w.currency || 'INR'} {w.cost.toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center gap-3">
              <p className="text-xs text-neutral-500">
                Showing {items.length.toLocaleString()} of {total.toLocaleString()}
              </p>
              {hasMore && (
                <button
                  onClick={() => fetchPage(page + 1, false)}
                  disabled={loadingMore}
                  className="rounded-full border border-[#202f9a] px-8 py-2.5 text-sm font-medium text-[#202f9a] transition hover:bg-[#202f9a] hover:text-white disabled:opacity-60"
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

export default function ExplorePage() {
  // useSearchParams() requires a Suspense boundary in Next.js 16.
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf7f2]" />}>
      <ExploreContent />
    </Suspense>
  );
}
