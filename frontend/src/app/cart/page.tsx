'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { formatINR } from '@/lib/commerce';
import { useCartStore, cartIsSingleArtist } from '@/stores/cartStore';

// Display-only shipping estimate (server computes the authoritative total).
const SHIPPING_FLAT = 150;
const GST_RATE = 0.12;

export default function CartPage() {
  // Avoid hydration mismatch: cart comes from localStorage (client-only).
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const items = useCartStore((s) => s.items);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);

  const art = items.reduce((s, i) => s + (i.price || 0), 0);
  const gst = Math.round(art * GST_RATE);
  const shipping = items.length ? SHIPPING_FLAT : 0;
  const total = art + gst + shipping;
  const singleArtist = cartIsSingleArtist(items);

  return (
    <main className="min-h-screen bg-cream text-navy-deep">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
        <nav className="mb-8 text-sm text-muted">
          <Link href="/explore" className="transition hover:text-indigo">Gallery</Link>
          <span className="mx-2 text-muted/50">/</span>
          <span className="text-navy-deep">Cart</span>
        </nav>

        <h1 className="font-serif text-3xl text-navy">Your cart</h1>

        {!ready ? null : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-line bg-white p-10 text-center">
            <p className="text-navy">Your cart is empty.</p>
            <Link
              href="/explore"
              className="mt-5 inline-block rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-deep"
            >
              Browse the gallery
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            {/* Items */}
            <div className="space-y-4">
              {items.map((i) => (
                <div
                  key={i.artworkId}
                  className="flex gap-4 rounded-2xl border border-line bg-white p-4"
                >
                  <Link
                    href={`/art-work/${i.artworkId}`}
                    className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-cream-2"
                  >
                    {i.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.image} alt={i.title} className="h-full w-full object-cover" />
                    ) : null}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/art-work/${i.artworkId}`}
                      className="font-medium text-navy hover:text-indigo"
                    >
                      {i.title}
                    </Link>
                    <p className="text-xs capitalize text-muted">
                      {i.kind} · by @{i.artistUsername}
                    </p>
                    <p className="mt-1 font-medium text-navy-deep">{formatINR(i.price)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(i.artworkId)}
                    className="self-start rounded-lg border border-navy/15 px-3 py-1.5 text-xs font-medium text-muted transition hover:border-magenta/40 hover:text-magenta-deep"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={clear}
                className="text-xs text-muted underline-offset-2 hover:text-magenta-deep hover:underline"
              >
                Clear cart
              </button>
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-line bg-white p-6">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  Summary
                </h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <Row label={`Artworks (${items.length})`} value={formatINR(art)} />
                  <Row label="Shipping" value={formatINR(shipping)} />
                  <Row label="GST" value={formatINR(gst)} />
                  <div className="flex justify-between border-t border-line pt-2 font-semibold text-navy">
                    <dt>Total</dt>
                    <dd>{formatINR(total)}</dd>
                  </div>
                </dl>

                {!singleArtist && (
                  <p className="mt-4 rounded-lg bg-yellow/15 px-3 py-2 text-xs text-navy">
                    Your cart has work from more than one artist. For pickup &amp;
                    delivery, please check out one artist at a time — remove items
                    so only one artist remains.
                  </p>
                )}

                {singleArtist ? (
                  <Link
                    href="/checkout?cart=1"
                    className="mt-5 block w-full rounded-lg bg-navy px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-navy-deep"
                  >
                    Proceed to checkout
                  </Link>
                ) : (
                  <button
                    disabled
                    className="mt-5 block w-full cursor-not-allowed rounded-lg bg-navy/40 px-5 py-3 text-center text-sm font-semibold text-white"
                  >
                    One artist per checkout
                  </button>
                )}
                <p className="mt-3 text-center text-xs text-muted">
                  Secure payment · doorstep pickup · delivered to you
                </p>
              </div>
            </aside>
          </div>
        )}
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
