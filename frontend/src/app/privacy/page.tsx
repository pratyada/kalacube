import type { Metadata } from 'next';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How KalaCUBE (operated by NETAVON) collects, uses, and protects your personal data — what we store, who we share it with, and your rights.',
  alternates: { canonical: '/privacy' },
  openGraph: {
    title: 'Privacy Policy — KalaCUBE',
    description:
      'How KalaCUBE collects, uses, and protects your personal data, and the rights you have over it.',
    url: '/privacy',
    type: 'website',
  },
};

const breadcrumb = breadcrumbJsonLd([
  ['Home', '/'],
  ['Privacy Policy', '/privacy'],
]);

const LAST_UPDATED = '16 September 2026';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#faf7f2] text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <header className="border-b border-neutral-200 px-6 py-10 text-center sm:py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-[#202f9a]">Legal</p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-neutral-500">Last updated: {LAST_UPDATED}</p>
      </header>

      <article className="mx-auto max-w-3xl space-y-8 px-4 py-10 text-[15px] leading-relaxed text-neutral-700 sm:px-6">
        <section className="space-y-3">
          <p>
            KalaCUBE (&ldquo;KalaCUBE&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is an online platform where
            Indian artists build portfolios, showcase and sell original art and prints, and where
            buyers discover and purchase art. KalaCUBE is a product operated by{' '}
            <strong>Netavon Pvt Ltd</strong>. This Privacy Policy explains
            what personal data we collect, how we use it, who we share it with, and the choices and
            rights you have. By using KalaCUBE you agree to the practices described here.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">1. Information we collect</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Account and profile information</strong> — your name and email address (collected
              when you sign in / register), and any profile details you add such as your artist bio,
              statement, location, links, and profile image.
            </li>
            <li>
              <strong>Artwork and content you upload</strong> — images of your work, titles,
              descriptions, medium, size, pricing, and related details. Please note that artwork
              images and profile details you publish are shown <strong>publicly</strong> on your
              KalaCUBE profile and in the Explore gallery.
            </li>
            <li>
              <strong>Payment information</strong> — subscription and purchase payments are processed by
              our payment gateway, Razorpay. We do <strong>not</strong> collect or store your full card
              number, CVV, or bank credentials. We may retain limited transaction records (such as an
              order/payment reference, amount, status, and date) to operate your account and for
              accounting and legal compliance.
            </li>
            <li>
              <strong>Usage, device, and cookie data</strong> — basic technical information (such as
              browser type, device, pages visited, and interactions) collected through cookies and
              analytics tools to understand and improve how the site is used.
            </li>
            <li>
              <strong>Communications</strong> — messages and information you send us by email or through
              the platform (for example, support or feedback requests).
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">2. How we use your information</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>To create and manage your account and artist profile.</li>
            <li>To publish and display the artwork and profile content you choose to showcase.</li>
            <li>To facilitate discovery and purchases between artists and buyers.</li>
            <li>To process subscriptions and payments (via Razorpay) and send related receipts and notices.</li>
            <li>To provide customer support and respond to your enquiries.</li>
            <li>To operate, secure, maintain, and improve the platform, including analytics.</li>
            <li>To send important service communications, and — where permitted — occasional product updates.</li>
            <li>To comply with legal obligations and enforce our Terms &amp; Conditions.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">3. Third parties and service providers</h2>
          <p>
            We share data with trusted service providers (processors) only as needed to run KalaCUBE.
            These include:
          </p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Amazon Web Services (AWS)</strong> — hosting, storage, and infrastructure
              (including Amplify, Lambda, S3, Cognito for sign-in, and SES for email).
            </li>
            <li>
              <strong>MongoDB Atlas</strong> — our application database.
            </li>
            <li>
              <strong>Razorpay</strong> — payment processing for subscriptions and purchases. Razorpay
              handles your payment details under its own privacy policy.
            </li>
            <li>
              <strong>Google Analytics (GA4)</strong> — usage and traffic analytics to help us improve
              the platform.
            </li>
          </ul>
          <p>
            We do not sell your personal data. We may disclose information where required by law, to
            protect our rights or users, or as part of a business transfer.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">4. Cookies and analytics</h2>
          <p>
            We use cookies and similar technologies to keep you signed in, remember preferences, and
            measure usage. We use Google Analytics (GA4) to understand aggregate traffic and behaviour.
            You can control cookies through your browser settings; disabling some cookies may affect how
            the site works.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">5. Data retention</h2>
          <p>
            We keep personal data for as long as your account is active or as needed to provide the
            service. Transaction and tax-related records are retained for the periods required by
            applicable law. When data is no longer needed, we delete or anonymise it. If you close your
            account, we may retain limited records where legally required.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">6. Your rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal data, and you may
            ask us to stop sending marketing messages. To exercise any of these rights, email us at{' '}
            <a className="font-medium text-[#202f9a] hover:underline" href="mailto:connect@kalacube.com">
              connect@kalacube.com
            </a>
            . You can also edit much of your profile information directly from your account. We will
            respond within a reasonable time and in line with applicable law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">7. Children</h2>
          <p>
            KalaCUBE is not intended for children. You must be at least 18 years old to create an
            account or make a purchase. We do not knowingly collect personal data from children. If you
            believe a child has provided us data, please contact us and we will remove it.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">8. Data security</h2>
          <p>
            We use reasonable technical and organisational measures to protect your data, including
            secure cloud infrastructure and access controls. No method of transmission or storage is
            completely secure, so we cannot guarantee absolute security.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">9. Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will revise the
            &ldquo;Last updated&rdquo; date above. Significant changes may be communicated through the
            platform. Your continued use of KalaCUBE after changes take effect constitutes acceptance.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-2xl text-[#0b1f52]">10. Contact us</h2>
          <p>
            KalaCUBE is operated by NETAVON. For any privacy questions or requests, contact us at{' '}
            <a className="font-medium text-[#202f9a] hover:underline" href="mailto:connect@kalacube.com">
              connect@kalacube.com
            </a>
            . You can also reach our{' '}
            <a className="font-medium text-[#202f9a] hover:underline" href="/contact">
              Contact page
            </a>
            . Location: Dehradun, India.
          </p>
        </section>
      </article>
    </main>
  );
}
