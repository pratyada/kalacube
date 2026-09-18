'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';

// GATING: real Razorpay checkout is wrapped behind this build-time flag.
// Leave NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED unset (or anything but "true") in
// Amplify to keep paid buttons in "Launching soon" mode while Razorpay website
// approval + the Netavon plan-registry wiring are still pending.
const SUBSCRIPTIONS_ENABLED =
  process.env.NEXT_PUBLIC_SUBSCRIPTIONS_ENABLED === 'true';

// Shared Netavon endpoint (already live). The frontend only ever sends the
// plan KEY; the plan-ids are mapped server-side. No secrets live client-side —
// key_id is returned by the endpoint.
const CREATE_SUBSCRIPTION_URL =
  'https://2pg6lzqk65.execute-api.ap-south-1.amazonaws.com/create-subscription';

export type PlanKey = 'rising' | 'studio' | 'pro';

type RazorpayOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  image: string;
  theme: { color: string };
  handler: (response: unknown) => void;
  modal?: { ondismiss?: () => void };
  prefill?: { name?: string; email?: string };
};

type RazorpayInstance = { open: () => void };

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

// Inject Razorpay Checkout.js once, lazily (only when the user actually clicks
// Subscribe — never on page load, so the marketing page stays lightweight).
function loadCheckoutScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no window'));
    if (window.Razorpay) return resolve();
    const existing = document.getElementById(
      'razorpay-checkout-js',
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () =>
        reject(new Error('checkout load failed')),
      );
      return;
    }
    const s = document.createElement('script');
    s.id = 'razorpay-checkout-js';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('checkout load failed'));
    document.body.appendChild(s);
  });
}

export default function SubscribeButton({
  plan,
  tierName,
}: {
  plan: PlanKey;
  tierName: string;
}) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // OFF: publicly visible price + a clearly-disabled CTA. Good for SEO/marketing
  // while checkout is pending approval.
  if (!SUBSCRIPTIONS_ENABLED) {
    return (
      <div>
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="w-full cursor-not-allowed rounded-xl border border-navy/15 bg-cream-2 px-5 py-3 text-sm font-semibold text-muted"
        >
          Launching soon
        </button>
        <p className="mt-2 text-center text-xs text-muted">
          Subscriptions open shortly
        </p>
      </div>
    );
  }

  const subscribe = async () => {
    setError('');

    // Subscribing is for logged-in artists — route to login first if needed.
    if (!isAuthenticated) {
      const next = encodeURIComponent('/pricing');
      router.push(`/auth/login?next=${next}`);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(CREATE_SUBSCRIPTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: 'kalacube', plan }),
      });
      if (!res.ok) throw new Error(`endpoint ${res.status}`);
      const data = (await res.json()) as {
        subscription_id?: string;
        key_id?: string;
      };
      if (!data.subscription_id || !data.key_id) {
        throw new Error('missing subscription details');
      }

      await loadCheckoutScript();
      if (!window.Razorpay) throw new Error('checkout unavailable');

      const rzp = new window.Razorpay({
        key: data.key_id,
        subscription_id: data.subscription_id,
        name: 'KalaCUBE',
        description: `${tierName} plan`,
        image: 'https://kalacube.com/brand/logo-primary.png',
        theme: { color: '#0B1F52' },
        prefill: {
          name:
            `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
            user?.username ||
            undefined,
          email: user?.email || undefined,
        },
        handler: () => {
          // Razorpay confirms the subscription; webhook activation happens
          // server-side. Send the artist to their dashboard.
          router.push('/dashboard?subscribed=1');
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });
      rzp.open();
    } catch {
      setError('Could not start checkout. Please try again in a moment.');
      setBusy(false);
    }
  };

  return (
    <div>
      <motion.button
        type="button"
        onClick={subscribe}
        disabled={busy}
        whileTap={{ scale: 0.97 }}
        className="w-full rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? 'Starting checkout…' : `Subscribe to ${tierName}`}
      </motion.button>
      {error && (
        <p role="alert" className="mt-2 text-center text-xs text-magenta-deep">
          {error}
        </p>
      )}
    </div>
  );
}
