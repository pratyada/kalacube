'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import api from '@/lib/api';
import EnquiryModal from '@/components/EnquiryModal';

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

// Social-link platforms we know how to render. Values from the API may be a
// bare handle ("arthouseinfinity") or a full URL — normalise both to a URL.
const SOCIAL: Record<
  string,
  { label: string; base: (h: string) => string; icon: React.ReactNode }
> = {
  instagram: {
    label: 'Instagram',
    base: (h) => `https://instagram.com/${h.replace(/^@/, '')}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  twitter: {
    label: 'Twitter / X',
    base: (h) => `https://x.com/${h.replace(/^@/, '')}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.9 2H22l-7.5 8.6L23 22h-6.9l-5.4-7-6.2 7H1.4l8-9.2L1 2h7l4.9 6.5L18.9 2zm-2.4 18h1.9L7.6 4H5.6l10.9 16z" />
      </svg>
    ),
  },
  facebook: {
    label: 'Facebook',
    base: (h) => `https://facebook.com/${h}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.5 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.25-1.5 1.5-1.5H17V4.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.3H7.8V14h2.7v8h3z" />
      </svg>
    ),
  },
  youtube: {
    label: 'YouTube',
    base: (h) =>
      h.startsWith('@') ? `https://youtube.com/${h}` : `https://youtube.com/@${h}`,
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M22 8.2a3 3 0 0 0-2.1-2.1C18.1 5.6 12 5.6 12 5.6s-6.1 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.8.5 7.9.5 7.9.5s6.1 0 7.9-.5a3 3 0 0 0 2.1-2.1c.3-1.2.4-2.5.4-3.8s-.1-2.6-.4-3.8zM10 15V9l5 3-5 3z" />
      </svg>
    ),
  },
};

const GENERIC_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type SocialLink = { key: string; label: string; href: string; icon: React.ReactNode };

function buildSocials(
  socialLinks: Record<string, unknown>,
  website?: string | null,
): SocialLink[] {
  const out: SocialLink[] = [];
  for (const [key, raw] of Object.entries(socialLinks || {})) {
    if (key === '_id' || key === 'whatsapp' || raw == null) continue;
    if (typeof raw !== 'string') continue;
    const val = raw.trim();
    if (!val) continue;
    const cfg = SOCIAL[key];
    const href = /^https?:\/\//i.test(val)
      ? val
      : cfg
        ? cfg.base(val)
        : `https://${val}`;
    out.push({
      key,
      label: cfg?.label || key.charAt(0).toUpperCase() + key.slice(1),
      href,
      icon: cfg?.icon || GENERIC_ICON,
    });
  }
  if (website && website.trim()) {
    const w = website.trim();
    out.push({
      key: 'website',
      label: 'Website',
      href: /^https?:\/\//i.test(w) ? w : `https://${w}`,
      icon: GENERIC_ICON,
    });
  }
  return out;
}

type Tab = 'works' | 'about';

export default function ArtistPage() {
  const { username } = useParams<{ username: string }>();
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound'>('loading');
  const [contactOpen, setContactOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('works');

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

  if (status === 'loading') return <ArtistSkeleton />;
  if (status === 'notfound')
    return (
      <div className="min-h-screen bg-cream p-10 text-center text-muted">
        Artist not found.{' '}
        <Link href="/all-artist" className="text-indigo hover:underline">
          Back to artists
        </Link>
      </div>
    );

  const { user, profile, artworks } = data;
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
  const socials = buildSocials(user.socialLinks || {}, user.website);
  const location = [user.location?.city, user.location?.country]
    .map((s: string) => (s || '').trim())
    .filter(Boolean)
    .join(', ');
  const dims: string[] = profile?.artDimensions || [];
  const skills: string[] = profile?.skills || [];
  const mediums: string[] = profile?.mediums || [];
  const availableForCommission = Boolean(profile?.availableForCommission);
  // Canonical public "About": the artist statement is the intended field, but
  // fall back to the Basic-tab bio so whichever the artist actually filled in
  // still renders (the two overlap — see profile/edit helper notes).
  const about: string = profile?.statement || user.bio || '';
  const hasAbout = Boolean(
    about || location || socials.length || skills.length || mediums.length,
  );

  const TABS: Array<{ key: Tab; label: string }> = [
    { key: 'works', label: `Works (${artworks.length})` },
    ...(hasAbout ? [{ key: 'about' as Tab, label: 'About' }] : []),
  ];

  return (
    <main className="min-h-screen bg-cream text-navy-deep">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden border-b border-line">
        {user.coverImage?.url && (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.coverImage.url}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-cream/80 via-cream/85 to-cream" />
          </div>
        )}

        <div className="relative mx-auto max-w-5xl px-6 py-14">
          <Link
            href="/all-artist"
            className="text-sm text-muted transition hover:text-indigo"
          >
            ← All artists
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start"
          >
            {user.avatar?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar.url}
                alt={name}
                className="h-28 w-28 flex-shrink-0 rounded-full border-4 border-white object-cover shadow-md"
              />
            ) : (
              <div className="flex h-28 w-28 flex-shrink-0 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-indigo/30 to-indigo/5 font-serif text-4xl text-indigo shadow-md">
                {name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((s: string) => s[0]?.toUpperCase())
                  .join('')}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-4xl leading-tight">{name}</h1>
              <p className="text-muted">@{user.username}</p>

              {profile?.headline && (
                <p className="mt-3 font-serif text-xl italic text-indigo">
                  “{profile.headline}”
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {dims.map((d) => (
                  <span
                    key={d}
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${dimPill(d)}`}
                  >
                    {DIMENSION_LABEL[d] || d}
                  </span>
                ))}
                {location && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-muted">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                    {location}
                  </span>
                )}
                {availableForCommission && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-teal/40 bg-teal/10 px-3 py-1 text-xs font-semibold text-teal-deep">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Available for commissions
                  </span>
                )}
              </div>

              {(skills.length > 0 || mediums.length > 0) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {[...skills, ...mediums].map((tag, i) => (
                    <span
                      key={`${tag}-${i}`}
                      className="rounded-full border border-line bg-white/70 px-3 py-1 text-xs font-medium text-navy"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="flex-shrink-0 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-navy-deep"
            >
              Contact artist
            </button>
          </motion.div>

          {about && (
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
              className="mt-8 max-w-3xl leading-relaxed text-neutral-700"
            >
              {about}
            </motion.p>
          )}
        </div>
      </section>

      {/* ===== Tabs ===== */}
      <div className="sticky top-0 z-10 border-b border-line bg-cream/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-6 px-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`relative py-4 text-sm font-medium transition ${
                tab === t.key ? 'text-navy-deep' : 'text-muted hover:text-navy'
              }`}
            >
              {t.label}
              {tab === t.key && (
                <motion.span
                  layoutId="artist-tab-underline"
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-indigo"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Tab content ===== */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <AnimatePresence mode="wait">
          {tab === 'works' ? (
            <motion.div
              key="works"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              {artworks.length === 0 ? (
                <p className="text-muted">No published works yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {artworks.map((w: any, i: number) => (
                    <motion.div
                      key={w._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.04, ease: 'easeOut' }}
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
                          {w.cost ? (
                            <p className="text-xs text-indigo">
                              {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: w.currency || 'INR',
                                maximumFractionDigits: 0,
                              }).format(w.cost)}
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="max-w-3xl"
            >
              {about && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Artist statement
                  </h2>
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-neutral-700">
                    {about}
                  </p>
                </div>
              )}

              {(skills.length > 0 || mediums.length > 0) && (
                <div className="mt-8 grid gap-8 sm:grid-cols-2">
                  {skills.length > 0 && (
                    <div>
                      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                        Skills
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {skills.map((s, i) => (
                          <span
                            key={`${s}-${i}`}
                            className="rounded-full border border-line bg-white px-3 py-1 text-sm text-navy"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {mediums.length > 0 && (
                    <div>
                      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                        Mediums
                      </h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {mediums.map((m, i) => (
                          <span
                            key={`${m}-${i}`}
                            className="rounded-full border border-line bg-white px-3 py-1 text-sm text-navy"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {location && (
                <div className="mt-8">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Based in
                  </h2>
                  <p className="mt-2 text-neutral-700">{location}</p>
                </div>
              )}

              {socials.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Find {name.split(/\s+/)[0]} online
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {socials.map((s) => (
                      <a
                        key={s.key}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-navy transition hover:border-indigo hover:text-indigo"
                      >
                        {s.icon}
                        {s.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <EnquiryModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        artistUsername={user.username}
        artistName={name}
        intent="enquiry"
      />
    </main>
  );
}

function ArtistSkeleton() {
  return (
    <main className="min-h-screen animate-pulse bg-cream">
      <section className="border-b border-line px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="h-4 w-24 rounded bg-line" />
          <div className="mt-6 flex gap-6">
            <div className="h-28 w-28 rounded-full bg-line" />
            <div className="flex-1 space-y-3 pt-2">
              <div className="h-9 w-64 rounded bg-line" />
              <div className="h-4 w-32 rounded bg-line" />
              <div className="h-5 w-80 rounded bg-line" />
            </div>
          </div>
          <div className="mt-8 h-16 w-full max-w-3xl rounded bg-line" />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-xl bg-line" />
          ))}
        </div>
      </section>
    </main>
  );
}
