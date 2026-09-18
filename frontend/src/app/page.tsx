import Link from 'next/link';
import HeroArtworks from '@/components/home/HeroArtworks';
import HomeSections from '@/components/home/HomeSections';

/**
 * Homepage — a Server Component so the hero (H1, subtext, CTAs) is server-rendered
 * and indexable, and paints instantly via a CSS gradient base. The animated WebGL
 * backdrop (<HeroCanvas>) and the data-driven sections (<HomeSections>) are small
 * client islands layered on after hydration — progressive enhancement only.
 */
export default function Home() {
  return (
    <main className="bg-cream text-navy-deep">
      {/* ===== HERO — premium animated backdrop behind server-rendered text ===== */}
      <section className="relative flex min-h-[92vh] flex-col justify-center overflow-hidden">
        {/* Instant CSS gradient base — paints before hydration and is the graceful
            fallback when WebGL/animation is unavailable (no blank hero, no CLS). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(115% 85% at 18% 12%, #e7ecff 0%, #eef1ff 38%, #faf7f2 72%, #f3efe9 100%)',
          }}
        />
        {/* The living gallery — real artworks floating behind the headline. */}
        <HeroArtworks />
        {/* Faint blueprint grid — a static nod to the brand's cube geometry. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(32,47,154,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(32,47,154,0.06) 1px, transparent 1px)',
            backgroundSize: '54px 54px',
            maskImage:
              'radial-gradient(120% 90% at 50% 40%, #000 30%, transparent 78%)',
            WebkitMaskImage:
              'radial-gradient(120% 90% at 50% 40%, #000 30%, transparent 78%)',
          }}
        />
        {/* Legibility scrim — keeps navy text crisp over the animation. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#faf7f2]/70 via-[#faf7f2]/45 to-[#faf7f2]/85" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <p className="hero-rise hero-rise-1 text-xs uppercase tracking-[0.25em] text-[#202f9a] sm:tracking-[0.45em]">
            Kala · Art in three dimensions
          </p>
          <h1 className="hero-rise hero-rise-2 mt-6 font-serif text-4xl leading-[1.08] sm:text-5xl md:text-7xl">
            Where India&apos;s artists <span className="italic text-[#202f9a]">come alive</span>
          </h1>
          <p className="hero-rise hero-rise-3 mx-auto mt-6 max-w-xl text-lg text-neutral-700">
            A living gallery of handicraft, visual art, and performing arts —
            from the makers shaping culture today.
          </p>
          <div className="hero-rise hero-rise-4 mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/explore" className="rounded-full bg-yellow px-8 py-3.5 text-sm font-semibold text-navy shadow-lg transition hover:bg-yellow-deep">
              Explore the Gallery
            </Link>
            <Link href="/all-artist" className="rounded-full border border-navy/30 bg-white/60 px-8 py-3.5 text-sm font-semibold text-navy backdrop-blur transition hover:border-navy hover:bg-navy hover:text-white">
              Meet the Artists
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Everything below the fold (client island) ===== */}
      <HomeSections />
    </main>
  );
}
