'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import EnquiryModal, { type EnquiryIntent } from '@/components/EnquiryModal';

export default function ArtworkPage() {
  const { id } = useParams<{ id: string }>();
  const [art, setArt] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound'>('loading');
  const [modal, setModal] = useState<{ open: boolean; intent: EnquiryIntent }>({
    open: false,
    intent: 'enquiry',
  });

  useEffect(() => {
    if (!id) return;
    api
      .get(`/api/explore/artworks/${id}`)
      .then(({ data }) => {
        setArt(data.data);
        setStatus('ok');
      })
      .catch(() => setStatus('notfound'));
  }, [id]);

  if (status === 'loading')
    return <div className="min-h-screen bg-[#faf7f2] p-10 text-neutral-600">Loading…</div>;
  if (status === 'notfound')
    return (
      <div className="min-h-screen bg-[#faf7f2] p-10 text-center text-neutral-600">
        Artwork not found.{' '}
        <Link href="/explore" className="text-[#202f9a] hover:underline">Back to gallery</Link>
      </div>
    );

  const artist = art.artist;
  const artistName = artist
    ? `${artist.firstName || ''} ${artist.lastName || ''}`.trim() || artist.username
    : 'Unknown artist';

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

  return (
    <main className="min-h-screen bg-[#faf7f2] text-neutral-900">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-2">
        <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-gradient-to-br from-neutral-100 to-neutral-200 p-8 text-center">
          {art.images && art.images.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={art.images[0]} alt={art.title || 'Artwork'} className="h-full w-full rounded-xl object-contain" />
          ) : (
            <span className="font-serif text-2xl text-[#202f9a]/70">{art.title || 'Untitled'}</span>
          )}
        </div>

        <div>
          <Link href="/explore" className="text-sm text-neutral-500 hover:text-[#202f9a]">← Gallery</Link>
          <h1 className="mt-4 font-serif text-4xl">{art.title || 'Untitled'}</h1>
          {artist && (
            <Link href={`/artist/${artist.username}`} className="mt-2 inline-block text-[#202f9a] hover:underline">
              by {artistName}
            </Link>
          )}

          {art.cost ? (
            <p className="mt-6 text-2xl">{art.currency || 'INR'} {art.cost.toLocaleString()}</p>
          ) : null}

          {art.description && (
            <p className="mt-6 leading-relaxed text-neutral-700">{art.description}</p>
          )}

          {/* Buyer → artist connection: enquire / buy / WhatsApp */}
          {artist?.username && (
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setModal({ open: true, intent: 'buy' })}
                className="rounded-lg bg-[#0b1f52] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#071738]"
              >
                Buy / Make an offer
              </button>
              <button
                type="button"
                onClick={() => setModal({ open: true, intent: 'enquiry' })}
                className="rounded-lg border border-[#0b1f52]/25 bg-white px-5 py-3 text-sm font-semibold text-[#0b1f52] transition hover:border-[#202f9a] hover:text-[#202f9a]"
              >
                Enquire
              </button>
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#00a896]/40 bg-[#00a896]/10 px-5 py-3 text-sm font-semibold text-[#087f6a] transition hover:bg-[#00a896]/20"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.9-4.44 9.9-9.9S17.5 2 12.04 2zm5.8 14.06c-.24.68-1.4 1.3-1.94 1.34-.5.05-1.13.07-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.17-4.94-4.36-.15-.19-1.19-1.58-1.19-3.01 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36l.56.01c.18 0 .42-.07.66.5.24.58.82 2.01.89 2.16.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.29.72 1.18 1.54 1.91 1.06.94 1.95 1.24 2.24 1.38.28.14.45.12.61-.07.16-.19.7-.82.89-1.1.19-.29.38-.24.64-.14.27.09 1.69.8 1.98.94.29.14.48.21.55.33.07.12.07.68-.17 1.36z" />
                  </svg>
                  Chat on WhatsApp
                </a>
              )}
            </div>
          )}

          <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
            {art.medium && (<div><dt className="text-neutral-500">Medium</dt><dd>{art.medium}</dd></div>)}
            {art.material && (<div><dt className="text-neutral-500">Material</dt><dd>{art.material}</dd></div>)}
            {art.theme && (<div><dt className="text-neutral-500">Theme</dt><dd>{art.theme}</dd></div>)}
            {(art.dimensions?.height || art.dimensions?.width) && (
              <div><dt className="text-neutral-500">Size</dt>
                <dd>{art.dimensions?.height} × {art.dimensions?.width}</dd></div>
            )}
          </dl>
        </div>
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
