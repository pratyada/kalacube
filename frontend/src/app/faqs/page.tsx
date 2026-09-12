import Link from 'next/link';
import type { Metadata } from 'next';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Artist & Buyer FAQs',
  description:
    'How to showcase and sell your art online in India, build an artist portfolio, thrive in the AI age, and buy original handmade Indian art — answered on KalaCUBE.',
  alternates: { canonical: '/faqs' },
  openGraph: {
    title: 'Artist & Buyer FAQs — KalaCUBE',
    description:
      'How to showcase and sell art online in India, build a portfolio, and buy original handmade Indian art.',
    url: '/faqs',
    type: 'website',
  },
};

const FAQS = [
  {
    q: 'What is KalaCUBE?',
    a: 'KalaCUBE is a home for India’s artists, creators and artisans across three dimensions — Handicraft, Visual Art and Performing Arts. Artists build a portfolio, showcase and sell their work, and get discovered by people who love original, human-made art.',
  },
  {
    q: 'How do I showcase my art online?',
    a: 'Create a free KalaCUBE account, complete your artist profile, and upload your work with a title, images and details like medium, size and price. Your pieces then appear in the Explore gallery where collectors and fellow artists can discover them.',
  },
  {
    q: 'How can I sell my art online in India?',
    a: 'Upload your artwork with a price and details, and buyers who discover it in the gallery can reach out to you directly. There are no gatekeepers — you keep your own relationship with collectors, and browsing and listing your work is free.',
  },
  {
    q: 'How do I build an artist portfolio in India?',
    a: 'A KalaCUBE profile is a ready-made online portfolio: add your bio and artist statement, group your work by art style and medium, and share your profile link anywhere. It gives Indian artists a professional presence without building a website from scratch.',
  },
  {
    q: 'What should artists do in the AI age?',
    a: 'Lean into what only human hands can do — original, culturally rooted, handmade work with a story behind it. The AI age makes provenance and authenticity more valuable, not less. KalaCUBE helps artists stay visible, tell that story, and connect directly with people who specifically want human-made art.',
  },
  {
    q: 'Is the art on KalaCUBE human-made or AI-generated?',
    a: 'KalaCUBE is a home for original, human-made art by real Indian artists and artisans. Every profile belongs to a person, and every piece is created by their own hands — that authenticity is the whole point.',
  },
  {
    q: 'Where can I buy original Indian art online?',
    a: 'Browse the Explore gallery to discover original work — from Madhubani, Pichwai, Warli and Gond paintings to photography, sculpture, jewellery and textiles — and connect directly with the artist who made it. Every piece is an original by an Indian maker.',
  },
  {
    q: 'How do I join as an artist?',
    a: 'Create an account, complete your artist profile, and start uploading your work. Once you’re in, you can manage your portfolio, edit your profile, and be discovered in the Gallery.',
  },
  {
    q: 'Is it free to use?',
    a: 'Yes — browsing the gallery and creating an artist profile is free. Showcase your portfolio and explore artists, categories and art styles across the whole community at no cost.',
  },
  {
    q: 'What kinds of art are on KalaCUBE?',
    a: 'Everything from painting, drawing, photography and digital media to jewellery, textiles, home décor, sculpture and performing arts — organised by art type, category and art style so it’s easy to find.',
  },
  {
    q: 'How is KalaCUBE connected to Musée?',
    a: 'KalaCUBE grew out of Musée Art Café in Dehradun — a physical space where local art lived on the walls. When the world moved online, we took those walls with us, keeping artists visible and connected.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const breadcrumb = breadcrumbJsonLd([
  ['Home', '/'],
  ['FAQs', '/faqs'],
]);

export default function FaqsPage() {
  return (
    <main className="min-h-screen bg-[#faf7f2] text-neutral-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <header className="border-b border-neutral-200 px-6 py-10 text-center sm:py-14">
        <p className="text-xs uppercase tracking-[0.3em] text-[#202f9a]">Help</p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">Frequently Asked Questions</h1>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="space-y-4">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-neutral-200 bg-white p-5 open:border-[#202f9a]/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between font-serif text-lg">
                {f.q}
                <span className="ml-4 text-[#202f9a] transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center text-sm text-neutral-600">
          Still have a question?{' '}
          <Link href="/auth/register" className="font-medium text-[#202f9a] hover:underline">
            Join KalaCUBE
          </Link>{' '}
          and reach out.
        </div>
      </section>
    </main>
  );
}
