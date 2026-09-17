'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import {
  formatINR,
  HAPPY_PATH,
  STATUS_LABEL,
  STATUS_PILL,
  type Order,
  type FulfilmentStatus,
} from '@/lib/commerce';

function fmtDateTime(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound'>('loading');

  useEffect(() => {
    if (!id) return;
    setStatus('loading');
    api
      .get(`/api/orders/${id}`)
      .then(({ data }) => {
        setOrder(data.data);
        setStatus('ok');
      })
      .catch(() => setStatus('notfound'));
  }, [id]);

  if (status === 'loading') {
    return (
      <Shell>
        <div className="animate-pulse rounded-2xl border border-line bg-white p-8">
          <div className="h-6 w-48 rounded bg-line" />
          <div className="mt-4 h-4 w-full rounded bg-line" />
        </div>
      </Shell>
    );
  }
  if (status === 'notfound' || !order) {
    return (
      <Shell>
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-muted">
          Order not found.{' '}
          <Link href="/explore" className="text-indigo hover:underline">
            Back to gallery
          </Link>
        </div>
      </Shell>
    );
  }

  const current = order.fulfilmentStatus as FulfilmentStatus;
  const currentIdx = HAPPY_PATH.indexOf(current);
  const isBranch = currentIdx === -1 && current !== 'PENDING';
  const title = order.items?.map((i) => i.title).join(', ') || 'Order';
  const events = [...(order.shipment?.events || [])].reverse();

  return (
    <Shell>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-serif text-2xl text-navy">{title}</h1>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_PILL[current] || STATUS_PILL.PENDING}`}>
                {STATUS_LABEL[current] || current}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              Reference <span className="font-mono">{order._id}</span>
            </p>

            {/* Happy-path timeline */}
            <ol className="mt-8 space-y-0">
              {HAPPY_PATH.map((step, i) => {
                const done = currentIdx >= 0 && i <= currentIdx;
                const active = i === currentIdx;
                return (
                  <li key={step} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-xs ${
                          done
                            ? 'border-teal bg-teal text-white'
                            : 'border-line bg-white text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                      {i < HAPPY_PATH.length - 1 && (
                        <span className={`my-1 h-8 w-px ${done ? 'bg-teal/50' : 'bg-line'}`} />
                      )}
                    </div>
                    <div className="pb-2">
                      <p className={`text-sm ${active ? 'font-semibold text-navy' : done ? 'text-navy/80' : 'text-muted'}`}>
                        {STATUS_LABEL[step]}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            {isBranch && (
              <p className="mt-4 rounded-lg border border-magenta/30 bg-magenta/10 px-3 py-2 text-sm text-magenta-deep">
                This order is currently: {STATUS_LABEL[current] || current}.
              </p>
            )}

            {order.shipment?.trackingUrl && (
              <a
                href={order.shipment.trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-block rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-deep"
              >
                Live courier tracking
              </a>
            )}
          </div>

          {/* Event log */}
          {events.length > 0 && (
            <div className="mt-6 rounded-2xl border border-line bg-white p-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                Activity
              </h2>
              <ul className="mt-4 space-y-3">
                {events.map((ev, i) => (
                  <li key={i} className="flex justify-between gap-4 text-sm">
                    <span className="text-navy">
                      {STATUS_LABEL[ev.status as FulfilmentStatus] || ev.status}
                      {ev.note ? <span className="text-muted"> — {ev.note}</span> : null}
                    </span>
                    <span className="flex-shrink-0 text-xs text-muted">{fmtDateTime(ev.at)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Order summary
            </h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Artwork" value={formatINR(order.amount?.art, order.currency)} />
              <Row label="Shipping" value={formatINR(order.amount?.shipping, order.currency)} />
              <Row label="GST" value={formatINR(order.amount?.gst, order.currency)} />
              <div className="flex justify-between border-t border-line pt-2 font-semibold text-navy">
                <dt>Total</dt>
                <dd>{formatINR(order.amount?.total, order.currency)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-muted">
              Payment: {order.paymentStatus} · Track:{' '}
              {order.track === 'pod' ? 'Print-on-demand' : 'Original'}
            </p>
          </div>
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-cream text-navy-deep">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
        <nav className="mb-8 text-sm text-muted">
          <Link href="/explore" className="transition hover:text-indigo">Gallery</Link>
          <span className="mx-2 text-muted/50">/</span>
          <span className="text-navy-deep">Order</span>
        </nav>
        {children}
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-navy/80">
      <dt className="text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
