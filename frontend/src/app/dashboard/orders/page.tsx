'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import {
  formatINR,
  STATUS_LABEL,
  STATUS_PILL,
  type Order,
  type FulfilmentStatus,
} from '@/lib/commerce';

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

export default function OrdersDashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, fetchUser } = useAuthStore();
  const [items, setItems] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      const { data } = await api.get('/api/orders/mine');
      setItems(data?.data?.items || []);
    } catch {
      setError('Could not load your sales. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  if (isLoading || !user) {
    return (
      <main className="flex-1 bg-cream">
        <div className="mx-auto flex min-h-[40vh] max-w-5xl items-center justify-center px-4">
          <p className="text-muted">Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-cream">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/dashboard" className="text-sm text-muted hover:text-indigo">
          ← Dashboard
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-bold text-navy">Sales &amp; orders</h1>
        <p className="mb-6 text-muted">
          Orders for your work, their fulfilment status, and payouts. KalaCUBE
          handles shipping — you just pack and hand over the parcel.
        </p>

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-magenta/10 px-3 py-2 text-sm text-magenta-deep">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-muted">Loading sales…</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-navy/10 bg-white p-10 text-center">
            <p className="text-navy">No sales yet.</p>
            <p className="mt-1 text-sm text-muted">
              When a buyer orders your work, it&apos;ll appear here with live
              tracking and payout status.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((o) => {
              const title = o.items?.map((i) => i.title).join(', ') || 'Order';
              const st = o.fulfilmentStatus as FulfilmentStatus;
              return (
                <li key={o._id} className="rounded-xl border border-navy/10 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-navy">{title}</h3>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_PILL[st] || STATUS_PILL.PENDING}`}>
                          {STATUS_LABEL[st] || st}
                        </span>
                        <span className="rounded-full border border-indigo/20 bg-indigo/5 px-2.5 py-0.5 text-xs font-medium text-indigo">
                          {o.track === 'pod' ? 'Print-on-demand' : 'Original'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {o.buyer?.name}
                        {o.buyer?.email ? <> · {o.buyer.email}</> : null}
                      </p>
                    </div>
                    <span className="text-xs text-muted">{fmtDate(o.createdAt)}</span>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm sm:grid-cols-4">
                    <Cell label="Order total" value={formatINR(o.amount?.total, o.currency)} />
                    <Cell label="Your payout (net)" value={formatINR(o.payout?.net, o.currency)} />
                    <Cell label="Payout status" value={o.payout?.status || 'pending'} />
                    <Cell label="Payment" value={o.paymentStatus} />
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/orders/${o._id}`}
                      className="rounded-lg border border-navy/20 bg-white px-4 py-2 text-sm font-medium text-navy transition hover:border-indigo hover:text-indigo"
                    >
                      View &amp; track
                    </Link>
                    {o.shipment?.labelUrl && (
                      <a
                        href={o.shipment.labelUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-navy/20 bg-white px-4 py-2 text-sm font-medium text-navy transition hover:border-indigo hover:text-indigo"
                      >
                        Prepaid label
                      </a>
                    )}
                    {o.shipment?.trackingUrl && (
                      <a
                        href={o.shipment.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-navy/20 bg-white px-4 py-2 text-sm font-medium text-navy transition hover:border-indigo hover:text-indigo"
                      >
                        Courier tracking
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}

function Cell({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium capitalize text-navy">{value || '—'}</dd>
    </div>
  );
}
