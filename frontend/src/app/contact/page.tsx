import type { Metadata } from 'next';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with KalaCUBE (operated by NETAVON) — email us for support, feedback, or any question. Based in Dehradun, India.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact Us — KalaCUBE',
    description:
      'Get in touch with KalaCUBE for support, feedback, or any question. Based in Dehradun, India.',
    url: '/contact',
    type: 'website',
  },
};

const breadcrumb = breadcrumbJsonLd([
  ['Home', '/'],
  ['Contact Us', '/contact'],
]);

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#faf7f2] text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <header className="border-b border-neutral-200 px-6 py-10 text-center sm:py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-[#202f9a]">Company</p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">Contact Us</h1>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-neutral-600">
          We would love to hear from you — whether you are an artist, a buyer, or just curious about
          KalaCUBE.
        </p>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="font-serif text-xl text-[#0b1f52]">General &amp; support</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Questions about your account, orders, subscriptions, or anything else.
            </p>
            <a
              className="mt-4 inline-block font-medium text-[#202f9a] hover:underline"
              href="mailto:connect@kalacube.com"
            >
              connect@kalacube.com
            </a>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6">
            <h2 className="font-serif text-xl text-[#0b1f52]">Feedback &amp; suggestions</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Ideas to make KalaCUBE better? We are always listening.
            </p>
            <a
              className="mt-4 inline-block font-medium text-[#202f9a] hover:underline"
              href="mailto:kalacube4u@gmail.com"
            >
              kalacube4u@gmail.com
            </a>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="font-serif text-xl text-[#0b1f52]">Reach us</h2>
          <dl className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-600">
            <div>
              <dt className="font-semibold text-neutral-800">Location</dt>
              <dd>Dehradun, Uttarakhand, India</dd>
            </div>
            <div>
              <dt className="font-semibold text-neutral-800">Registered address</dt>
              <dd>Netavon Pvt Ltd, Dehradun, Uttarakhand, India</dd>
            </div>
            <div>
              <dt className="font-semibold text-neutral-800">Response time</dt>
              <dd>We aim to reply to emails within 2&ndash;3 business days.</dd>
            </div>
          </dl>
        </div>

        <p className="mt-6 text-center text-sm text-neutral-500">
          KalaCUBE is a product operated by Netavon Pvt Ltd. Payments are
          processed by Razorpay and settle to NETAVON.
        </p>
      </section>
    </main>
  );
}
