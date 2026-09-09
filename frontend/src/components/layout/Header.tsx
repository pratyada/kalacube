'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/explore', label: 'Explore' },
  { href: '/all-artist', label: 'Artists' },
];

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-[#faf8f5]/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="font-serif text-xl tracking-wide text-neutral-900">
          kala<span className="text-[#a06f1e]">CUBE</span>
        </Link>

        <nav className="flex items-center gap-6">
          {NAV.map((n) => {
            const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`text-sm transition ${
                  active ? 'text-[#a06f1e]' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {n.label}
              </Link>
            );
          })}

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-sm text-neutral-600 hover:text-neutral-900">
                Dashboard
              </Link>
              <button onClick={() => logout()} className="text-sm text-neutral-500 hover:text-neutral-700">
                Logout
              </button>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#cda45c]/20 text-sm text-[#a06f1e]">
                {user?.firstName?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="rounded-full border border-[#cda45c]/50 px-4 py-1.5 text-sm text-[#a06f1e] transition hover:bg-[#cda45c] hover:text-black"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
