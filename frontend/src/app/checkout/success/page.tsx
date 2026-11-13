'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { formatMoney, type Order } from '@/lib/commerce';

/**
 * Stripe Checkout returns here with ?order=<id>&session_id=<cs_…>. We ask the
 * backend to confirm — it re-reads the session from Stripe server-side, so a
 * visitor can't fake a paid order by hitting this URL.
 */
function SuccessInner() {
  const params = useSearchParams();
  const orderId = params.get('order') || '';
  const sessionId = params.get('session_id') || '';
  const [state, setState] = useState<'checking' | 'paid' | 'pending' | 'error'>('checking');
  const [order, setOrder] = useState<Order | null>(null);
  const tried = useRef(0);

  useEffect(() => {
    if (!orderId) {
      setState('error');
      return;
    }
    let cancelled = false;
    const attempt = async () => {
      tried.current += 1;
      try {
        const { data } = await api.post(`/api/orders/${orderId}/confirm`, {
          stripeSessionId: sessionId || undefined,
        });
        if (cancelled) return;
        setOrder(data?.data?.order || null);
        setState('paid');
      } catch {
        if (cancelled) return;
        // Stripe can take a moment to settle — retry a few times.
        if (tried.current < 4) setTimeout(attempt, 2500);
        else setState('pending');
      }
    };
    attempt();
    return () => {
      cancelled = true;
    };
  }, [orderId, sessionId]);

  const isJlps = order?.community === 'jlps';

  return (
    <main className="min-h-screen bg-cream px-6 py-16 text-navy-deep">
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-8 text-center">
        {state === 'checking' && (
          <>
            <p className="text-4xl">⏳</p>
            <h1 className="mt-3 font-serif text-2xl text-navy">Confirming your payment…</h1>
            <p className="mt-2 text-muted">This only takes a moment.</p>
          </>
        )}
        {state === 'paid' && (
          <>
            <p className="text-5xl">{isJlps ? '🎉' : '✅'}</p>
            <h1 className="mt-3 font-serif text-3xl text-navy">Thank you!</h1>
            <p className="mt-2 text-muted">
              {isJlps
                ? 'Your purchase is confirmed and 100% goes to the young maker. We’ll hand-deliver it to you in CityPlace / downtown Toronto and email you when it’s on the way.'
                : 'Your order is confirmed. We’ve emailed the details and will arrange delivery from here.'}
            </p>
            {order && (
              <dl className="mt-6 rounded-xl bg-cream p-4 text-left text-sm">
                <div className="flex justify-between py-1">
                  <dt className="text-muted">Items</dt>
                  <dd className="text-right font-medium text-navy">
                    {order.items?.map((i) => i.title).join(', ')}
                  </dd>
                </div>
                <div className="flex justify-between py-1">
                  <dt className="text-muted">Total paid</dt>
                  <dd className="font-semibold text-navy">
                    {formatMoney(order.amount?.total, order.currency)}
                  </dd>
                </div>
              </dl>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {order?.publicToken && (
                <Link
                  href={`/orders/${order.publicToken}`}
                  className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Track your order
                </Link>
              )}
              <Link
                href={isJlps ? '/jlps' : '/explore'}
                className="rounded-lg border border-navy/25 px-5 py-2.5 text-sm font-semibold text-navy"
              >
                {isJlps ? 'Back to the market' : 'Keep browsing'}
              </Link>
            </div>
          </>
        )}
        {state === 'pending' && (
          <>
            <p className="text-4xl">📬</p>
            <h1 className="mt-3 font-serif text-2xl text-navy">Payment received. Finishing up</h1>
            <p className="mt-2 text-muted">
              We couldn&apos;t confirm it just yet. Don&apos;t worry: if your card was charged,
              your order is safe and we&apos;ll email you shortly. Questions? contact@kalacube.com
            </p>
          </>
        )}
        {state === 'error' && (
          <>
            <h1 className="font-serif text-2xl text-navy">Order not found</h1>
            <Link href="/" className="mt-4 inline-block text-indigo hover:underline">
              Go home
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-cream" />}>
      <SuccessInner />
    </Suspense>
  );
}
