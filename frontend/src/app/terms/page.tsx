import type { Metadata } from 'next';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'The terms governing your use of KalaCUBE (operated by NETAVON) — accounts, subscriptions, artist content and IP, the marketplace, fees, and liability.',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'Terms & Conditions — KalaCUBE',
    description:
      'The terms governing your use of KalaCUBE — accounts, subscriptions, artist content, the marketplace, fees, and liability.',
    url: '/terms',
    type: 'website',
  },
};

const breadcrumb = breadcrumbJsonLd([
  ['Home', '/'],
  ['Terms & Conditions', '/terms'],
]);

const LAST_UPDATED = '16 September 2026';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#faf7f2] text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <header className="border-b border-neutral-200 px-6 py-10 text-center sm:py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-[#202f9a]">Legal</p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">Terms &amp; Conditions</h1>
        <p className="mt-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <article className="mx-auto max-w-3xl space-y-8 px-4 py-10 text-[15px] leading-relaxed text-neutral-700 sm:px-6">
        <section className="space-y-3">
          <p>
            These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use of KalaCUBE,
            an online platform where Indian artists build portfolios, showcase and sell original art and
            prints, and where buyers discover and purchase art. KalaCUBE is a product operated by{' '}
            <strong>NETAVON</strong> [NETAVON — REGISTERED LEGAL NAME] (&ldquo;KalaCUBE&rdquo;,
            &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). Please read them carefully.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">1. Acceptance of terms</h2>
          <p>
            By creating an account, browsing, subscribing, or otherwise using KalaCUBE, you agree to be
            bound by these Terms and our{' '}
            <a className="font-medium text-[#202f9a] hover:underline" href="/privacy">
              Privacy Policy
            </a>
            . If you do not agree, please do not use the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">2. Eligibility</h2>
          <p>
            You must be at least 18 years old and capable of forming a legally binding contract to use
            KalaCUBE. By using the platform you represent that you meet these requirements and that the
            information you provide is accurate.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">3. Accounts and account types</h2>
          <p>
            You can browse KalaCUBE as a guest, and you can register for an account to buy or to publish
            your work as an artist. You are responsible for keeping your login credentials secure and for
            all activity under your account. Notify us promptly of any unauthorised use. We may suspend or
            terminate accounts that violate these Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">4. Subscriptions</h2>
          <p>
            Artists may take an optional paid subscription to unlock additional features:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Rising Artist</strong> — ₹99 per month.
            </li>
            <li>
              <strong>Studio</strong> — ₹299 per month.
            </li>
          </ul>
          <p>
            Subscriptions are billed monthly through Razorpay and <strong>auto-renew</strong> each month
            until cancelled. You can <strong>cancel anytime</strong> from your account or by contacting us;
            your subscription benefits continue until the end of the current paid billing cycle. We do{' '}
            <strong>not</strong> store your card details — payment credentials are handled by Razorpay.
            Refund terms for subscriptions are set out in our{' '}
            <a className="font-medium text-[#202f9a] hover:underline" href="/refund-policy">
              Refund &amp; Cancellation Policy
            </a>
            . We may change subscription prices or features on prospective notice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">5. Artist content and intellectual property</h2>
          <p>
            Artists <strong>retain ownership</strong> of the artwork and content they upload. By publishing
            content on KalaCUBE, you grant us a non-exclusive, worldwide, royalty-free licence to host,
            display, reproduce, and promote that content for the purpose of operating and marketing the
            platform (for example, in the gallery, in search, and in promotional features). You warrant
            that your work is <strong>original</strong>, that you own or control all necessary rights, and
            that it does not infringe any third party&rsquo;s rights or any law. You are responsible for the
            content you publish, and we may remove content that violates these Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">6. Marketplace role</h2>
          <p>
            KalaCUBE is a platform that <strong>facilitates</strong> the showcasing and sale of art between
            artists (sellers) and buyers. Unless expressly stated otherwise, the contract of sale for any
            artwork or print is between the artist and the buyer. We are not the manufacturer or creator of
            the works listed and do not guarantee the quality, authenticity, or fitness of any item beyond
            what is required by applicable law. Artists are responsible for accurate listings and for
            fulfilling orders.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">7. Fees and commission</h2>
          <p>
            Creating a profile and browsing are free. Paid subscriptions are charged as described above.
            We may charge a commission or service fee on sales made through the platform; applicable fees
            will be disclosed to artists before they apply. Payment processing fees may be charged by
            Razorpay. All fees are exclusive of taxes unless stated, and applicable taxes (such as GST) may
            be added where required.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">8. Prohibited conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>Upload work that is not your own or that infringes others&rsquo; rights.</li>
            <li>Post unlawful, misleading, obscene, hateful, or harmful content.</li>
            <li>Misrepresent yourself, your work, or your affiliation.</li>
            <li>Attempt to disrupt, hack, scrape, or overload the platform or its security.</li>
            <li>Use the platform for fraud, money laundering, or any illegal purpose.</li>
            <li>Circumvent fees or transact in a way that breaches these Terms.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">9. Disclaimers</h2>
          <p>
            KalaCUBE is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the
            fullest extent permitted by law, we disclaim all warranties, express or implied, including
            merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that
            the platform will be uninterrupted, error-free, or secure.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">10. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, KalaCUBE and NETAVON will not be liable for any
            indirect, incidental, special, consequential, or punitive damages, or any loss of profits,
            data, or goodwill, arising from your use of the platform. Our total aggregate liability for any
            claim relating to the platform will not exceed the amount you paid to us in the three months
            preceding the event giving rise to the claim.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">11. Termination</h2>
          <p>
            You may stop using KalaCUBE at any time and may close your account. We may suspend or terminate
            your access if you breach these Terms or if we are required to by law. On termination, licences
            granted to us for content already used in promotional materials may survive to the extent
            necessary; other provisions that by their nature should survive will continue to apply.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">12. Governing law and jurisdiction</h2>
          <p>
            These Terms are governed by the laws of India. The courts at Dehradun, Uttarakhand shall have
            exclusive jurisdiction over any dispute arising out of or relating to these Terms or your use of
            KalaCUBE.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">13. Contact</h2>
          <p>
            For any questions about these Terms, email us at{' '}
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
