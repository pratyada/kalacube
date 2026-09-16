'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import EnquiryModal, { type EnquiryIntent } from '@/components/EnquiryModal';
import ArtworkGallery from '@/components/ArtworkGallery';

const DIMENSION_LABEL: Record<string, string> = {
  handicraft: 'Handicraft',
  visual_art: 'Visual Art',
  performing_arts: 'Performing Arts',
};
const DIMENSION_PILL: Record<string, string> = {
  visual_art: 'border-orange/40 bg-orange/10 text-orange-deep',
  handicraft: 'border-teal/40 bg-teal/10 text-teal-deep',
  performing_arts: 'border-magenta/40 bg-magenta/10 text-magenta',
};
const dimPill = (d: string) =>
  DIMENSION_PILL[d] || 'border-indigo/30 bg-indigo/5 text-indigo';

function formatPrice(cost?: number, currency?: string) {
  if (!cost && cost !== 0) return null;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(cost);
  } catch {
    return `${currency || 'INR'} ${cost.toLocaleString('en-IN')}`;
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
}

export default function ArtworkPage() {
  const { id } = useParams<{ id: string }>();
  const [art, setArt] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound'>('loading');
  // Extra artist detail (avatar / location / dimension) + other works — the
  // artwork endpoint only returns a minimal artist stub, so we fetch these.
  const [artistDetail, setArtistDetail] = useState<any>(null);
  const [more, setMore] = useState<any[]>([]);
  const [modal, setModal] = useState<{ open: boolean; intent: EnquiryIntent }>({
    open: false,
    intent: 'enquiry',
  });

  useEffect(() => {
    if (!id) return;
    setStatus('loading');
    api
      .get(`/api/explore/artworks/${id}`)
      .then(({ data }) => {
        setArt(data.data);
        setStatus('ok');
      })
      .catch(() => setStatus('notfound'));
  }, [id]);

  // Once we know the artist, fetch their profile + other works.
  useEffect(() => {
    const username = art?.artist?.username;
    if (!username) return;
    setArtistDetail(null);
    setMore([]);
    api
      .get(`/api/explore/artists/${username}`)
      .then(({ data }) => {
        setArtistDetail(data.data);
        const others = (data.data?.artworks || []).filter(
          (w: any) => w._id !== (art._id || id),
        );
        setMore(others.slice(0, 8));
      })
      .catch(() => {});
  }, [art?.artist?.username, art?._id, id]);

  if (status === 'loading') return <ArtworkSkeleton />;
  if (status === 'notfound')
    return (
      <div className="min-h-screen bg-cream p-10 text-center text-muted">
        Artwork not found.{' '}
        <Link href="/explore" className="text-indigo hover:underline">
          Back to gallery
        </Link>
      </div>
    );

  const artist = art.artist;
  const artistName = artist
    ? `${artist.firstName || ''} ${artist.lastName || ''}`.trim() ||
      artist.username
    : 'Unknown artist';
  const price = formatPrice(art.cost, art.currency);

  const user = artistDetail?.user;
  const artProfile = artistDetail?.profile;
  const artistLoc = user
    ? [user.location?.city, user.location?.country].filter(Boolean).join(', ')
    : '';
  const artistDims: string[] = artProfile?.artDimensions || [];

  // Optional WhatsApp: only when the artist exposes a public number.
  const waNumber = (
    artist?.socialLinks?.whatsapp ||
    artist?.whatsapp ||
    artist?.phone ||
    ''
  )
    .toString()
    .replace(/[^\d]/g, '');
  const waLink = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
        `Hi ${artistName}, I'm interested in your artwork "${art.title || 'Untitled'}" on KalaCUBE.`,
      )}`
    : '';

  const specs: Array<[string, string]> = [];
  if (art.medium) specs.push(['Medium', art.medium]);
  if (art.material) specs.push(['Material', art.material]);
  if (art.theme) specs.push(['Theme', art.theme]);
  if (art.dimensions?.height || art.dimensions?.width)
    specs.push([
      'Size',
      `${art.dimensions?.height ?? '—'} × ${art.dimensions?.width ?? '—'} cm`,
    ]);

  return (
    <main className="min-h-screen bg-cream text-navy-deep">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:py-12">
        <nav className="mb-8 text-sm text-muted">
          <Link href="/explore" className="transition hover:text-indigo">
            Gallery
          </Link>
          <span className="mx-2 text-muted/50">/</span>
          <span className="text-navy-deep">{art.title || 'Untitled'}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14">
          {/* Gallery */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <ArtworkGallery images={art.images || []} title={art.title || 'Untitled'} />
          </motion.div>

          {/* Detail column (sticky on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
            className="lg:sticky lg:top-24 lg:self-start"
          >
            <h1 className="font-serif text-3xl leading-tight sm:text-4xl">
              {art.title || 'Untitled'}
            </h1>
            {artist && (
              <Link
                href={`/artist/${artist.username}`}
                className="mt-2 inline-block text-indigo transition hover:underline"
              >
                by {artistName}
              </Link>
            )}

            {price && (
              <div className="mt-6">
                <p className="text-2xl font-medium text-navy-deep">{price}</p>
                <p className="mt-1 text-sm text-muted">
                  + shipping calculated at checkout
                </p>
              </div>
            )}

            {/* Buy / Enquire — buyer → artist connection (preserved feature) */}
            {artist?.username && (
              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setModal({ open: true, intent: 'buy' })}
                  className="rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-navy-deep"
                >
                  Buy / Make an offer
                </button>
                <button
                  type="button"
                  onClick={() => setModal({ open: true, intent: 'enquiry' })}
                  className="rounded-lg border border-navy/25 bg-white px-6 py-3 text-sm font-semibold text-navy transition hover:border-indigo hover:text-indigo"
                >
                  Enquire
                </button>
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-teal/40 bg-teal/10 px-5 py-3 text-sm font-semibold text-teal-deep transition hover:bg-teal/20"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm5.8 14.06c-.24.68-1.4 1.3-1.94 1.34-.5.05-1.13.07-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.94-4.36-.15-.19-1.19-1.58-1.19-3.01 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36l.56.01c.18 0 .42-.07.66.5.24.58.82 2.01.89 2.16.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.29.72 1.18 1.54 1.91 1.06.94 1.95 1.24 2.24 1.38.28.14.45.12.61-.07.16-.19.7-.82.89-1.1.19-.29.38-.24.64-.14.27.09 1.69.8 1.98.94.29.14.48.21.55.33.07.12.07.68-.17 1.36z" />
                    </svg>
                    Chat on WhatsApp
                  </a>
                )}
              </div>
            )}

            {/* Spec rows */}
            {specs.length > 0 && (
              <dl className="mt-8 divide-y divide-line border-y border-line text-sm">
                {specs.map(([label, value]) => (
                  <div key={label} className="flex gap-4 py-3">
                    <dt className="w-28 flex-shrink-0 text-muted">{label}</dt>
                    <dd className="text-navy-deep">{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {art.description && (
              <div className="mt-8">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  About this work
                </h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-neutral-700">
                  {art.description}
                </p>
              </div>
            )}

            {/* Artist card */}
            {artist?.username && (
              <Link
                href={`/artist/${artist.username}`}
                className="group mt-8 flex items-center gap-4 rounded-2xl border border-line bg-white p-4 transition hover:border-indigo/40 hover:shadow-sm"
              >
                {user?.avatar?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar.url}
                    alt={artistName}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo/30 to-indigo/5 font-serif text-lg text-indigo">
                    {initials(artistName)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-serif text-lg text-navy-deep">
                    {artistName}
                  </p>
                  {artistLoc && (
                    <p className="truncate text-sm text-muted">{artistLoc}</p>
                  )}
                  {artistDims.length > 0 && (
                    <span
                      className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${dimPill(artistDims[0])}`}
                    >
                      {DIMENSION_LABEL[artistDims[0]] || artistDims[0]}
                    </span>
                  )}
                </div>
                <span className="ml-auto flex-shrink-0 text-sm font-medium text-indigo transition group-hover:translate-x-0.5">
                  View profile →
                </span>
              </Link>
            )}
          </motion.div>
        </div>

        {/* More from this artist */}
        {more.length > 0 && (
          <section className="mt-20 border-t border-line pt-12">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="font-serif text-2xl">More from {artistName}</h2>
              {artist?.username && (
                <Link
                  href={`/artist/${artist.username}`}
                  className="text-sm text-indigo hover:underline"
                >
                  View all →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {more.map((w, i) => (
                <motion.div
                  key={w._id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: (i % 4) * 0.06, ease: 'easeOut' }}
                >
                  <Link
                    href={`/art-work/${w._id}`}
                    className="group block overflow-hidden rounded-xl border border-line bg-white transition hover:-translate-y-1 hover:border-indigo/40 hover:shadow-md"
                  >
                    <div className="flex aspect-[4/5] items-center justify-center overflow-hidden bg-cream-2">
                      {w.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={w.images[0]}
                          alt={w.title || 'Artwork'}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <span className="p-3 text-center font-serif text-indigo/70 line-clamp-3">
                          {w.title || 'Untitled'}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="truncate text-sm">{w.title || 'Untitled'}</h3>
                      {formatPrice(w.cost, w.currency) && (
                        <p className="text-xs text-indigo">
                          {formatPrice(w.cost, w.currency)}
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>

      {artist?.username && (
        <EnquiryModal
          open={modal.open}
          onClose={() => setModal((m) => ({ ...m, open: false }))}
          artistUsername={artist.username}
          artistName={artistName}
          artworkId={art._id || id}
          artworkTitle={art.title || 'Untitled'}
          intent={modal.intent}
        />
      )}
    </main>
  );
}

function ArtworkSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 h-4 w-40 rounded bg-line" />
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14">
          <div>
            <div className="aspect-[4/5] rounded-2xl bg-line" />
            <div className="mt-4 flex gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-20 w-20 rounded-lg bg-line" />
              ))}
            </div>
          </div>
          <div>
            <div className="h-9 w-3/4 rounded bg-line" />
            <div className="mt-3 h-4 w-32 rounded bg-line" />
            <div className="mt-6 h-8 w-40 rounded bg-line" />
            <div className="mt-7 flex gap-3">
              <div className="h-12 w-44 rounded-lg bg-line" />
              <div className="h-12 w-28 rounded-lg bg-line" />
            </div>
            <div className="mt-8 space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-5 w-full rounded bg-line" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
