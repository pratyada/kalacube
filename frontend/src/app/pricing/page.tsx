import Link from 'next/link';
import type { Metadata } from 'next';
import { breadcrumbJsonLd } from '@/lib/seo';
import SubscribeButton, { type PlanKey } from './SubscribeButton';

export const metadata: Metadata = {
  title: 'Pricing — KalaCUBE',
  description:
    'Simple artist plans on KalaCUBE — from a free public portfolio to Pro representation. Lower commissions, your own storefront, custom domain and active promotion. 30% off launch offer, billed monthly, cancel anytime.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Artist Plans & Pricing — KalaCUBE',
    description:
      'From a free public portfolio to Pro representation — lower commissions, your own storefront and active promotion. 30% off launch offer.',
    url: '/pricing',
    type: 'website',
  },
};

const breadcrumb = breadcrumbJsonLd([
  ['Home', '/'],
  ['Pricing', '/pricing'],
]);

type Tier = {
  id: string;
  name: string;
  tagline: string;
  plan?: PlanKey; // undefined for the free tier
  price: number | 'free';
  wasPrice?: number;
  highlight?: boolean;
  features: string[];
};

// 30%-OFF LAUNCH OFFER — launch price shown big, original struck through.
const TIERS: Tier[] = [
  {
    id: 'showcase',
    name: 'Showcase',
    tagline: 'Get discovered, for free.',
    price: 'free',
    features: [
      'Public @page + shareable link',
      'Up to 10 artworks',
      'Appear in Explore',
      'Receive buyer enquiries',
      'Sell at 20% commission',
      '“Made on KalaCUBE” badge shown',
    ],
  },
  {
    id: 'rising',
    name: 'Rising Artist',
    tagline: 'Turn your page into a storefront.',
    plan: 'rising',
    price: 199,
    wasPrice: 299,
    highlight: true,
    features: [
      'Unlimited artworks',
      'Sell your storefront (prints + Buy Now)',
      'Commission 20% → 12%',
      'Verified badge',
      'Full analytics',
      'WhatsApp share kit',
      '“Made on KalaCUBE” badge removed',
    ],
  },
  {
    id: 'studio',
    name: 'Studio',
    tagline: 'Serious selling, told beautifully.',
    plan: 'studio',
    price: 599,
    wasPrice: 899,
    features: [
      'Everything in Rising, plus:',
      '0% commission on prints · 8% on originals',
      'AI “Story” on every artwork',
      'Priority discovery + rotational featured placement',
      'Custom domain',
      'Auto-marketing assets',
    ],
  },
  {
    id: 'pro',
    name: 'Pro / Represented',
    tagline: 'We actively sell you.',
    plan: 'pro',
    price: 999,
    wasPrice: 1499,
    features: [
      'Everything in Studio, plus:',
      'Guaranteed monthly spotlight (homepage + buyer newsletter)',
      'We actively promote & pitch you',
      'Buyer CRM + priority leads',
      '0% commission on originals too',
      'Priority support',
      'Early global-selling access',
    ],
  },
];

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

// Structured data so the plans are eligible for rich results / are machine-read.
const offerJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'KalaCUBE Artist Plans',
  description:
    'Artist subscription plans on KalaCUBE — from a free public portfolio to Pro representation.',
  brand: { '@type': 'Brand', name: 'KalaCUBE' },
  offers: TIERS.map((t) => ({
    '@type': 'Offer',
    name: `${t.name} plan`,
    price: t.price === 'free' ? '0' : String(t.price),
    priceCurrency: 'INR',
    availability: 'https://schema.org/InStock',
    url: 'https://kalacube.com/pricing',
  })),
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-cream text-navy-deep">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerJsonLd) }}
      />

      {/* Hero */}
      <header className="border-b border-line px-6 py-14 text-center sm:py-20">
        <span className="inline-flex items-center gap-2 rounded-full bg-yellow px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-navy shadow-sm">
          <span className="text-base leading-none">✦</span>
          30% OFF · Launch offer
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl font-serif text-4xl leading-tight md:text-5xl">
          Plans that grow with your art
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">
          Start free and get discovered. Upgrade to sell your own storefront,
          drop your commission, and have us actively promote your work. Billed
          monthly, cancel anytime.
        </p>
      </header>

      {/* Tiers */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-4">
          {TIERS.map((t) => (
            <div
              key={t.id}
              className={`relative flex flex-col rounded-3xl border bg-white p-6 sm:p-7 ${
                t.highlight
                  ? 'border-indigo shadow-xl ring-1 ring-indigo/20 lg:-translate-y-2'
                  : 'border-line'
              }`}
            >
              {t.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
                  Most popular
                </span>
              )}

              <h2 className="font-serif text-xl text-navy">{t.name}</h2>
              <p className="mt-1 text-sm text-muted">{t.tagline}</p>

              {/* Price */}
              <div className="mt-5 flex items-end gap-2">
                {t.price === 'free' ? (
                  <span className="font-serif text-4xl font-semibold text-navy">
                    Free
                  </span>
                ) : (
                  <>
                    <span className="font-serif text-4xl font-semibold text-navy">
                      {inr(t.price)}
                    </span>
                    <span className="pb-1 text-sm text-muted">/mo</span>
                  </>
                )}
              </div>
              {t.wasPrice ? (
                <p className="mt-1 text-sm text-muted">
                  <span className="line-through">{inr(t.wasPrice)}</span>{' '}
                  <span className="font-semibold text-teal-deep">Save 30%</span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted">
                  {t.price === 'free' ? 'Forever' : 'billed monthly'}
                </p>
              )}

              {/* CTA */}
              <div className="mt-6">
                {t.price === 'free' ? (
                  <Link
                    href="/auth/register"
                    className="block w-full rounded-xl bg-navy px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-navy-deep"
                  >
                    Start free
                  </Link>
                ) : (
                  <SubscribeButton plan={t.plan!} tierName={t.name} />
                )}
              </div>

              {/* Features */}
              <ul className="mt-7 space-y-3 border-t border-line pt-6 text-sm text-navy/80">
                {t.features.map((f) => {
                  const isHeading = f.endsWith('plus:');
                  if (isHeading) {
                    return (
                      <li
                        key={f}
                        className="text-xs font-semibold uppercase tracking-wide text-muted"
                      >
                        {f}
                      </li>
                    );
                  }
                  return (
                    <li key={f} className="flex gap-2.5">
                      <svg
                        className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-deep"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.3 3.29 6.8-6.8a1 1 0 011.4 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{f}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-muted">
          All prices in INR, per month · billed monthly, cancel anytime · GST
          extra where applicable.
        </p>
      </section>

      {/* It pays for itself */}
      <section className="border-t border-line bg-cream-2 px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-indigo">
            It pays for itself
          </p>
          <h2 className="mt-3 font-serif text-3xl md:text-4xl">
            The plan costs less than one sale saves
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted">
            A lower (or 0%) commission means more of every sale stays with you —
            and on Studio and Pro we don&apos;t just host your art, we sell,
            ship and promote it. A single piece sold at a better rate can cover
            months of your plan.
          </p>
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              {
                c: 'text-orange',
                t: 'Lower commission',
                d: 'Keep up to 100% of print sales and more of every original.',
              },
              {
                c: 'text-teal',
                t: 'We do the selling',
                d: 'Storefront, checkout, shipping and marketing assets handled.',
              },
              {
                c: 'text-magenta',
                t: 'We promote you',
                d: 'Featured placement, spotlights and buyer newsletters.',
              },
            ].map((b) => (
              <div
                key={b.t}
                className="rounded-2xl border border-line bg-white p-5 text-left"
              >
                <p className={`text-sm font-bold ${b.c}`}>{b.t}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {b.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-16 text-center">
        <h2 className="font-serif text-2xl text-navy sm:text-3xl">
          Start free today
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">
          Build your portfolio, get discovered, and upgrade whenever you&apos;re
          ready to sell.
        </p>
        <Link
          href="/auth/register"
          className="mt-6 inline-block rounded-full bg-indigo px-7 py-3 text-sm font-semibold text-white transition hover:bg-navy"
        >
          Join as an artist
        </Link>
      </section>
    </main>
  );
}
