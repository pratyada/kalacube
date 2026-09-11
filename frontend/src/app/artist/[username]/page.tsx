'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

const DIMENSION_LABEL: Record<string, string> = {
  handicraft: 'Handicraft',
  visual_art: 'Visual Art',
  performing_arts: 'Performing Arts',
};

// Brand category coding: Visual Art = Orange, Handicraft = Teal, Performing = Magenta.
const DIMENSION_PILL: Record<string, string> = {
  visual_art: 'border-orange/40 bg-orange/10 text-orange-deep',
  handicraft: 'border-teal/40 bg-teal/10 text-teal-deep',
  performing_arts: 'border-magenta/40 bg-magenta/10 text-magenta',
};
const dimPill = (d: string) =>
  DIMENSION_PILL[d] || 'border-indigo/30 bg-indigo/5 text-indigo';

export default function ArtistPage() {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound'>('loading');

  useEffect(() => {
    if (!username) return;
    api
      .get(`/api/explore/artists/${username}`)
      .then(({ data }) => {
        setData(data.data);
        setStatus('ok');
      })
      .catch(() => setStatus('notfound'));
  }, [username]);

  if (status === 'loading')
    return <div className="min-h-screen bg-[#faf7f2] p-10 text-neutral-600">Loading…</div>;
  if (status === 'notfound')
    return (
      <div className="min-h-screen bg-[#faf7f2] p-10 text-center text-neutral-600">
        Artist not found.{' '}
        <Link href="/all-artist" className="text-[#202f9a] hover:underline">Back to artists</Link>
      </div>
    );

  const { user, profile, artworks } = data;
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
  const socials: Record<string, string> = user.socialLinks || {};

  return (
    <main className="min-h-screen bg-[#faf7f2] text-neutral-900">
      <section className="border-b border-neutral-200 px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <Link href="/all-artist" className="text-sm text-neutral-500 hover:text-[#202f9a]">
            ← All artists
          </Link>
          <div className="mt-6 flex items-center gap-6">
            {user.avatar?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar.url} alt={user.username} className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#202f9a]/30 to-[#202f9a]/5 font-serif text-3xl text-[#202f9a]">
                {name.split(/\s+/).slice(0, 2).map((s: string) => s[0]?.toUpperCase()).join('')}
              </div>
            )}
            <div>
              <h1 className="font-serif text-4xl">{name}</h1>
              <p className="text-neutral-500">@{user.username}</p>
              {(user.location?.city || user.location?.country) && (
                <p className="mt-1 text-sm text-neutral-500">
                  {[user.location?.city, user.location?.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>

          {profile?.headline && (
            <p className="mt-6 font-serif text-xl italic text-[#202f9a]">“{profile.headline}”</p>
          )}
          {profile?.statement && (
            <p className="mt-4 max-w-3xl leading-relaxed text-neutral-700">{profile.statement}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {(profile?.artDimensions || []).map((d: string) => (
              <span key={d} className={`rounded-full border px-3 py-1 text-xs font-medium ${dimPill(d)}`}>
                {DIMENSION_LABEL[d] || d}
              </span>
            ))}
            {Object.entries(socials)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <a key={k} href={v as string} target="_blank" rel="noreferrer"
                  className="text-xs text-neutral-500 hover:text-[#202f9a]">
                  {k}
                </a>
              ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="mb-6 font-serif text-2xl">
          Works <span className="text-neutral-500">({artworks.length})</span>
        </h2>
        {artworks.length === 0 ? (
          <p className="text-neutral-500">No published works yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {artworks.map((w: any) => (
              <Link key={w._id} href={`/art-work/${w._id}`}
                className="group overflow-hidden rounded-xl border border-neutral-200 transition hover:border-[#202f9a]/50">
                <div className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 p-3 text-center">
                  {w.images && w.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.images[0]} alt={w.title || 'Artwork'} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-serif text-[#202f9a]/70 line-clamp-3">{w.title || 'Untitled'}</span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="truncate text-sm">{w.title || 'Untitled'}</h3>
                  {w.cost ? <p className="text-xs text-[#202f9a]">{w.currency || 'INR'} {w.cost.toLocaleString()}</p> : null}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
