'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';

type EnquiryStatus = 'new' | 'read' | 'closed';

interface Enquiry {
  _id: string;
  artworkTitle?: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  message: string;
  intent: 'enquiry' | 'buy';
  status: EnquiryStatus;
  createdAt: string;
}

interface Counts {
  new: number;
  read: number;
  closed: number;
  total: number;
}

const STATUS_PILL: Record<EnquiryStatus, string> = {
  new: 'border-orange/40 bg-orange/10 text-orange-deep',
  read: 'border-indigo/30 bg-indigo/10 text-indigo',
  closed: 'border-navy/20 bg-navy/5 text-navy/60',
};

const INTENT_PILL: Record<string, string> = {
  buy: 'border-magenta/40 bg-magenta/10 text-magenta-deep',
  enquiry: 'border-teal/40 bg-teal/10 text-teal-deep',
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function EnquiriesPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, fetchUser } = useAuthStore();
  const [items, setItems] = useState<Enquiry[]>([]);
  const [counts, setCounts] = useState<Counts>({ new: 0, read: 0, closed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [filter, setFilter] = useState<'all' | EnquiryStatus>('all');

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.replace('/auth/login');
    else if (user?.isNewUser) router.replace('/onboarding');
  }, [isLoading, isAuthenticated, user, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/enquiries/mine');
      setItems(data?.data?.items || []);
      setCounts(data?.data?.counts || { new: 0, read: 0, closed: 0, total: 0 });
    } catch {
      setError('Could not load your enquiries. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  const updateStatus = async (id: string, status: EnquiryStatus) => {
    setBusyId(id);
    // Optimistic update.
    const prev = items;
    setItems((list) => list.map((e) => (e._id === id ? { ...e, status } : e)));
    try {
      await api.patch(`/api/enquiries/${id}`, { status });
      await load();
    } catch {
      setItems(prev);
      setError('Could not update that enquiry.');
    } finally {
      setBusyId('');
    }
  };

  if (isLoading || !user) {
    return (
      <main className="flex-1 bg-cream">
        <div className="mx-auto flex min-h-[40vh] max-w-5xl items-center justify-center px-4">
          <p className="text-muted">Loading…</p>
        </div>
      </main>
    );
  }

  const visible = filter === 'all' ? items : items.filter((e) => e.status === filter);

  const tabs: { key: 'all' | EnquiryStatus; label: string; n: number }[] = [
    { key: 'all', label: 'All', n: counts.total },
    { key: 'new', label: 'New', n: counts.new },
    { key: 'read', label: 'Read', n: counts.read },
    { key: 'closed', label: 'Closed', n: counts.closed },
  ];

  return (
    <main className="flex-1 bg-cream">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/dashboard" className="text-sm text-muted hover:text-indigo">
          ← Dashboard
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-bold text-navy">Enquiries</h1>
        <p className="mb-6 text-muted">Buyers and collectors who reached out about your work.</p>

        {/* Status filter tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                filter === t.key
                  ? 'border-navy bg-navy text-white'
                  : 'border-navy/15 bg-white text-navy/70 hover:border-navy/40'
              }`}
            >
              {t.label} <span className="opacity-70">({t.n})</span>
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-magenta/10 px-3 py-2 text-sm text-magenta-deep">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-muted">Loading enquiries…</p>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-navy/10 bg-white p-10 text-center">
            <p className="text-navy">No enquiries {filter !== 'all' ? `marked "${filter}"` : 'yet'}.</p>
            <p className="mt-1 text-sm text-muted">
              When someone enquires or makes an offer on your artwork, it&apos;ll appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {visible.map((e) => (
              <li
                key={e._id}
                className={`rounded-xl border bg-white p-5 transition ${
                  e.status === 'new' ? 'border-orange/40' : 'border-navy/10'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-navy">{e.buyerName}</h3>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${INTENT_PILL[e.intent] || INTENT_PILL.enquiry}`}>
                        {e.intent === 'buy' ? 'Buy / offer' : 'Enquiry'}
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_PILL[e.status]}`}>
                        {e.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      <a href={`mailto:${e.buyerEmail}`} className="hover:text-indigo">
                        {e.buyerEmail}
                      </a>
                      {e.buyerPhone ? <> · {e.buyerPhone}</> : null}
                    </p>
                  </div>
                  <span className="text-xs text-muted">{fmtDate(e.createdAt)}</span>
                </div>

                {e.artworkTitle && (
                  <p className="mt-3 text-sm text-navy/70">
                    <span className="text-muted">Artwork:</span> {e.artworkTitle}
                  </p>
                )}

                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-navy/90">{e.message}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <a
                    href={`mailto:${e.buyerEmail}?subject=${encodeURIComponent('Re: your enquiry on KalaCUBE')}`}
                    className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-deep"
                  >
                    Reply by email
                  </a>
                  {e.status !== 'read' && e.status !== 'closed' && (
                    <button
                      type="button"
                      disabled={busyId === e._id}
                      onClick={() => updateStatus(e._id, 'read')}
                      className="rounded-lg border border-navy/20 bg-white px-4 py-2 text-sm font-medium text-navy transition hover:border-indigo hover:text-indigo disabled:opacity-50"
                    >
                      Mark as read
                    </button>
                  )}
                  {e.status !== 'closed' && (
                    <button
                      type="button"
                      disabled={busyId === e._id}
                      onClick={() => updateStatus(e._id, 'closed')}
                      className="rounded-lg border border-navy/20 bg-white px-4 py-2 text-sm font-medium text-navy/70 transition hover:border-navy hover:text-navy disabled:opacity-50"
                    >
                      Close
                    </button>
                  )}
                  {e.status === 'closed' && (
                    <button
                      type="button"
                      disabled={busyId === e._id}
                      onClick={() => updateStatus(e._id, 'new')}
                      className="rounded-lg border border-navy/20 bg-white px-4 py-2 text-sm font-medium text-navy/70 transition hover:border-navy hover:text-navy disabled:opacity-50"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
