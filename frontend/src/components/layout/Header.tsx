'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/explore', label: 'Explore' },
  { href: '/all-artist', label: 'Artists' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Journal' },
];

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const cartCount = useCartStore((s) => s.items.length);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isAdmin = !!user && ['admin', 'superadmin'].includes(user.role);
  const displayName =
    `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'Account';
  const initial = (user?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase();

  // Close the dropdown on outside click, Escape, or route change.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setNavOpen(false);
  }, [pathname]);

  // Close the mobile nav sheet on Escape.
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNavOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navOpen]);

  // The admin console is a full-screen dark app — no public site chrome.
  // (Must be AFTER all hooks to keep hook order stable across routes.)
  if (pathname.startsWith('/admin')) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center" aria-label="KalaCUBE — Art Lives Here">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-primary.png"
            alt="KalaCUBE"
            width={547}
            height={451}
            className="h-11 w-auto"
          />
        </Link>

        <nav className="flex items-center gap-3 sm:gap-6">
          <div className="hidden items-center gap-6 md:flex">
            {NAV.map((n) => {
              const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`text-sm font-medium transition ${
                    active ? 'text-indigo' : 'text-muted hover:text-navy'
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </div>

          {/* Cart */}
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-navy transition hover:bg-brand-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {mounted && cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-yellow px-1 text-[10px] font-bold text-navy">
                {cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-navy ring-1 ring-line transition hover:bg-brand-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo"
              >
                {initial}
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg ring-1 ring-black/5"
                >
                  <div className="border-b border-neutral-100 px-4 py-3">
                    <p className="truncate text-sm font-medium text-neutral-900">{displayName}</p>
                    {user?.email && (
                      <p className="truncate text-xs text-neutral-500">{user.email}</p>
                    )}
                    {isAdmin && (
                      <span className="mt-1 inline-block rounded-full bg-yellow/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-navy">
                        {user?.role}
                      </span>
                    )}
                  </div>

                  <div className="py-1">
                    <Link
                      href="/dashboard/upload"
                      role="menuitem"
                      className="block px-4 py-2 text-sm font-semibold text-indigo transition hover:bg-brand-50"
                    >
                      + Upload artwork
                    </Link>
                    <Link
                      href="/dashboard"
                      role="menuitem"
                      className="block px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href={user?.username ? `/artist/${user.username}` : '/dashboard'}
                      role="menuitem"
                      className="block px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50"
                    >
                      My profile
                    </Link>
                    <Link
                      href="/profile/edit"
                      role="menuitem"
                      className="block px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-50"
                    >
                      Edit profile
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        role="menuitem"
                        className="flex items-center justify-between px-4 py-2 text-sm font-semibold text-indigo transition hover:bg-brand-50"
                      >
                        Admin panel
                        <span className="rounded bg-yellow/25 px-1.5 py-0.5 text-[10px] uppercase text-navy">
                          Staff
                        </span>
                      </Link>
                    )}
                  </div>

                  <div className="border-t border-neutral-100 py-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      role="menuitem"
                      className="block w-full px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/auth/login"
                className="rounded-full border border-navy/25 px-3 py-1.5 text-sm font-semibold text-navy transition hover:bg-navy hover:text-white sm:px-4"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="hidden rounded-full bg-indigo px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-navy sm:inline-flex"
              >
                Join as an artist
              </Link>
            </div>
          )}

          {/* Hamburger — mobile only */}
          <button
            type="button"
            onClick={() => setNavOpen((o) => !o)}
            aria-label={navOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={navOpen}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-navy transition hover:bg-brand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo md:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {navOpen ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </nav>
      </div>

      {/* Mobile nav sheet */}
      {navOpen && (
        <nav className="border-t border-line bg-cream/95 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-2">
            {NAV.map((n) => {
              const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setNavOpen(false)}
                  className={`rounded-lg px-3 py-3 text-base font-medium transition ${
                    active ? 'bg-brand-100 text-indigo' : 'text-navy hover:bg-brand-50'
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
            {!isAuthenticated && (
              <Link
                href="/auth/register"
                onClick={() => setNavOpen(false)}
                className="mt-2 rounded-full bg-indigo px-3 py-3 text-center text-base font-semibold text-white transition hover:bg-navy"
              >
                Join as an artist
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
