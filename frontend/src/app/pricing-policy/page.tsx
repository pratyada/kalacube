import type { Metadata } from 'next';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Pricing Policy',
  description:
    'How pricing works on KalaCUBE — artwork and print prices, artist subscription tiers, taxes (GST), currency, and price changes. All prices in INR.',
  alternates: { canonical: '/pricing-policy' },
  openGraph: {
    title: 'Pricing Policy — KalaCUBE',
    description:
      'How pricing works on KalaCUBE: artwork/print prices, subscription tiers, taxes and currency.',
    url: '/pricing-policy',
    type: 'website',
  },
};

const breadcrumb = breadcrumbJsonLd([
  ['Home', '/'],
  ['Pricing Policy', '/pricing-policy'],
]);

const LAST_UPDATED = '17 September 2026';

export default function PricingPolicyPage() {
  return (
    <main className="min-h-screen bg-[#faf7f2] text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <header className="border-b border-neutral-200 px-6 py-10 text-center sm:py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-[#202f9a]">Legal</p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">Pricing Policy</h1>
        <p className="mt-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <article className="mx-auto max-w-3xl space-y-8 px-4 py-10 text-[15px] leading-relaxed text-neutral-700 sm:px-6">
        <section className="space-y-3">
          <p>
            This Pricing Policy explains how prices are set and displayed on KalaCUBE, operated by{' '}
            <strong>Netavon Pvt Ltd</strong>. All prices are listed in{' '}
            <strong>Indian Rupees (INR, ₹)</strong>. Payments are processed securely through Razorpay.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">1. Artwork and print pricing</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              The price of each original artwork or print is <strong>set by the artist</strong> and shown on
              that item&rsquo;s page before you buy.
            </li>
            <li>
              The price shown on a product page is the price of the item. Any applicable{' '}
              <strong>shipping charges and taxes</strong> are shown to you at checkout, before you confirm
              and pay, so the total payable is clear.
            </li>
            <li>
              Original works are one-of-a-kind; prints are produced on demand. Prices may vary by size,
              medium, material and format.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">2. Artist subscriptions</h2>
          <p>Artists may choose a paid subscription plan:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Rising Artist</strong> — ₹99 per month.
            </li>
            <li>
              <strong>Studio</strong> — ₹299 per month.
            </li>
          </ul>
          <p>
            Subscriptions are billed in INR and <strong>auto-renew</strong> each cycle until cancelled. You
            can cancel anytime; see our{' '}
            <a className="font-medium text-[#202f9a] hover:underline" href="/refund-policy">
              Cancellation &amp; Refund Policy
            </a>
            . A free plan is also available.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">3. Taxes</h2>
          <p>
            Prices are subject to applicable taxes, including <strong>GST</strong>, as required under Indian
            law. Where taxes apply, they are shown at checkout and included in the total amount payable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">4. Currency</h2>
          <p>
            All transactions are processed in <strong>Indian Rupees (INR)</strong>. If your card or bank uses
            a different currency, your issuer may apply conversion charges that are outside our control.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">5. Changes to prices</h2>
          <p>
            We and our artists may update prices from time to time. Any price change{' '}
            <strong>does not affect orders already confirmed and paid</strong>, and subscription price
            changes will not affect your current paid billing cycle. The price applicable to your purchase is
            the one displayed at the time you place the order.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">6. Contact</h2>
          <p>
            For any question about pricing, email{' '}
            <a className="font-medium text-[#202f9a] hover:underline" href="mailto:connect@kalacube.com">
              connect@kalacube.com
            </a>{' '}
            or visit our{' '}
            <a className="font-medium text-[#202f9a] hover:underline" href="/contact">
              Contact page
            </a>
            . KalaCUBE is operated by NETAVON (Netavon Pvt Ltd), Dehradun, India.
          </p>
        </section>
      </article>
    </main>
  );
}
