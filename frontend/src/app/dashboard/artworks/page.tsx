'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

interface MyArtwork {
  _id: string;
  title?: string;
  status?: string;
  cost?: number;
  currency?: string;
  available?: boolean;
  images?: string[];
}

function formatPrice(cost?: number, currency?: string) {
  if (cost === undefined || cost === null) return null;
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

const STATUS_PILL: Record<string, string> = {
  draft: 'border-neutral-300 bg-neutral-100 text-neutral-600',
  submitted: 'border-[#FFD200]/50 bg-[#FFD200]/15 text-[#8a6d00]',
  approved: 'border-teal/40 bg-teal/10 text-teal-deep',
  published: 'border-teal/40 bg-teal/10 text-teal-deep',
  sold: 'border-[#202f9a]/30 bg-[#202f9a]/10 text-[#202f9a]',
};

export default function MyArtworksPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, fetchUser } = useAuthStore();
  const [items, setItems] = useState<MyArtwork[] | null>(null);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace('/auth/login');
    else if (user?.isNewUser) router.replace('/onboarding');
  }, [isLoading, isAuthenticated, user, router]);

  const load = useCallback(() => {
    api
      .get('/api/artworks/mine')
      .then((res) => setItems(res.data?.data?.items ?? []))
      .catch(() => {
        setItems([]);
        setError('Could not load your artworks. Please refresh.');
      });
  }, []);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  const onDelete = async (id: string, title?: string) => {
    if (
      !window.confirm(
        `Delete “${title || 'this artwork'}”? This can’t be undone.`,
      )
    )
      return;
    // Optimistic remove — restore on failure.
    const prev = items;
    setDeletingId(id);
    setItems((cur) => (cur ? cur.filter((a) => a._id !== id) : cur));
    try {
      await api.delete(`/api/artworks/${id}`);
    } catch {
      setItems(prev ?? null);
      setError('Delete failed. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#faf7f2] px-4 py-10 text-neutral-900">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="text-sm text-[#202f9a] hover:underline"
        >
          ← Back to dashboard
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl">My artworks</h1>
            <p className="mt-2 text-neutral-600">
              Edit details and images, or remove pieces from your portfolio.
            </p>
          </div>
          <Link
            href="/dashboard/upload"
            className="whitespace-nowrap rounded-full bg-[#0b1f52] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#202f9a]"
          >
            + Upload artwork
          </Link>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {items === null ? (
          <p className="mt-10 text-neutral-500">Loading your artworks…</p>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-[#202f9a]/30 bg-white p-10 text-center">
            <h2 className="font-serif text-2xl">No artworks yet</h2>
            <p className="mx-auto mt-2 max-w-md text-neutral-600">
              Upload your first piece to start building your portfolio.
            </p>
            <Link
              href="/dashboard/upload"
              className="mt-5 inline-block rounded-full bg-[#0b1f52] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#202f9a]"
            >
              Upload your first artwork
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((art) => {
              const price = formatPrice(art.cost, art.currency);
              const status = (art.status || 'submitted').toLowerCase();
              return (
                <motion.div
                  key={art._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm"
                >
                  <div className="relative aspect-[4/3] w-full bg-neutral-100">
                    {art.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={art.images[0]}
                        alt={art.title || 'Artwork'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
                        No image
                      </div>
                    )}
                    <span
                      className={`absolute left-2 top-2 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                        STATUS_PILL[status] ||
                        'border-neutral-300 bg-white/90 text-neutral-600'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="line-clamp-1 font-semibold">
                      {art.title || 'Untitled'}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-600">
                      {price || 'Price on request'}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/dashboard/artworks/${art._id}/edit`}
                        className="flex-1 rounded-full border border-[#202f9a] px-3 py-2 text-center text-sm font-semibold text-[#202f9a] transition hover:bg-[#202f9a]/5"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDelete(art._id, art.title)}
                        disabled={deletingId === art._id}
                        className="rounded-full border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingId === art._id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
