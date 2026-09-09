'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import ArtworkMarquee from '@/components/ArtworkMarquee';

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

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.12, ease: 'easeOut' } }),
};

function initials(a: Artist) {
  const n = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.username;
  return n.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join('');
}

export default function Home() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);

  useEffect(() => {
    api.get('/api/explore/artists', { params: { limit: 10 } })
      .then(({ data }) => setArtists(data.data?.items || [])).catch(() => {});
    api.get('/api/explore/artworks', { params: { limit: 40 } })
      .then(({ data }) => setArtworks(data.data?.items || [])).catch(() => {});
  }, []);

  const imgs = artworks.flatMap((w) => w.images || []).filter(Boolean);
  const rowA = imgs.slice(0, 12);
  const rowB = imgs.slice(12, 24);

  return (
    <main className="bg-[#faf8f5] text-neutral-900">
      {/* ===== HERO — artwork-forward, animated ===== */}
      <section className="relative flex min-h-[92vh] flex-col justify-center overflow-hidden">
        {/* Animated artwork backdrop */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-4 opacity-70">
          <ArtworkMarquee images={rowA.length ? rowA : imgs} duration={60} />
          <ArtworkMarquee images={rowB.length ? rowB : imgs} reverse duration={70} />
        </div>
        {/* Legibility scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#faf8f5]/85 via-[#faf8f5]/70 to-[#faf8f5]/90" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.p custom={0} variants={fadeUp} initial="hidden" animate="show"
            className="text-xs uppercase tracking-[0.45em] text-[#a06f1e]">
            Kala · Art in three dimensions
          </motion.p>
          <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="show"
            className="mt-6 font-serif text-5xl leading-[1.05] md:text-7xl">
            Where India&apos;s artists <span className="italic text-[#a06f1e]">come alive</span>
          </motion.h1>
          <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show"
            className="mx-auto mt-6 max-w-xl text-lg text-neutral-700">
            A living gallery of handicraft, visual art, and performing arts —
            from the makers shaping culture today.
          </motion.p>
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
            className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/explore" className="rounded-full bg-[#111] px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#a06f1e]">
              Explore the Gallery
            </Link>
            <Link href="/all-artist" className="rounded-full border border-neutral-400 bg-white/60 px-8 py-3.5 text-sm font-semibold backdrop-blur transition hover:border-[#a06f1e]">
              Meet the Artists
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== Three dimensions ===== */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {DIMENSIONS.map((d, i) => (
            <motion.div key={d.key} custom={i} variants={fadeUp} initial="hidden"
              whileInView="show" viewport={{ once: true, amount: 0.4 }}
              className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
              <h3 className="font-serif text-2xl text-[#a06f1e]">{d.label}</h3>
              <p className="mt-3 text-neutral-600">{d.blurb}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== Featured artworks carousel ===== */}
      {imgs.length > 0 && (
        <section className="py-8">
          <div className="mx-auto mb-8 flex max-w-7xl items-baseline justify-between px-6">
            <h2 className="font-serif text-3xl">From the Gallery</h2>
            <Link href="/explore" className="text-sm text-[#a06f1e] hover:underline">Explore →</Link>
          </div>
          <ArtworkMarquee images={imgs} duration={80} />
        </section>
      )}

      {/* ===== Featured artists ===== */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="font-serif text-3xl">Featured Artists</h2>
          <Link href="/all-artist" className="text-sm text-[#a06f1e] hover:underline">View all →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
          {artists.map((a, i) => (
            <motion.div key={a._id} custom={i % 5} variants={fadeUp} initial="hidden"
              whileInView="show" viewport={{ once: true, amount: 0.3 }}>
              <Link href={`/artist/${a.username}`}
                className="group block rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
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
                <p className="mt-2 text-xs text-neutral-400">{a.artworkCount} works</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
