'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

export default function ArtworkPage() {
  const { id } = useParams<{ id: string }>();
  const [art, setArt] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound'>('loading');

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
    </main>
  );
}
