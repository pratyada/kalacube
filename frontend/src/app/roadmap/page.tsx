import Link from 'next/link';
import type { Metadata } from 'next';
import { breadcrumbJsonLd } from '@/lib/seo';
import { Reveal, Workflow } from '@/components/roadmap/RoadmapMotion';

export const metadata: Metadata = {
  title: 'The Plan — KalaCUBE Roadmap',
  description:
    'You make it, we’ll get it there. See how KalaCUBE is building end-to-end fulfilment for India’s artists — from a buyer’s order to doorstep pickup, tracked delivery, and the artist getting paid.',
  alternates: { canonical: '/roadmap' },
  openGraph: {
    title: 'The Plan — KalaCUBE Roadmap',
    description:
      'You make it, we’ll get it there. How KalaCUBE handles fulfilment so artists can just create — order to pickup to delivery, and the phases ahead.',
    url: '/roadmap',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Plan — KalaCUBE Roadmap',
    description: 'You make it, we’ll get it there — KalaCUBE’s fulfilment vision.',
  },
};

const breadcrumb = breadcrumbJsonLd([
  ['Home', '/'],
  ['Roadmap', '/roadmap'],
]);

const PHASES = [
  {
    tag: 'Now',
    color: '#ff8a00',
    title: 'Pickup → delivery pilot, across India',
    body:
      'We’re piloting end-to-end fulfilment: a buyer orders, we arrange the courier, it’s picked up from your door, tracked in transit, and delivered — then you’re paid. We’re inviting artists to test it with us.',
  },
  {
    tag: 'Next',
    color: '#00a896',
    title: 'Nationwide, more categories, prints & merch',
    body:
      'Rolling the pipeline out nationwide, opening it to more art forms, and adding prints and merch so your work can reach buyers in more ways — with the shipping handled for you.',
  },
  {
    tag: 'Global',
    color: '#d81b60',
    title: 'Order from anywhere in the world',
    body:
      'Doorstep pickup in India, cross-border delivery to a buyer anywhere — so collectors worldwide can own original work by Indian artists. Making India a hub for the world’s creators.',
  },
];

export default function RoadmapPage() {
  return (
    <main className="bg-cream text-navy-deep">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(60rem 30rem at 15% -10%, rgba(32,47,154,0.12), transparent 60%), radial-gradient(50rem 28rem at 95% 0%, rgba(216,27,96,0.10), transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.35em] text-indigo">
              The Plan
            </p>
          </Reveal>
          <Reveal delay={1}>
            <h1 className="mt-6 font-serif text-4xl leading-[1.08] sm:text-5xl md:text-6xl">
              You make it,{' '}
              <span className="italic text-indigo">we’ll get it there.</span>
            </h1>
          </Reveal>
          <Reveal delay={2}>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-muted">
              KalaCUBE has always been a home for India’s artists to showcase
              their work. Now we’re building the part that comes after the sale —
              getting a piece safely from the artist’s hands to the buyer’s door.
              You create; we handle the journey.
            </p>
          </Reveal>
          <Reveal delay={3}>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/auth/register"
                className="rounded-full bg-yellow px-8 py-3.5 text-sm font-semibold text-navy shadow-lg transition hover:bg-yellow-deep"
              >
                Join the pilot
              </Link>
              <Link
                href="/explore"
                className="rounded-full border border-navy/30 bg-white/60 px-8 py-3.5 text-sm font-semibold text-navy backdrop-blur transition hover:border-navy hover:bg-navy hover:text-white"
              >
                See the art
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== Why we're building this ===== */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.35em] text-indigo">
            Why we’re building this
          </p>
          <h2 className="mt-4 max-w-3xl font-serif text-3xl leading-tight md:text-4xl">
            Showcasing the art was never the hard part.
          </h2>
        </Reveal>
        <Reveal delay={1}>
          <div className="mt-6 grid gap-6 text-lg leading-relaxed text-muted md:grid-cols-2">
            <p>
              A beautiful gallery is only half the story. The hard part has
              always been what happens after someone falls in love with a piece:
              packing it, finding a courier, arranging the shipment, tracking it,
              and hoping it arrives safely. That work quietly fell on the artist —
              and too often it’s what stopped a sale from happening at all.
            </p>
            <p>
              So we’re taking it off your plate. KalaCUBE is building fulfilment
              into the platform — we arrange the courier, the pickup, the
              tracking and the delivery. Your only job is to make the work and
              hand over the parcel at your door. Everything else is on us, so you
              can just create.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ===== The workflow (centrepiece) ===== */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <Reveal>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-indigo">
                The workflow
              </p>
              <h2 className="mt-4 font-serif text-3xl leading-tight md:text-4xl">
                From order to delivery — handled for you.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted">
                Here’s the journey every sold piece takes. The artist steps in
                once — to hand the parcel to the courier. KalaCUBE takes care of
                the rest.
              </p>
            </div>
          </Reveal>

          <div className="mt-14">
            <Workflow />
          </div>
        </div>
      </section>

      {/* ===== The phases ===== */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-24">
        <Reveal>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-indigo">
              The phases
            </p>
            <h2 className="mt-4 font-serif text-3xl leading-tight md:text-4xl">
              Where we’re headed.
            </h2>
          </div>
        </Reveal>

        <ol className="mt-14 space-y-8">
          {PHASES.map((p, i) => (
            <Reveal key={p.tag} delay={i} as="li">
              <div className="grid gap-4 rounded-2xl border border-line bg-white p-7 shadow-sm md:grid-cols-[180px_1fr] md:gap-8 md:p-9">
                <div>
                  <span
                    className="inline-flex items-center rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.tag}
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-xl leading-snug md:text-2xl">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-muted">
                    {p.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ===== CTA band ===== */}
      <section className="border-t border-line bg-navy-deep text-white">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center md:py-24">
          <Reveal>
            <h2 className="font-serif text-3xl leading-tight md:text-4xl">
              Are you an artist? Join the pilot.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/70">
              Help us test doorstep pickup and delivery, and be among the first
              artists who can simply create — while we get the work to the buyer.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link
                href="/auth/register"
                className="rounded-full bg-yellow px-8 py-3.5 text-sm font-semibold text-navy shadow-lg transition hover:bg-yellow-deep"
              >
                Join the pilot
              </Link>
              <Link
                href="/explore"
                className="rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-white hover:text-navy"
              >
                See the art
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
