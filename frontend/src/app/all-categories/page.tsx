'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Category {
  domain: string;
  category: string;
  count: number;
  specialists: { name: string; count: number }[];
}

const DOMAIN_ACCENT: Record<string, string> = {
  'Visual Art': '#ff8a00',
  Handicraft: '#00a896',
  'Performing Art': '#d81b60',
};

export default function AllCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/explore/categories')
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const domains = Array.from(new Set(categories.map((c) => c.domain)));

  return (
    <main className="min-h-screen bg-[#faf7f2] text-neutral-900">
      <header className="border-b border-neutral-200 px-6 py-10 text-center sm:py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-[#202f9a]">Browse</p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">Categories</h1>
        <p className="mx-auto mt-3 max-w-xl text-neutral-600">
          Explore India&apos;s art across every discipline — from painting and
          photography to jewellery, textiles and more.
        </p>
      </header>

      <section className="mx-auto max-w-5xl px-4 pt-10 sm:px-6">
        <h2 className="font-serif text-2xl">Traditional Indian art styles</h2>
        <p className="mt-3 max-w-3xl text-neutral-600">
          India&apos;s folk and classical traditions each carry the story of a
          region and its makers. Here are some of the styles you can discover on
          KalaCUBE — every piece an original, made by human hands.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            { name: 'Madhubani (Mithila)', desc: 'Bright, symbolic line painting from Bihar, filling every space with nature and myth.' },
            { name: 'Pichwai', desc: 'Devotional cloth paintings of Krishna from Nathdwara, Rajasthan, rich in detail and gold.' },
            { name: 'Warli', desc: 'White tribal painting from Maharashtra built from simple circles, triangles and lines.' },
            { name: 'Gond', desc: 'Vivid dot-and-line storytelling art of the Gond community of central India.' },
            { name: 'Pattachitra', desc: 'Intricate scroll painting from Odisha and Bengal, drawn with natural pigments.' },
            { name: 'Kalamkari', desc: 'Hand-painted and block-printed narrative textile art from Andhra Pradesh.' },
          ].map((s) => (
            <div key={s.name} className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h3 className="font-serif text-lg text-[#0b1f52]">{s.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">{s.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-neutral-600">
          Looking for a particular tradition?{' '}
          <Link href="/explore" className="font-medium text-[#202f9a] hover:underline">
            Browse original work in the gallery
          </Link>
          .
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-neutral-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {domains.map((domain) => (
              <div key={domain}>
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: DOMAIN_ACCENT[domain] || '#202f9a' }}
                  />
                  <h2 className="font-serif text-2xl">{domain}</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {categories
                    .filter((c) => c.domain === domain)
                    .map((c) => (
                      <Link
                        key={c.category}
                        href="/explore"
                        className="group rounded-2xl border border-neutral-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#202f9a]/40 hover:shadow-sm"
                      >
                        <h3 className="font-serif text-lg leading-tight">{c.category}</h3>
                        <p className="mt-1 text-sm text-neutral-500">
                          {c.count.toLocaleString()} artworks
                        </p>
                        <p className="mt-3 line-clamp-1 text-xs text-neutral-400">
                          {c.specialists.slice(0, 3).map((s) => s.name).join(' · ')}
                        </p>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/explore"
            className="inline-block rounded-full bg-[#0b1f52] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#202f9a]"
          >
            Explore the full gallery →
          </Link>
        </div>
      </section>
    </main>
  );
}
