'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
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
  {
    key: 'visual_art',
    label: 'Visual Art',
    blurb: 'Colour, line, and light on every surface.',
    accent: 'text-orange',
    bar: 'bg-orange',
    ring: 'group-hover:border-orange',
  },
  {
    key: 'handicraft',
    label: 'Handicraft',
    blurb: 'Hands that shape tradition into form.',
    accent: 'text-teal',
    bar: 'bg-teal',
    ring: 'group-hover:border-teal',
  },
  {
    key: 'performing_arts',
    label: 'Performing Arts',
    blurb: 'Movement, sound, and living expression.',
    accent: 'text-magenta',
    bar: 'bg-magenta',
    ring: 'group-hover:border-magenta',
  },
];

const fadeUp: Variants = {
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
    <main className="bg-cream text-navy-deep">
      {/* ===== HERO — artwork-forward, animated ===== */}
      <section className="relative flex min-h-[92vh] flex-col justify-center overflow-hidden">
        {/* Animated artwork backdrop */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-4 opacity-70">
          <ArtworkMarquee images={rowA.length ? rowA : imgs} duration={60} />
          <ArtworkMarquee images={rowB.length ? rowB : imgs} reverse duration={70} />
        </div>
        {/* Legibility scrim */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#faf7f2]/85 via-[#faf7f2]/70 to-[#faf7f2]/90" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.p custom={0} variants={fadeUp} initial="hidden" animate="show"
            className="text-xs uppercase tracking-[0.45em] text-[#202f9a]">
            Kala · Art in three dimensions
          </motion.p>
          <motion.h1 custom={1} variants={fadeUp} initial="hidden" animate="show"
            className="mt-6 font-serif text-5xl leading-[1.05] md:text-7xl">
            Where India&apos;s artists <span className="italic text-[#202f9a]">come alive</span>
          </motion.h1>
          <motion.p custom={2} variants={fadeUp} initial="hidden" animate="show"
            className="mx-auto mt-6 max-w-xl text-lg text-neutral-700">
            A living gallery of handicraft, visual art, and performing arts —
            from the makers shaping culture today.
          </motion.p>
          <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show"
            className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/explore" className="rounded-full bg-yellow px-8 py-3.5 text-sm font-semibold text-navy shadow-lg transition hover:bg-yellow-deep">
              Explore the Gallery
            </Link>
            <Link href="/all-artist" className="rounded-full border border-navy/30 bg-white/60 px-8 py-3.5 text-sm font-semibold text-navy backdrop-blur transition hover:border-navy hover:bg-navy hover:text-white">
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
              className={`group overflow-hidden rounded-2xl border border-line bg-white p-8 shadow-sm transition ${d.ring}`}>
              <span className={`mb-5 block h-1.5 w-10 rounded-full ${d.bar}`} aria-hidden />
              <h3 className={`font-serif text-2xl ${d.accent}`}>{d.label}</h3>
              <p className="mt-3 text-muted">{d.blurb}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== Featured artworks carousel ===== */}
      {imgs.length > 0 && (
        <section className="py-8">
          <div className="mx-auto mb-8 flex max-w-7xl items-baseline justify-between px-6">
            <h2 className="font-serif text-3xl">From the Gallery</h2>
            <Link href="/explore" className="text-sm text-[#202f9a] hover:underline">Explore →</Link>
          </div>
          <ArtworkMarquee images={imgs} duration={80} />
        </section>
      )}

      {/* ===== Featured artists ===== */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-8 flex items-baseline justify-between">
          <h2 className="font-serif text-3xl">Featured Artists</h2>
          <Link href="/all-artist" className="text-sm text-[#202f9a] hover:underline">View all →</Link>
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
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#202f9a]/30 to-[#202f9a]/5 font-serif text-xl text-[#202f9a]">
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

      {/* ===== Our Story ===== */}
      <section className="border-t border-neutral-200 bg-[#eef1ff]">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
            <p className="text-xs uppercase tracking-[0.4em] text-[#202f9a]">Our Story</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight md:text-5xl">
              It began on the walls of a café.
            </h2>
          </motion.div>

          <div className="mt-14 space-y-12">
            {[
              {
                year: '2019',
                title: 'Musée Art Café',
                body: 'It started at Musée Art Café — a place where coffee met canvas. Our walls became a living gallery, turning everyday cups of chai into first encounters with local art. Artists found their first audience here; customers took home their first original piece.',
              },
              {
                year: '2020',
                title: 'Born in lockdown',
                body: 'When COVID emptied the café, the art couldn’t stay on the walls alone. So we built KalaCUBE — to take those walls online. A digital gallery to keep local artisans visible, discovered, and connected to the people who love their work, even when the doors were closed.',
              },
              {
                year: 'Today',
                title: 'A home for artists',
                body: 'What began as a café wall is now a platform for artists across Handicraft, Visual Art, and Performing Arts — a place to showcase, connect, and grow. The walls never really closed. They just went everywhere.',
              },
            ].map((s, i) => (
              <motion.div
                key={s.year}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.4 }}
                className="grid gap-4 md:grid-cols-[140px_1fr]"
              >
                <div className="font-serif text-3xl text-[#202f9a]">{s.year}</div>
                <div>
                  <h3 className="font-serif text-xl">{s.title}</h3>
                  <p className="mt-3 leading-relaxed text-neutral-700">{s.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
