import type { Metadata } from 'next';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description:
    'KalaCUBE refund and cancellation terms for subscriptions and artwork/print purchases — how to cancel, eligibility, refund method, and timelines.',
  alternates: { canonical: '/refund-policy' },
  openGraph: {
    title: 'Refund & Cancellation Policy — KalaCUBE',
    description:
      'Refund and cancellation terms for KalaCUBE subscriptions and artwork/print purchases.',
    url: '/refund-policy',
    type: 'website',
  },
};

const breadcrumb = breadcrumbJsonLd([
  ['Home', '/'],
  ['Refund & Cancellation Policy', '/refund-policy'],
]);

const LAST_UPDATED = '16 September 2026';

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-[#faf7f2] text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <header className="border-b border-neutral-200 px-6 py-10 text-center sm:py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-[#202f9a]">Legal</p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">Refund &amp; Cancellation Policy</h1>
        <p className="mt-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <article className="mx-auto max-w-3xl space-y-8 px-4 py-10 text-[15px] leading-relaxed text-neutral-700 sm:px-6">
        <section className="space-y-3">
          <p>
            This policy explains cancellations and refunds for KalaCUBE, operated by{' '}
            <strong>NETAVON</strong> [NETAVON — REGISTERED LEGAL NAME]. It covers two things: paid{' '}
            <strong>subscriptions</strong>, and purchases of <strong>artwork and prints</strong> made
            through the platform. Payments and refunds are processed through Razorpay.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">1. Subscriptions</h2>
          <p>
            Artist subscriptions (Rising Artist ₹99/month and Studio ₹299/month) are billed monthly and
            auto-renew until cancelled.
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              You can <strong>cancel anytime</strong> from your account settings or by emailing{' '}
              <a className="font-medium text-[#202f9a] hover:underline" href="mailto:connect@kalacube.com">
                connect@kalacube.com
              </a>
              .
            </li>
            <li>
              When you cancel, your subscription benefits <strong>continue until the end of the current
              paid billing cycle</strong>, and you will not be charged again after that.
            </li>
            <li>
              We do <strong>not</strong> provide pro-rata refunds for the unused part of a billing cycle. A
              partial month is <strong>non-refundable</strong>.
            </li>
            <li>
              If you are charged in error or experience a duplicate/incorrect charge, contact us and we will
              investigate and, where appropriate, refund it.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">2. Artwork and print purchases</h2>
          <p>
            Because each piece is created by an individual artist, please review listings carefully before
            buying. Refunds/returns are available in the following cases:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Damaged in transit or not as described:</strong> you may raise a refund/return request
              within <strong>7 days of delivery</strong>. Please share photos of the item and packaging.
            </li>
            <li>
              <strong>Original artwork</strong> must be returned unused and in its original condition and
              packaging. Because originals are one-of-a-kind, refunds are considered on a case-by-case basis
              for genuine damage or material misdescription.
            </li>
            <li>
              <strong>Prints</strong> that arrive damaged or defective will be replaced or refunded.
            </li>
            <li>
              <strong>Made-to-order or commissioned pieces are non-refundable once work has started</strong>,
              except where the item arrives damaged or materially not as agreed.
            </li>
          </ul>
          <p>
            Change-of-mind returns for original, handmade, or personalised pieces may not be accepted; where
            offered, return shipping may be at the buyer&rsquo;s cost.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">3. How to raise a request</h2>
          <p>
            Email{' '}
            <a className="font-medium text-[#202f9a] hover:underline" href="mailto:connect@kalacube.com">
              connect@kalacube.com
            </a>{' '}
            with your order reference, a description of the issue, and supporting photos (for damage or
            not-as-described claims). We will acknowledge your request and guide you through the next steps,
            coordinating with the artist where needed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">4. Refund method and timeline</h2>
          <p>
            Approved refunds are issued to your <strong>original payment method</strong> via Razorpay.
            Once approved, refunds are typically processed within <strong>5&ndash;7 business days</strong>;
            the time for the amount to reflect in your account depends on your bank or card issuer.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">5. Contact</h2>
          <p>
            For any question about cancellations or refunds, email{' '}
            <a className="font-medium text-[#202f9a] hover:underline" href="mailto:connect@kalacube.com">
              connect@kalacube.com
            </a>{' '}
            or visit our{' '}
            <a className="font-medium text-[#202f9a] hover:underline" href="/contact">
              Contact page
            </a>
            . KalaCUBE is operated by NETAVON, Dehradun, India.
          </p>
        </section>
      </article>
    </main>
  );
}
