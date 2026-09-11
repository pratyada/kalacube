import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQs — KalaCUBE',
  description:
    'Frequently asked questions about KalaCUBE — India’s home for handicraft, visual art and performing arts.',
};

const FAQS = [
  {
    q: 'What is KalaCUBE?',
    a: 'KalaCUBE is a home for India’s artists across three dimensions — Handicraft, Visual Art and Performing Arts. Artists showcase their work, connect with a community, and reach people who love original, handmade art.',
  },
  {
    q: 'How do I join as an artist?',
    a: 'Create an account, complete your artist profile, and start uploading your work. Once you’re in, you can manage your portfolio, edit your profile, and be discovered in the Gallery.',
  },
  {
    q: 'How do I upload my artwork?',
    a: 'Sign in, open your dashboard, and choose “Upload artwork.” Add a title, images, and details like medium and price — your piece then appears in the Explore gallery.',
  },
  {
    q: 'Is it free to use?',
    a: 'Yes — browsing the gallery and creating an artist profile is free. Explore artists, categories and art styles across the whole community at no cost.',
  },
  {
    q: 'What kinds of art are on KalaCUBE?',
    a: 'Everything from painting, drawing, photography and digital media to jewellery, textiles, home décor, sculpture and more — organised by art type, category and art style so it’s easy to find.',
  },
  {
    q: 'How is KalaCUBE connected to Musée?',
    a: 'KalaCUBE grew out of Musée Art Café — a physical space where local art lived on the walls. When the world moved online, we took those walls with us, keeping artists visible and connected.',
  },
];

export default function FaqsPage() {
  return (
    <main className="min-h-screen bg-[#faf7f2] text-neutral-900">
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
