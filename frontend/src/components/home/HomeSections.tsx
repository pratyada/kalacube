'use client';

/**
 * HomeSections — everything below the hero fold. Isolated as a client island so
 * the homepage itself stays a Server Component (SSR/indexable, instant hero).
 * Data is fetched client-side for the gallery marquee + featured artists; the
 * static editorial sections carry tasteful `whileInView` scroll-reveals and
 * hover-lift on cards, consistent with the artwork/artist pages.
 */

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

export default function HomeSections() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);

  useEffect(() => {
    api.get('/api/explore/artists', { params: { limit: 10 } })
      .then(({ data }) => setArtists(data.data?.items || [])).catch(() => {});
    api.get('/api/explore/artworks', { params: { limit: 40 } })
      .then(({ data }) => setArtworks(data.data?.items || [])).catch(() => {});
  }, []);

  const imgs = artworks.flatMap((w) => w.images || []).filter(Boolean);

  return (
    <>
      {/* ===== Three dimensions ===== */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {DIMENSIONS.map((d, i) => (
            <motion.div key={d.key} custom={i} variants={fadeUp} initial="hidden"
              whileInView="show" viewport={{ once: true, amount: 0.4 }}
              className={`group overflow-hidden rounded-2xl border border-line bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md ${d.ring}`}>
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
                className="group block rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
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

      {/* ===== Why KalaCUBE — AEO / artists in the AI age ===== */}
      <section className="border-t border-neutral-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
            <p className="text-xs uppercase tracking-[0.4em] text-[#202f9a]">Why KalaCUBE</p>
            <h2 className="mt-4 font-serif text-3xl leading-tight md:text-4xl">
              A home for India&apos;s artists in the age of AI
            </h2>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-neutral-700">
              As screens fill with AI-generated images, original, human-made art
              matters more than ever. KalaCUBE gives Indian artists, creators and
              artisans a place to build a portfolio, showcase and sell their work,
              and be discovered by people who specifically want art made by human
              hands — across Handicraft, Visual Art and Performing Arts.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                h: 'How do I showcase my art online?',
                b: 'Create a free profile, upload your work, and get a ready-made online portfolio you can share anywhere — no website needed. Your pieces appear in the gallery for collectors to discover.',
                cta: 'Showcase your art',
                href: '/all-artist',
              },
              {
                h: 'What should artists do in the AI age?',
                b: 'Lean into what only human hands can make — original, culturally rooted work with a story. On KalaCUBE, that authenticity is the whole point, and it is what keeps you discoverable.',
                cta: 'Read the FAQs',
                href: '/faqs',
              },
              {
                h: 'Where can I buy original Indian art?',
                b: 'Explore the gallery to discover original work — from Madhubani, Pichwai, Warli and Gond to photography and sculpture — and connect directly with the artist who made it.',
                cta: 'Explore the gallery',
                href: '/explore',
              },
            ].map((c, i) => (
              <motion.div
                key={c.h}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                className="flex flex-col rounded-2xl border border-neutral-200 bg-[#faf7f2] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-md"
              >
                <h3 className="font-serif text-lg leading-snug text-[#0b1f52]">{c.h}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-neutral-600">{c.b}</p>
                <Link href={c.href} className="mt-4 text-sm font-semibold text-[#202f9a] hover:underline">
                  {c.cta} →
                </Link>
              </motion.div>
            ))}
          </div>
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
    </>
  );
}
