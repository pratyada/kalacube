'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DIMENSIONS = [
  { href: '/explore', label: 'Explore Gallery' },
  { href: '/all-artist', label: 'Artists' },
  { href: '/all-categories', label: 'Categories' },
  { href: '/events', label: 'Events' },
];

export default function Footer() {
  const pathname = usePathname();
  // Hidden inside the full-screen admin console.
  if (pathname.startsWith('/admin')) return null;

  return (
    <footer className="border-t border-neutral-200 bg-[#f3efe9] text-neutral-700">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link href="/" className="font-serif text-2xl">
            kala<span className="text-[#a06f1e]">CUBE</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm text-neutral-600">
            A home for India&apos;s artists across Handicraft, Visual Art, and
            Performing Arts — showcase your work, connect, and grow.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-neutral-900">Discover</h4>
          <ul className="mt-3 space-y-2 text-sm">
            {DIMENSIONS.map((d) => (
              <li key={d.href}>
                <Link href={d.href} className="hover:text-[#a06f1e]">{d.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-neutral-900">Community</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/auth/register" className="hover:text-[#a06f1e]">Join as an artist</Link></li>
            <li><Link href="/auth/login" className="hover:text-[#a06f1e]">Sign in</Link></li>
            <li><Link href="/faqs" className="hover:text-[#a06f1e]">FAQs</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-neutral-200 px-6 py-5 text-center text-xs text-neutral-500">
        © {2026} KalaCUBE. Art in three dimensions.
      </div>
    </footer>
  );
}
