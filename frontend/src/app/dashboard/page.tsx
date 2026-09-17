'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import ShareArtistPage, { hasShared } from '@/components/ShareArtistPage';

interface ArtistProfile {
  headline?: string;
  statement?: string;
  artDimensions?: string[];
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [artworkCount, setArtworkCount] = useState<number | null>(null);
  const [enquiryCount, setEnquiryCount] = useState<number | null>(null);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Pull the artist's REAL activation data: artist profile (headline/dimensions/
  // statement), artwork count, and enquiry count. No fabricated metrics.
  useEffect(() => {
    if (!user?.username) return;
    setShared(hasShared(user.username));
    if (user.role === 'artist') {
      api
        .get(`/api/users/${user.username}/artist-profile`)
        .then((res) => setProfile(res.data?.data || {}))
        .catch(() => setProfile({}));
      api
        .get('/api/artworks/mine')
        .then((res) => setArtworkCount(res.data?.data?.total ?? 0))
        .catch(() => setArtworkCount(0));
    }
    api
      .get('/api/enquiries/mine')
      .then((res) => setEnquiryCount(res.data?.counts?.total ?? 0))
      .catch(() => setEnquiryCount(0));
  }, [user?.username, user?.role]);

  const isArtist = user?.role === 'artist';

  const checklist = useMemo(() => {
    const count = artworkCount ?? 0;
    return [
      {
        label: 'Add a headline',
        done: !!profile?.headline,
        href: '/profile/edit',
        cta: 'Add headline',
      },
      {
        label: 'Choose your art dimensions',
        done: !!profile?.artDimensions?.length,
        href: '/profile/edit',
        cta: 'Choose',
      },
      {
        label: 'Write your bio / artist statement',
        done: !!(user?.bio || profile?.statement),
        href: '/profile/edit',
        cta: 'Write bio',
      },
      {
        label: 'Upload 3 artworks',
        done: count >= 3,
        detail: `${Math.min(count, 3)}/3`,
        href: '/dashboard/upload',
        cta: 'Upload',
      },
      {
        label: 'Share your artist page',
        done: shared,
        href: '#share',
        cta: 'Share',
      },
    ];
  }, [profile, artworkCount, shared, user?.bio]);

  const doneCount = checklist.filter((c) => c.done).length;
  const checklistPct = Math.round((doneCount / checklist.length) * 100);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="flex-1 bg-cream">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-1 font-serif text-2xl font-bold text-navy sm:text-3xl">
          Welcome, {user.firstName || user.username}!
        </h1>
        <p className="mb-8 text-muted">
          Let’s get your portfolio in front of collectors and curators.
        </p>

        {/* Stats — real data only */}
        <div className="mb-8 grid grid-cols-3 gap-3 sm:gap-4">
          <Stat
            label="Artworks"
            value={isArtist ? fmt(artworkCount) : '—'}
          />
          <Stat label="Enquiries" value={fmt(enquiryCount)} />
          <Stat
            label="Profile complete"
            value={`${user.profileCompleteness ?? 0}%`}
          />
        </div>

        {isArtist && (
          <>
            {/* Empty-state CTA when the artist has no artworks yet */}
            {artworkCount === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex flex-col items-start gap-4 rounded-2xl border border-line bg-navy p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8"
              >
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl">
                    Your portfolio is empty
                  </h2>
                  <p className="mt-1 text-sm text-white/70">
                    Upload your first artwork — it takes about a minute and
                    brings your page to life.
                  </p>
                </div>
                <Link
                  href="/dashboard/upload"
                  className="whitespace-nowrap rounded-lg bg-yellow px-5 py-3 text-sm font-semibold text-navy transition hover:bg-yellow-deep"
                >
                  Upload your first artwork
                </Link>
              </motion.div>
            )}

            {/* Activation checklist */}
            <section className="mb-8 rounded-2xl border border-line bg-white p-5 sm:p-6">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-semibold text-navy">Complete your profile</h2>
                <span className="text-sm font-semibold text-navy">
                  {doneCount}/{checklist.length}
                </span>
              </div>
              <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-navy/10">
                <motion.div
                  className="h-full rounded-full bg-yellow"
                  initial={false}
                  animate={{ width: `${checklistPct}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>

              <ul className="divide-y divide-line">
                {checklist.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-3 py-3"
                  >
                    <span
                      aria-hidden
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-xs ${
                        item.done
                          ? 'border-teal bg-teal text-white'
                          : 'border-line bg-white text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span
                      className={`flex-1 text-sm ${
                        item.done
                          ? 'text-muted line-through'
                          : 'font-medium text-navy'
                      }`}
                    >
                      {item.label}
                      {item.detail && (
                        <span className="ml-2 text-xs text-muted">
                          {item.detail}
                        </span>
                      )}
                    </span>
                    {!item.done && (
                      <Link
                        href={item.href}
                        className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-indigo transition hover:border-indigo hover:bg-brand-50"
                      >
                        {item.cta}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            {/* Prominent share block */}
            <section
              id="share"
              className="mb-8 scroll-mt-24 rounded-2xl border border-line bg-white p-5 sm:p-6"
            >
              <h2 className="font-semibold text-navy">Share your artist page</h2>
              <p className="mb-4 mt-1 text-sm text-muted">
                Your public portfolio is live. Send it to collectors, galleries,
                and your audience.
              </p>
              <ShareArtistPage
                username={user.username}
                onShared={() => setShared(true)}
              />
            </section>
          </>
        )}

        {/* Quick actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isArtist && (
            <QuickAction
              href="/dashboard/upload"
              title="Upload artwork"
              desc="Add a new piece to your portfolio"
            />
          )}
          <QuickAction
            href="/profile/edit"
            title="Edit profile"
            desc={`Update your info and ${isArtist ? 'portfolio' : 'details'}`}
          />
          <QuickAction
            href="/dashboard/enquiries"
            title="Enquiries"
            desc="See who wants to buy or connect"
          />
          {isArtist && (
            <QuickAction
              href="/dashboard/orders"
              title="Sales & orders"
              desc="Track orders, shipping and payouts"
            />
          )}
          <QuickAction
            href={`/artist/${user.username}`}
            title="View public page"
            desc="See how visitors see your page"
          />
          <QuickAction
            href="/explore"
            title="Explore artists"
            desc="Discover artists across India"
          />
        </div>
      </div>
    </main>
  );
}

function fmt(v: number | null) {
  return v === null ? '…' : String(v);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4 text-center">
      <div className="font-serif text-2xl font-bold text-navy sm:text-3xl">
        {value}
      </div>
      <div className="mt-1 text-xs text-muted sm:text-sm">{label}</div>
    </div>
  );
}

function QuickAction({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-line bg-white p-5 transition hover:shadow-sm"
    >
      <h3 className="mb-1 font-semibold text-navy">{title}</h3>
      <p className="text-sm text-muted">{desc}</p>
    </Link>
  );
}
