'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DIMENSIONS = [
  { href: '/explore', label: 'Explore Gallery' },
  { href: '/all-artist', label: 'Artists' },
  { href: '/all-categories', label: 'Categories' },
  { href: '/events', label: 'Events' },
];

const LEGAL = [
  { href: '/contact', label: 'Contact Us' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/refund-policy', label: 'Refund & Cancellation' },
  { href: '/shipping-policy', label: 'Shipping Policy' },
];

export default function Footer() {
  const pathname = usePathname();
  // Hidden inside the full-screen admin console.
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="bg-navy-deep text-white/70">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 md:grid-cols-5">
        <div className="md:col-span-2">
          <Link href="/" className="inline-flex items-center" aria-label="KalaCUBE — Art Lives Here">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* Transparent (navy) logo rendered white for the dark footer. */}
            <img
              src="/brand/logo-primary.png"
              alt="KalaCUBE"
              width={547}
              height={451}
              className="h-16 w-auto brightness-0 invert"
            />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
            A World of Art. In One Cube. Discover visual art, handicraft and
            performing arts — and connect with the people behind the work.
          </p>
          <div className="mt-5 flex items-center gap-4 text-xs font-semibold uppercase tracking-wider">
            <span className="text-orange">Visual Art</span>
            <span className="text-white/25">·</span>
            <span className="text-teal">Handicraft</span>
            <span className="text-white/25">·</span>
            <span className="text-magenta">Performing Art</span>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-white">Discover</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            {DIMENSIONS.map((d) => (
              <li key={d.href}>
                <Link href={d.href} className="transition hover:text-yellow">{d.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white">Community</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/auth/register" className="transition hover:text-yellow">Join KalaCUBE</Link></li>
            <li><Link href="/auth/login" className="transition hover:text-yellow">Sign in</Link></li>
            <li><Link href="/faqs" className="transition hover:text-yellow">FAQs</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-white">Legal</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            {LEGAL.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-yellow">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-5 text-center text-xs text-white/45">
        © {2026} KalaCUBE. Art Lives Here.
      </div>
    </footer>
  );
}
