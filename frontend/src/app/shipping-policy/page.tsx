import type { Metadata } from 'next';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description:
    'How KalaCUBE ships original art and prints across India — dispatch and delivery timelines, tracking, packaging and insurance, and undeliverable handling.',
  alternates: { canonical: '/shipping-policy' },
  openGraph: {
    title: 'Shipping Policy — KalaCUBE',
    description:
      'How KalaCUBE ships original art and prints across India — timelines, tracking, packaging, and more.',
    url: '/shipping-policy',
    type: 'website',
  },
};

const breadcrumb = breadcrumbJsonLd([
  ['Home', '/'],
  ['Shipping Policy', '/shipping-policy'],
]);

const LAST_UPDATED = '16 September 2026';

export default function ShippingPolicyPage() {
  return (
    <main className="min-h-screen bg-[#faf7f2] text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <header className="border-b border-neutral-200 px-6 py-10 text-center sm:py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-[#202f9a]">Legal</p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">Shipping Policy</h1>
        <p className="mt-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <article className="mx-auto max-w-3xl space-y-8 px-4 py-10 text-[15px] leading-relaxed text-neutral-700 sm:px-6">
        <section className="space-y-3">
          <p>
            This Shipping Policy explains how artwork and prints purchased on KalaCUBE (operated by{' '}
            <strong>Netavon Pvt Ltd</strong>) are delivered. Timelines below are
            estimates and may vary with the artist&rsquo;s location, the item, and courier conditions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">1. Where we ship</h2>
          <p>
            We currently ship <strong>within India only</strong>. International shipping is{' '}
            <strong>not available yet and is coming soon</strong>. Orders are delivered to the address you
            provide at checkout, so please make sure it is complete and accurate.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">2. How shipping works</h2>
          <p>
            Domestic delivery is handled through trusted third-party courier partners. For original art, the
            courier typically <strong>picks up the piece from the artist</strong> and delivers it to your
            doorstep. Prints are produced and dispatched through our print partner. You do not need to
            arrange collection yourself.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">3. Dispatch and delivery timelines</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Dispatch:</strong> ready-to-ship original artwork is usually dispatched within{' '}
              <strong>2&ndash;5 business days</strong> of order confirmation.
            </li>
            <li>
              <strong>Prints:</strong> produced and dispatched within about <strong>3&ndash;7 business days</strong>.
            </li>
            <li>
              <strong>Delivery:</strong> once dispatched, delivery within India typically takes{' '}
              <strong>3&ndash;10 business days</strong> depending on destination.
            </li>
            <li>
              <strong>Made-to-order or commissioned pieces</strong> take longer; the artist will indicate the
              expected creation time before dispatch.
            </li>
          </ul>
          <p className="text-sm text-neutral-500">
            These ranges are estimates, not guarantees. Remote locations, weather, and courier delays can
            affect delivery.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">4. Tracking</h2>
          <p>
            Once your order is dispatched, we or the courier will share tracking details so you can follow
            your shipment. If you do not receive tracking within a reasonable time, contact us at{' '}
            <a className="font-medium text-[#202f9a] hover:underline" href="mailto:connect@kalacube.com">
              connect@kalacube.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">5. Packaging and handling of original art</h2>
          <p>
            Original artwork is fragile and irreplaceable, so it is packed with care using protective
            materials appropriate to the medium (for example, rigid packaging, corner protection, and
            moisture protection). Where available, valuable pieces may be shipped with transit insurance.
            Please inspect your package on delivery and report any visible damage promptly (see our{' '}
            <a className="font-medium text-[#202f9a] hover:underline" href="/refund-policy">
              Refund &amp; Cancellation Policy
            </a>
            ).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">6. Undelivered and returned shipments</h2>
          <p>
            If a shipment cannot be delivered (for example, an incorrect or incomplete address, or no one is
            available to receive it after repeated attempts), it may be returned to origin (RTO). We will
            contact you to arrange re-delivery; additional shipping charges may apply for re-attempts caused
            by incorrect details or repeated failed deliveries.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">7. Contact</h2>
          <p>
            For any shipping question, email{' '}
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
