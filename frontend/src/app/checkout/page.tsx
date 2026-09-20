'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import {
  formatINR,
  type Order,
} from '@/lib/commerce';
import { useCartStore } from '@/stores/cartStore';

// Display-only pricing knobs — the SERVER computes the authoritative price.
// Kept in sync with the backend defaults (COMMERCE_SHIPPING_FLAT / GST_RATE).
const SHIPPING_FLAT = 150;
const GST_RATE = 0.12;

// Payment shape returned by POST /api/orders (mirrors backend CreatedPayment).
type CreatedPayment = {
  orderId: string;
  keyId?: string;
  amount: number; // paise
  currency: string;
  stub: boolean;
};

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image: string;
  theme: { color: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
  prefill?: { name?: string; email?: string; contact?: string };
};
type RazorpayInstance = { open: () => void };
type RazorpayCtor = new (options: RazorpayOptions) => RazorpayInstance;

// Read the global injected by Checkout.js without a `declare global` (another
// page already declares Window.Razorpay with a different options shape).
function getRazorpay(): RazorpayCtor | undefined {
  return (globalThis as { Razorpay?: RazorpayCtor }).Razorpay;
}

// Inject Razorpay Checkout.js once, lazily (only when the buyer pays).
function loadCheckoutScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no window'));
    if (getRazorpay()) return resolve();
    const existing = document.getElementById(
      'razorpay-checkout-js',
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('load failed')));
      return;
    }
    const s = document.createElement('script');
    s.id = 'razorpay-checkout-js';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('load failed'));
    document.body.appendChild(s);
  });
}

function CheckoutInner() {
  const params = useSearchParams();
  const artworkId = params.get('artwork') || '';
  const kind = params.get('kind') === 'print' ? 'print' : 'original';
  const isCart = params.get('cart') === '1';
  const cartItems = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);

  const [art, setArt] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'notfound' | 'noid'>(
    isCart ? 'ok' : artworkId ? 'loading' : 'noid',
  );
  const [form, setForm] = useState({
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingState: '',
    shippingPincode: '',
    company: '', // honeypot
  });
  const [phase, setPhase] = useState<'form' | 'placing' | 'placed' | 'error'>(
    'form',
  );
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<CreatedPayment | null>(null);
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

  // Empty the cart once a cart-mode order is confirmed.
  useEffect(() => {
    if (confirmed && isCart) clearCart();
  }, [confirmed, isCart, clearCart]);

  const breakdown = useMemo(() => {
    const artPrice = isCart
      ? cartItems.reduce((s, i) => s + (i.price || 0), 0)
      : Number(art?.cost || 0);
    const shipping = SHIPPING_FLAT;
    const gst = Math.round(artPrice * GST_RATE);
    return { art: artPrice, shipping, gst, total: artPrice + shipping + gst };
  }, [art, isCart, cartItems]);

  // Per-artist gate: online checkout is only open for pilot-seller artists.
  // (Cart items already come only from pilot-seller pages, so skip in cart mode;
  // the backend enforces it regardless.)
  if (!isCart && status === 'ok' && !art?.artist?.pilotSeller) {
    return (
      <Shell>
        <div className="rounded-2xl border border-line bg-white p-8 text-center">
          <h1 className="font-serif text-2xl text-navy">Not available for online checkout</h1>
          <p className="mx-auto mt-3 max-w-md text-muted">
            This piece isn&apos;t set up for online purchase yet. Use the{' '}
            <strong>Buy / Enquire</strong> button on the artwork to connect
            directly with the artist.
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
    if (isCart && cartItems.length === 0) return setError('Your cart is empty.');
    // Originals ship via courier → a full deliverable address is required.
    if (isCart || kind === 'original') {
      if (!form.buyerPhone.trim()) return setError('Please enter a phone number for delivery.');
      if (!form.shippingAddress.trim()) return setError('Please enter your shipping address.');
      if (!form.shippingCity.trim()) return setError('Please enter your city.');
      if (!form.shippingState.trim()) return setError('Please enter your state.');
      if (!/^\d{6}$/.test(form.shippingPincode.trim()))
        return setError('Please enter a valid 6-digit pincode.');
    }

    setPhase('placing');
    try {
      const { data } = await api.post('/api/orders', {
        items: isCart
          ? cartItems.map((i) => ({ artworkId: i.artworkId, kind: i.kind, qty: 1 }))
          : [{ artworkId, kind, qty: 1 }],
        buyerName: form.buyerName.trim(),
        buyerEmail: form.buyerEmail.trim(),
        buyerPhone: form.buyerPhone.trim() || undefined,
        shippingAddress: form.shippingAddress.trim() || undefined,
        shippingCity: form.shippingCity.trim() || undefined,
        shippingState: form.shippingState.trim() || undefined,
        shippingPincode: form.shippingPincode.trim() || undefined,
        company: form.company,
      });
      setOrder(data?.data?.order || null);
      setPayment(data?.data?.payment || null);
      setPhase('placed');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })
          ?.response?.data?.message || 'Could not place the order. Please try again.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
      setPhase('error');
    }
  };

  // Confirm the order. In LIVE mode this opens Razorpay Checkout and confirms
  // with the real payment signature; in STUB mode it just exercises the
  // fulfilment state machine (no charge).
  const trackHref = `/orders/${order?.publicToken || order?._id || ''}`;
  const isLive = !!(payment && !payment.stub && payment.keyId);
  const payNow = async () => {
    if (!order?._id) return;
    setConfirming(true);
    setError('');
    try {
      // STUB mode (no live keys) → confirm directly, no gateway.
      if (!payment || payment.stub || !payment.keyId) {
        await api.post(`/api/orders/${order._id}/confirm`, {});
        setConfirmed(true);
        return;
      }
      // LIVE mode → Razorpay Checkout against the created order.
      await loadCheckoutScript();
      const Razorpay = getRazorpay();
      if (!Razorpay) throw new Error('checkout unavailable');
      const rzp = new Razorpay({
        key: payment.keyId,
        order_id: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        name: 'KalaCUBE',
        description: `${art?.title || 'Artwork'} (${kind})`,
        image: 'https://kalacube.com/brand/logo-primary.png',
        theme: { color: '#0B1F52' },
        prefill: {
          name: form.buyerName.trim() || undefined,
          email: form.buyerEmail.trim() || undefined,
          contact: form.buyerPhone.trim() || undefined,
        },
        handler: async (resp) => {
          try {
            await api.post(`/api/orders/${order._id}/confirm`, {
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            setConfirmed(true);
          } catch {
            setError('Payment succeeded but confirmation failed — we’ll sort it out; please keep your payment id.');
          } finally {
            setConfirming(false);
          }
        },
        modal: { ondismiss: () => setConfirming(false) },
      });
      rzp.open();
      return; // confirming stays true until handler/ondismiss fires
    } catch {
      setError('Could not start payment. Please try again in a moment.');
    } finally {
      // For the stub path we've finished; live path returns early above.
      if (!payment || payment.stub || !payment.keyId) setConfirming(false);
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
              <h1 className="font-serif text-2xl text-navy">
                {confirmed
                  ? 'Order confirmed'
                  : isLive
                    ? 'Almost there — complete payment'
                    : 'Test order placed'}
              </h1>
              <p className="mt-2 text-muted">
                {confirmed ? (
                  <>Thank you — your order is confirmed and we&apos;ve emailed the details. We&apos;ll arrange pickup and delivery from here.</>
                ) : isLive ? (
                  <>Your order is reserved. Pay securely below to confirm it — we&apos;ll then arrange pickup from the artist and delivery to you.</>
                ) : (
                  <>This is a <strong>test-mode</strong> order — no real payment is taken (payment keys not set).</>
                )}
              </p>
              <dl className="mt-5 rounded-xl bg-cream p-4 text-sm">
                <div className="flex justify-between py-1">
                  <dt className="text-muted">Order reference</dt>
                  <dd className="font-mono text-navy">{order?._id}</dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-muted">
                    {confirmed ? 'Total paid' : 'Total'}
                  </dt>
                  <dd className="font-semibold text-navy">
                    {formatINR(amount.total)}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                {!confirmed ? (
                  <button
                    type="button"
                    onClick={payNow}
                    disabled={confirming}
                    className="rounded-lg bg-yellow px-5 py-2.5 text-sm font-semibold text-navy shadow transition hover:bg-yellow-deep disabled:opacity-60"
                  >
                    {confirming
                      ? 'Processing…'
                      : isLive
                        ? `Pay ${formatINR(amount.total)} securely`
                        : 'Simulate payment (test) → create shipment'}
                  </button>
                ) : (
                  <Link
                    href={trackHref}
                    className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-deep"
                  >
                    Track this order
                  </Link>
                )}
                {!confirmed && order?._id && (
                  <Link
                    href={trackHref}
                    className="rounded-lg border border-navy/25 bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-indigo hover:text-indigo"
                  >
                    View order
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
                <Field label="Phone" required={kind === 'original'} id="co-phone" type="tel" value={form.buyerPhone} onChange={set('buyerPhone')} placeholder="+91 98765 43210" />
                <div>
                  <label htmlFor="co-address" className="mb-1 block text-sm font-medium text-navy">
                    Shipping address {kind === 'original' && <span className="text-magenta">*</span>}
                  </label>
                  <textarea
                    id="co-address"
                    rows={2}
                    value={form.shippingAddress}
                    onChange={set('shippingAddress')}
                    className="w-full resize-none rounded-lg border border-navy/15 bg-white px-3 py-2.5 text-sm text-navy outline-none focus:border-indigo focus:ring-2 focus:ring-indigo/20"
                    placeholder="Flat / house no, street, area"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="City" required={kind === 'original'} id="co-city" value={form.shippingCity} onChange={set('shippingCity')} placeholder="Dehradun" />
                  <Field label="State" required={kind === 'original'} id="co-state" value={form.shippingState} onChange={set('shippingState')} placeholder="Uttarakhand" />
                </div>
                <Field label="Pincode" required={kind === 'original'} id="co-pin" value={form.shippingPincode} onChange={set('shippingPincode')} placeholder="248001" />
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
                {phase === 'placing' ? 'Reserving…' : `Continue to payment · ${formatINR(amount.total)}`}
              </button>
              <p className="mt-3 text-center text-xs text-muted">
                Secure payment on the next step. Cancel anytime before paying.
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
            {isCart ? (
              <div className="mt-4 space-y-3">
                {cartItems.map((i) => (
                  <div key={i.artworkId} className="flex items-center gap-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-cream-2">
                      {i.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={i.image} alt={i.title} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-navy">{i.title}</p>
                      <p className="text-xs text-muted">{formatINR(i.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
            )}

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
      <strong>Pilot.</strong> Buying an original — we arrange pickup from the
      artist and delivery to your door. Secure payment via Razorpay.
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
