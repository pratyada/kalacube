import Link from 'next/link';
import type { Metadata } from 'next';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Art Events & Exhibitions',
  description:
    "Art exhibitions, workshops and live demos from India's artists, plus performing-arts showcases. Our first season is being curated now — check back soon.",
  alternates: { canonical: '/events' },
  openGraph: {
    title: 'Art Events & Exhibitions — KalaCUBE',
    description:
      "Art exhibitions, workshops, live demos and performing-arts showcases from India's artists. Coming soon.",
    url: '/events',
    type: 'website',
  },
};

const breadcrumb = breadcrumbJsonLd([
  ['Home', '/'],
  ['Events', '/events'],
]);

export default function EventsPage() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-[#faf7f2] px-6 py-20 text-center text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <p className="text-xs uppercase tracking-[0.3em] text-[#202f9a]">KalaCUBE</p>
      <h1 className="mt-4 font-serif text-4xl md:text-5xl">Events</h1>
      <p className="mx-auto mt-4 max-w-md text-neutral-600">
        Exhibitions, live demos, and workshops from India&apos;s artists are on
        their way. We&apos;re curating the first season now — check back soon.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/explore"
          className="rounded-full bg-[#0b1f52] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#202f9a]"
        >
          Explore the Gallery
        </Link>
        <Link
          href="/all-artist"
          className="rounded-full border border-neutral-400 bg-white px-7 py-3 text-sm font-semibold transition hover:border-[#202f9a]"
        >
          Meet the Artists
        </Link>
      </div>
    </main>
  );
}
