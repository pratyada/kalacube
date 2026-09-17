'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import {
  COMMERCE_ENABLED,
  formatINR,
  type Order,
} from '@/lib/commerce';

// Display-only pricing knobs — the SERVER computes the authoritative price.
// Kept in sync with the backend defaults (COMMERCE_SHIPPING_FLAT / GST_RATE).
const SHIPPING_FLAT = 150;
const GST_RATE = 0.12;

function CheckoutInner() {
  const params = useSearchParams();
  const artworkId = params.get('artwork') || '';
  const kind = params.get('kind') === 'print' ? 'print' : 'original';

  const [art, setArt] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound' | 'noid'>(
    artworkId ? 'loading' : 'noid',
  );
  const [form, setForm] = useState({
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    shippingAddress: '',
    shippingPincode: '',
    company: '', // honeypot
  });
  const [phase, setPhase] = useState<'form' | 'placing' | 'placed' | 'error'>(
    'form',
  );
  const [order, setOrder] = useState<Order | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!artworkId) return;
    setStatus('loading');
    api
      .get(`/api/explore/artworks/${artworkId}`)
      .then(({ data }) => {
        setArt(data.data);
        setStatus('ok');
      })
      .catch(() => setStatus('notfound'));
  }, [artworkId]);

  const breakdown = useMemo(() => {
    const artPrice = Number(art?.cost || 0);
    const shipping = SHIPPING_FLAT;
    const gst = Math.round(artPrice * GST_RATE);
    return { art: artPrice, shipping, gst, total: artPrice + shipping + gst };
  }, [art]);

  if (!COMMERCE_ENABLED) {
    return (
      <Shell>
        <div className="rounded-2xl border border-line bg-white p-8 text-center">
          <h1 className="font-serif text-2xl text-navy">Checkout is coming soon</h1>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Online checkout isn&apos;t live yet. To buy or make an offer on a
            piece, use the <strong>Buy / Enquire</strong> button on the artwork —
            you&apos;ll connect directly with the artist.
          </p>
          <Link
            href="/explore"
            className="mt-6 inline-block rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-deep"
          >
            Browse the gallery
          </Link>
        </div>
      </Shell>
    );
  }

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.buyerName.trim()) return setError('Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.buyerEmail.trim()))
      return setError('Please enter a valid email address.');

    setPhase('placing');
    try {
      const { data } = await api.post('/api/orders', {
        items: [{ artworkId, kind, qty: 1 }],
        buyerName: form.buyerName.trim(),
        buyerEmail: form.buyerEmail.trim(),
        buyerPhone: form.buyerPhone.trim() || undefined,
        shippingAddress: form.shippingAddress.trim() || undefined,
        shippingPincode: form.shippingPincode.trim() || undefined,
        company: form.company,
      });
      setOrder(data?.data?.order || null);
      setPhase('placed');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message || 'Could not place the order. Please try again.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
      setPhase('error');
    }
  };

  // Test-mode "confirm": exercises the fulfilment state machine WITHOUT a real
  // charge. Only meaningful while payments are stubbed.
  const confirmTest = async () => {
    if (!order?._id) return;
    setConfirming(true);
    try {
      await api.post(`/api/orders/${order._id}/confirm`, {});
      setConfirmed(true);
    } catch {
      setError('Test confirmation failed.');
    } finally {
      setConfirming(false);
    }
  };

  if (status === 'noid') {
    return (
      <Shell>
        <TestBanner />
        <div className="rounded-2xl border border-line bg-white p-8 text-center">
          <p className="text-navy">No artwork selected.</p>
          <Link href="/explore" className="mt-4 inline-block text-indigo hover:underline">
            Pick a piece from the gallery →
          </Link>
        </div>
      </Shell>
    );
  }
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
  if (status === 'notfound') {
    return (
      <Shell>
        <div className="rounded-2xl border border-line bg-white p-8 text-center text-muted">
          Artwork not found.{' '}
          <Link href="/explore" className="text-indigo hover:underline">
            Back to gallery
          </Link>
        </div>
      </Shell>
    );
  }

  const amount = order?.amount || breakdown;

  return (
    <Shell>
      <TestBanner />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Left: buyer details or confirmation */}
        <div>
          {phase === 'placed' ? (
            <div className="rounded-2xl border border-teal/40 bg-white p-8">
              <h1 className="font-serif text-2xl text-navy">Test order placed</h1>
              <p className="mt-2 text-muted">
                This is a <strong>test-mode</strong> order — no real payment was
                taken. Live payments are coming soon. We&apos;ve recorded the
                order and emailed a confirmation.
              </p>
              <dl className="mt-5 rounded-xl bg-cream p-4 text-sm">
                <div className="flex justify-between py-1">
                  <dt className="text-muted">Order reference</dt>
                  <dd className="font-mono text-navy">{order?._id}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-muted">Total (held, not charged)</dt>
                  <dd className="font-semibold text-navy">
                    {formatINR(amount.total)}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                {!confirmed ? (
                  <button
                    type="button"
                    onClick={confirmTest}
                    disabled={confirming}
                    className="rounded-lg border border-navy/25 bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-indigo hover:text-indigo disabled:opacity-60"
                  >
                    {confirming
                      ? 'Simulating…'
                      : 'Simulate payment (test) → create shipment'}
                  </button>
                ) : (
                  <span className="rounded-lg border border-teal/40 bg-teal/10 px-4 py-2.5 text-sm font-medium text-teal-deep">
                    Shipment created (stub)
                  </span>
                )}
                {order?._id && (
                  <Link
                    href={`/orders/${order._id}`}
                    className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-deep"
                  >
                    Track this order
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={placeOrder} className="rounded-2xl border border-line bg-white p-6 sm:p-8">
              <h1 className="font-serif text-2xl text-navy">Checkout</h1>
              <p className="mt-1 text-sm text-muted">
                All-in price — artwork, shipping and GST included. No surprises.
              </p>

              {/* Honeypot */}
              <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0" style={{ left: '-9999px' }}>
                <label htmlFor="co-company">Company</label>
                <input id="co-company" type="text" tabIndex={-1} autoComplete="off" value={form.company} onChange={set('company')} />
              </div>

              <div className="mt-6 space-y-4">
                <Field label="Your name" required id="co-name" value={form.buyerName} onChange={set('buyerName')} placeholder="Jane Doe" />
                <Field label="Email" required id="co-email" type="email" value={form.buyerEmail} onChange={set('buyerEmail')} placeholder="you@example.com" />
                <Field label="Phone" id="co-phone" type="tel" value={form.buyerPhone} onChange={set('buyerPhone')} placeholder="+91 98765 43210" />
                <div>
                  <label htmlFor="co-address" className="mb-1 block text-sm font-medium text-navy">
                    Shipping address <span className="text-muted">(optional for test)</span>
                  </label>
                  <textarea
                    id="co-address"
                    rows={3}
                    value={form.shippingAddress}
                    onChange={set('shippingAddress')}
                    className="w-full resize-none rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
                    placeholder="Flat, street, city, state"
                  />
                </div>
                <Field label="Pincode" id="co-pin" value={form.shippingPincode} onChange={set('shippingPincode')} placeholder="248001" />
              </div>

              {error && (
                <p role="alert" className="mt-4 rounded-lg bg-magenta/10 px-3 py-2 text-sm text-magenta-deep">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={phase === 'placing'}
                className="mt-6 w-full rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-deep disabled:cursor-not-allowed disabled:opacity-60"
              >
                {phase === 'placing' ? 'Placing order…' : `Place test order · ${formatINR(amount.total)}`}
              </button>
              <p className="mt-3 text-center text-xs text-muted">
                Test mode — no real payment is taken.
              </p>
            </form>
          )}
        </div>

        {/* Right: order summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Order summary
            </h2>
            <div className="mt-4 flex gap-3">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-cream-2">
                {art?.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={art.images[0]} alt={art?.title || 'Artwork'} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-navy">{art?.title || 'Untitled'}</p>
                <p className="text-xs capitalize text-muted">{kind}</p>
              </div>
            </div>

            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              <Row label="Artwork" value={formatINR(amount.art)} />
              <Row label="Shipping" value={formatINR(amount.shipping)} />
              <Row label="GST" value={formatINR(amount.gst)} />
              <div className="flex justify-between border-t border-line pt-2 font-semibold text-navy">
                <dt>Total</dt>
                <dd>{formatINR(amount.total)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </Shell>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<Shell><p className="text-muted">Loading…</p></Shell>}>
      <CheckoutInner />
    </Suspense>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-cream text-navy-deep">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
        <nav className="mb-8 text-sm text-muted">
          <Link href="/explore" className="transition hover:text-indigo">Gallery</Link>
          <span className="mx-2 text-muted/50">/</span>
          <span className="text-navy-deep">Checkout</span>
        </nav>
        {children}
      </div>
    </main>
  );
}

function TestBanner() {
  return (
    <div className="mb-6 rounded-xl border border-yellow/50 bg-yellow/15 px-4 py-3 text-sm text-navy">
      <strong>Test mode.</strong> Online checkout is being tested — live payments
      are coming soon. No real charge is made.
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-navy">
        {label} {required && <span className="text-magenta">*</span>}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
      />
    </div>
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
