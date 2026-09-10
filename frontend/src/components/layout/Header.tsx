'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/explore', label: 'Explore' },
  { href: '/all-artist', label: 'Artists' },
  { href: '/blog', label: 'Journal' },
];

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
  }, [pathname]);

  // The admin console is a full-screen dark app — no public site chrome.
  // (Must be AFTER all hooks to keep hook order stable across routes.)
  if (pathname.startsWith('/admin')) return null;

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
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#cda45c]/20 text-sm font-medium text-[#a06f1e] ring-1 ring-[#cda45c]/40 transition hover:bg-[#cda45c]/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a06f1e]"
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
                      <span className="mt-1 inline-block rounded-full bg-[#a06f1e]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#a06f1e]">
                        {user?.role}
                      </span>
                    )}
                  </div>

                  <div className="py-1">
                    <Link
                      href="/dashboard/upload"
                      role="menuitem"
                      className="block px-4 py-2 text-sm font-medium text-[#a06f1e] transition hover:bg-[#cda45c]/10"
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
                    {isAdmin && (
                      <Link
                        href="/admin"
                        role="menuitem"
                        className="flex items-center justify-between px-4 py-2 text-sm font-medium text-[#a06f1e] transition hover:bg-[#cda45c]/10"
                      >
                        Admin panel
                        <span className="rounded bg-[#a06f1e]/10 px-1.5 py-0.5 text-[10px] uppercase">
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
