import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Fredoka } from 'next/font/google';
import Countdown from './Countdown';
import ShareButton from './ShareButton';
import MakersGallery from './MakersGallery';
import ShopOwnerStory from './ShopOwnerStory';
import './jlps.css';

// Rounded, friendly display face for the kids' event.
const fredoka = Fredoka({
  variable: '--font-fredoka',
  subsets: ['latin'],
  display: 'swap',
});

const SITE = 'https://jlps.kalacube.com';
const CONTACT = 'contact@kalacube.com';

export const metadata: Metadata = {
  title: { absolute: 'JLPS Winter Craft Market · Dec 10–31 · Made by Kids' },
  description:
    'Jean Lumb Public School students make and sell their own crafts: jewellery, ornaments, homemade treats, art, stickers, toys and gifts. Shop online Dec 10–31 with local delivery across CityPlace and downtown Toronto. 100% goes to the young makers. Sponsored by JLPS SAC.',
  alternates: { canonical: SITE },
  // Preview / feedback phase (SAC + teachers): keep out of search until launch.
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    url: SITE,
    siteName: 'JLPS Winter Craft Market',
    locale: 'en_CA',
    title: 'JLPS Winter Craft Market ❄️ Made by kids, Dec 10–31',
    description:
      'JLPS students make it, list it and sell it. Jewellery, ornaments, treats, art, toys and gifts. 100% to the young makers.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JLPS Winter Craft Market ❄️ Made by kids',
    description: 'Dec 10–31 · CityPlace & downtown Toronto · 100% to the young makers.',
  },
};

const mail = (subject: string, body: string) =>
  `mailto:${CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

const JOIN = '/jlps/join';

const BUY_MAIL = mail(
  'JLPS Winter Craft Market: remind me when it opens',
  'Hi! Please email me when the JLPS Winter Craft Market opens on Dec 10.\n\nName:\nNeighbourhood (e.g. CityPlace):',
);

// Deterministic snowflakes (no Math.random → stable server render).
const FLAKES = Array.from({ length: 34 }, (_, i) => ({
  left: (i * 37) % 100,
  size: 10 + ((i * 7) % 18),
  duration: 9 + ((i * 5) % 11),
  delay: -((i * 13) % 17),
  glyph: i % 3 === 0 ? '❄' : i % 3 === 1 ? '❅' : '•',
}));

const TITLE_COLORS = ['#ffd200', '#ff8a00', '#ff6fae', '#29e3c8', '#8fd3ff', '#ffd200'];

const CATEGORIES = [
  { emoji: '💍', name: 'Jewellery', note: 'Beads, bracelets, charms', bg: '#ffe3f0' },
  { emoji: '🎄', name: 'Ornaments', note: 'Baubles, stars, garlands', bg: '#dff7ec' },
  { emoji: '🍪', name: 'Homemade Treats', note: 'Cookies, fudge, cocoa jars', bg: '#fff1d6' },
  { emoji: '🎨', name: 'Paintings & Drawings', note: 'Masterpieces, big & small', bg: '#e6ecff' },
  { emoji: '⭐', name: 'Stickers', note: 'Cute, silly, sparkly', bg: '#fff7c2' },
  { emoji: '🧸', name: 'Toys', note: 'Plushies, slime, games', bg: '#f0e6ff' },
  { emoji: '🎁', name: 'Gifts', note: 'Cards, candles, keepsakes', bg: '#ffe6dc' },
  { emoji: '✨', name: 'Surprise Me!', note: 'Whatever you dream up', bg: '#dcf5ff' },
];

const DATES = [
  { when: 'Right now', what: 'Start making! Practise, sketch, bake test batches.', emoji: '✂️', color: '#ff8a00' },
  { when: 'Open now', what: 'Parents sign up and list your creations.', emoji: '📝', color: '#00a896' },
  { when: 'Thu, Dec 10', what: 'The shop opens to everyone!', emoji: '🎉', color: '#d81b60' },
  { when: 'Thu, Dec 31', what: 'Last day to shop. Happy New Year!', emoji: '🎆', color: '#7c4dff' },
];

const FAQ = [
  {
    q: 'Who can sell?',
    a: 'Students of Jean Lumb Public School (JLPS), with a parent or guardian running their shop. Parents sign up and list the items. KalaCUBE handles every order, collection and delivery.',
  },
  {
    q: 'Who can buy?',
    a: 'Everyone! Family, friends, neighbours and anyone who loves handmade things. We deliver to your door across CityPlace and downtown Toronto.',
  },
  {
    q: 'Does anyone take a cut?',
    a: 'No. 100% of every sale goes to the student maker and their family. KalaCUBE covers the platform and payment costs.',
  },
  {
    q: 'How do buyers pay?',
    a: 'Securely online by card when the shop opens on December 10. No cash to handle.',
  },
  {
    q: 'Can my child sell homemade treats?',
    a: 'Yes! Every treat must list its ingredients and allergens. Treats are delivered locally by our team (no long-distance shipping).',
  },
  {
    q: 'How is my child’s privacy protected?',
    a: 'Kids appear by first name, last initial and grade only (like “Maya R., Grade 4”). Photos show the craft, not faces. Buyers never meet, message or visit kids or their families. KalaCUBE handles every order, question and delivery.',
  },
];

function Bunting() {
  const colors = ['#ffd200', '#ff8a00', '#d81b60', '#7c4dff', '#29b6f6', '#00a896'];
  return (
    <div className="jlps-bunting" aria-hidden>
      {Array.from({ length: 60 }, (_, i) => (
        <i key={i} style={{ background: colors[i % colors.length] }} />
      ))}
    </div>
  );
}

export default function JlpsWinterMarketPage() {
  return (
    <main data-jlps className={`jlps ${fredoka.variable}`}>
      {/* ================= HERO ================= */}
      <section className="jlps-hero">
        <div className="jlps-snow" aria-hidden>
          {FLAKES.map((f, i) => (
            <span
              key={i}
              className="jlps-flake"
              style={{
                left: `${f.left}%`,
                fontSize: f.size,
                animationDuration: `${f.duration}s`,
                animationDelay: `${f.delay}s`,
              }}
            >
              {f.glyph}
            </span>
          ))}
        </div>

        <Bunting />

        <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 text-center sm:px-6 sm:pt-14">
          <span className="jlps-chip bg-white/15 text-white ring-2 ring-white/40">
            ❄️ JLPS SAC presents
          </span>

          <h1 className="jlps-title mt-6">
            <span className="block text-3xl text-white/95 sm:text-4xl">The JLPS</span>
            <span className="mt-2 block text-[3.2rem] sm:text-7xl md:text-8xl">
              {'Winter'.split('').map((ch, i) => (
                <span key={i} style={{ color: TITLE_COLORS[i % TITLE_COLORS.length] }}>
                  {ch}
                </span>
              ))}
            </span>
            <span className="block text-[2.6rem] text-white sm:text-6xl md:text-7xl">
              Craft Market <span className="jlps-wiggle">🎨</span>
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-xl font-medium text-white/95 sm:text-2xl">
            Made by kids. Loved by the whole neighbourhood.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-base text-white/80 sm:text-lg">
            Jean Lumb Public School students make it, list it and sell it, online for everyone
            in CityPlace and downtown Toronto.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <span className="jlps-chip bg-[var(--sun)] text-[var(--ink)]">📅 Dec 10 – Dec 31, 2026</span>
            <span className="jlps-chip bg-white text-[var(--ink)]">📍 CityPlace & Downtown Toronto</span>
            <span className="jlps-chip bg-[var(--mint)] text-white">💚 100% to the makers</span>
          </div>

          <div className="mt-10">
            <Countdown />
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={JOIN} className="jlps-btn jlps-btn-sun w-full sm:w-auto">
              🖍️ My kid wants to sell
            </Link>
            <a href={BUY_MAIL} className="jlps-btn jlps-btn-white w-full sm:w-auto">
              🛍️ Remind me when it opens
            </a>
          </div>
          <p className="mt-4 text-sm text-white/80">
            Already opened a shop?{' '}
            <Link href="/dashboard" className="font-semibold underline">
              Go to your dashboard
            </Link>
          </p>
          <ShareButton className="mt-3 text-base font-semibold text-white underline decoration-wavy decoration-[var(--sun)] underline-offset-4 hover:text-[var(--sun)]" />
        </div>

        {/* Snowy hill */}
        <svg
          className="absolute bottom-[-1px] left-0 block h-16 w-full sm:h-24"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0,64 C180,10 360,110 560,70 C760,30 920,100 1120,64 C1260,40 1360,70 1440,56 L1440,120 L0,120 Z"
            fill="#fffaf0"
          />
        </svg>
      </section>

      <ShopOwnerStory />

      {/* ================= WHAT CAN YOU MAKE ================= */}
      <section className="bg-[#eaf4ff] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--mint)]">Get inspired</p>
            <h2 className="mt-2 text-4xl font-bold sm:text-5xl">What will you make? 🤔</h2>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {CATEGORIES.map((c, i) => (
              <div
                key={c.name}
                className="jlps-card jlps-pop flex flex-col items-center p-5 text-center sm:p-6"
                style={{ background: c.bg, rotate: `${i % 2 ? 1.2 : -1.2}deg` }}
              >
                <span className="text-5xl sm:text-6xl" aria-hidden>
                  {c.emoji}
                </span>
                <h3 className="mt-3 text-xl font-bold leading-tight sm:text-2xl">{c.name}</h3>
                <p className="mt-1 text-sm text-[#3b4a6b] sm:text-base">{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MakersGallery />

      {/* ================= 100% BAND ================= */}
      <section className="relative overflow-hidden bg-[var(--sun)] py-14 sm:py-16">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 text-center sm:px-6 md:flex-row md:text-left">
          <div className="jlps-wiggle shrink-0 text-[6.5rem] font-bold leading-none text-[var(--berry)] [text-shadow:0_6px_0_var(--ink)] sm:text-[8rem]">
            100%
          </div>
          <div>
            <h2 className="text-3xl font-bold sm:text-4xl">Every dollar goes home with the kid who made it.</h2>
            <p className="mt-2 text-lg text-[var(--ink)]/80">
              No fees. No cuts. KalaCUBE covers the platform and payment costs, so our young makers
              keep it all. 🐷💰
            </p>
          </div>
        </div>
      </section>

      {/* ================= GROWN-UPS ================= */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--grape)]">For the grown-ups</p>
          <h2 className="mt-2 text-4xl font-bold sm:text-5xl">Simple, safe & local 🏡</h2>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="jlps-card p-7 sm:p-8" style={{ background: '#fff3e0' }}>
            <div className="text-5xl">👪</div>
            <h3 className="mt-3 text-3xl font-bold text-[var(--tang)]">JLPS parents</h3>
            <ul className="mt-4 space-y-3 text-lg">
              <li>✅ <b>You list, we do the rest:</b> orders, collection and delivery are all handled by KalaCUBE.</li>
              <li>✅ <b>Kids stay private:</b> first name, last initial and grade only.</li>
              <li>✅ <b>No strangers, ever:</b> buyers never meet or message kids or families.</li>
              <li>✅ <b>You keep 100%:</b> paid out to you after each sale.</li>
            </ul>
            <Link href={JOIN} className="jlps-btn jlps-btn-sun mt-7">
              🖍️ Open our shop
            </Link>
          </div>

          <div className="jlps-card p-7 sm:p-8" style={{ background: '#e8f7f3' }}>
            <div className="text-5xl">🛍️</div>
            <h3 className="mt-3 text-3xl font-bold text-[var(--mint)]">Shoppers</h3>
            <ul className="mt-4 space-y-3 text-lg">
              <li>🎁 <b>One-of-a-kind gifts:</b> stocking stuffers, teacher gifts, treats.</li>
              <li>💳 <b>Pay securely online</b> by card.</li>
              <li>🚚 <b>Delivered to your door</b> across CityPlace & downtown Toronto.</li>
              <li>💛 <b>Make a kid&apos;s day:</b> every dollar goes to the maker.</li>
            </ul>
            <a href={BUY_MAIL} className="jlps-btn jlps-btn-white mt-7">
              🔔 Remind me Dec 10
            </a>
          </div>
        </div>
      </section>

      {/* ================= DATES ================= */}
      <section className="bg-[var(--sky-1)] py-16 text-white sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--sun)]">Mark your calendar</p>
            <h2 className="mt-2 text-4xl font-bold sm:text-5xl">Important dates 🗓️</h2>
          </div>
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DATES.map((d) => (
              <li
                key={d.when}
                className="jlps-pop rounded-[28px] border-[3px] border-white/80 bg-white/10 p-6 text-center"
              >
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                  style={{ background: d.color }}
                >
                  {d.emoji}
                </div>
                <p className="mt-4 text-2xl font-bold text-[var(--sun)]">{d.when}</p>
                <p className="mt-1 text-lg text-white/85">{d.what}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-center text-4xl font-bold sm:text-5xl">Questions? 🙋</h2>
        <div className="mt-10 space-y-4">
          {FAQ.map((f) => (
            <details key={f.q} className="jlps-card px-6 py-5">
              <summary className="flex items-center justify-between gap-4 text-xl font-semibold">
                {f.q}
                <span className="jlps-plus text-3xl leading-none text-[var(--berry)]" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 text-lg text-[#3b4a6b]">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-center text-lg">
          Still curious? Email{' '}
          <a href={`mailto:${CONTACT}`} className="font-semibold text-[var(--berry)] underline">
            {CONTACT}
          </a>
        </p>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-[var(--sky-1)] text-white">
        <Bunting />
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-12 text-center sm:px-6">
          <p className="text-3xl font-bold sm:text-4xl">
            Make it. Sell it. <span className="text-[var(--sun)]">Be proud of it.</span> ❄️
          </p>
          <ShareButton className="jlps-btn jlps-btn-sun" />
          <div className="mt-4 flex flex-col items-center gap-2">
            <span className="jlps-chip bg-white text-[var(--ink)]">🏫 Sponsored by JLPS SAC</span>
            <span className="text-sm text-white/75">
              Jean Lumb Public School · Student Advisory Committee
            </span>
          </div>
          <a
            href="https://kalacube.com"
            className="mt-2 flex items-center gap-2 text-sm text-white/75 hover:text-white"
          >
            Powered by
            <span className="rounded-xl bg-white px-2 py-1">
              <Image
                src="/brand/logo-primary.png"
                alt="KalaCUBE"
                width={55}
                height={45}
                className="h-8 w-auto"
              />
            </span>
          </a>
        </div>
      </footer>
    </main>
  );
}
