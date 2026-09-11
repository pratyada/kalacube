'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export interface JournalArtist {
  _id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  artDimensions?: string[];
  artworkCount?: number;
  avatar?: { url?: string };
}

interface Category {
  domain: string;
  category: string;
  count: number;
  specialists: { name: string; count: number }[];
}

const PAGE_SIZE = 48;

export default function JournalExplorer({
  initialArtists = [],
}: {
  initialArtists?: JournalArtist[];
}) {
  const [artists, setArtists] = useState<JournalArtist[]>(initialArtists);
  const [total, setTotal] = useState(initialArtists.length);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);

  const [domain, setDomain] = useState('');
  const [category, setCategory] = useState('');
  const [specialist, setSpecialist] = useState('');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const reqId = useRef(0);
  // Skip the very first fetch effect if the server already handed us artists;
  // this avoids a load flicker while still hydrating filters/categories.
  const skipFirstFetch = useRef(initialArtists.length > 0);

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
      if (replace) setLoading(true);
      else setLoadingMore(true);
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
        const incoming: JournalArtist[] = p.items || [];
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
    // First run: if the server pre-rendered the default list, don't re-fetch it.
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false;
      return;
    }
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
    `whitespace-nowrap rounded-full border transition ${
      size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-3 py-1 text-xs'
    } ${
      active
        ? 'border-[#202f9a] bg-[#202f9a] text-white'
        : 'border-neutral-300 text-neutral-600 hover:border-[#202f9a]'
    }`;

  const LevelLabel = ({ children }: { children: React.ReactNode }) => (
    <span className="w-20 shrink-0 text-[10px] font-medium tracking-widest text-neutral-400 uppercase">
      {children}
    </span>
  );

  return (
    <>
      {/* Ladder filter + search — sticky, mobile-responsive */}
      <div className="sticky top-16 z-10 space-y-2 border-b border-neutral-200 bg-[#faf7f2]/95 px-6 py-3 backdrop-blur">
        <div className="mx-auto max-w-7xl space-y-2">
          {/* Search: full width on mobile, inline-right on desktop */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
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
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search artists…"
              aria-label="Search the Journal's artists"
              className="w-full rounded-full border border-neutral-300 px-4 py-1.5 text-sm outline-none focus:border-[#202f9a] focus:ring-2 focus:ring-[#202f9a]/30 sm:ml-auto sm:w-56"
            />
          </div>

          {domain && domainCategories.length > 0 && (
            <div className="-mx-1 flex items-center gap-2 overflow-x-auto border-t border-neutral-100 px-1 pt-2 sm:mx-0 sm:flex-wrap sm:px-0">
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
            <div className="-mx-1 flex items-center gap-2 overflow-x-auto border-t border-neutral-100 px-1 pt-2 sm:mx-0 sm:flex-wrap sm:px-0">
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

          {(domain || category || specialist) && (
            <p className="px-1 text-xs text-neutral-500">
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
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-serif text-3xl">Artist Portfolios</h2>
          {!loading && (
            <p className="text-sm text-neutral-500">
              {total.toLocaleString()} artist{total === 1 ? '' : 's'}
              {domain || debounced ? ' match your filters' : ''}
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-neutral-100" />
            ))}
          </div>
        ) : artists.length === 0 ? (
          <p className="py-20 text-center text-neutral-500">No artists match your filters.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {artists.map((a) => (
                <Link
                  key={a._id}
                  href={`/blog/${a.username}`}
                  className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    {a.avatar?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.avatar.url}
                        alt={a.username}
                        loading="lazy"
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#202f9a]/20 font-serif text-lg text-[#202f9a]">
                        {(a.firstName?.[0] || a.username?.[0] || 'A').toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-serif text-lg">
                        {`${a.firstName || ''} ${a.lastName || ''}`.trim() || a.username}
                      </h3>
                      <p className="text-sm text-neutral-500">{a.artworkCount ?? 0} works</p>
                    </div>
                  </div>
                  {a.headline && (
                    <p className="mt-4 line-clamp-2 text-sm text-neutral-600">{a.headline}</p>
                  )}
                  <span className="mt-4 inline-block text-sm text-[#202f9a] group-hover:underline">
                    Read portfolio →
                  </span>
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
                  className="rounded-full border border-[#202f9a] px-8 py-2.5 text-sm font-medium text-[#202f9a] transition hover:bg-[#202f9a] hover:text-white disabled:opacity-60"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </>
  );
}
