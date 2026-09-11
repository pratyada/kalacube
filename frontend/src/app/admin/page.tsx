'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import DashboardSection from '@/components/admin/DashboardSection';
import ArtistsSection from '@/components/admin/ArtistsSection';
import ArtworksSection from '@/components/admin/ArtworksSection';
import FeaturedSection from '@/components/admin/FeaturedSection';
import EmailSection from '@/components/admin/EmailSection';
import EmailCampaignsSection from '@/components/admin/EmailCampaignsSection';
import SimpleTableSection from '@/components/admin/SimpleTableSection';
import type { AdminSection } from '@/components/admin/types';
import { StatusDot, ui, cx } from '@/components/admin/console';

const NAV: { key: AdminSection; label: string; code: string }[] = [
  { key: 'dashboard', label: 'Dashboard', code: 'SYS' },
  { key: 'artists', label: 'Artists', code: 'USR' },
  { key: 'artworks', label: 'Artworks', code: 'ART' },
  { key: 'featured', label: 'Featured', code: 'FTR' },
  { key: 'email', label: 'Email & Marketing', code: 'COMM' },
  { key: 'campaigns', label: 'Email Campaigns', code: 'MAIL' },
  { key: 'artspaces', label: 'Art Spaces', code: 'SPACE' },
  { key: 'events', label: 'Events', code: 'EVT' },
];

function fmtDate(v: unknown): string {
  if (!v) return '';
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function AdminPage() {
  const { user, isLoading, fetchUser, logout } = useAuthStore();
  const [section, setSection] = useState<AdminSection>('dashboard');
  const clock = useClock();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const isAdmin = !!user && ['admin', 'superadmin'].includes(user.role);

  if (isLoading)
    return (
      <div className={cx('min-h-screen p-10 text-sm', ui.screen, ui.green)}>
        <span className="animate-pulse">▸ establishing secure link…</span>
      </div>
    );

  if (!isAdmin)
    return (
      <div className={cx('flex min-h-screen flex-col items-center justify-center p-10 text-center', ui.screen)}>
        <div className={cx('rounded-md border border-[#3a1e22] bg-[#0a1119] px-8 py-10', 'max-w-md')}>
          <div className={cx('text-sm tracking-[0.3em]', ui.red)}>⚠ ACCESS DENIED</div>
          <h1 className="mt-4 text-lg text-[#c2d0dc]">Clearance required</h1>
          <p className="mt-2 text-sm text-[#5f7285]">
            This terminal is restricted to operators with admin clearance.
          </p>
          <Link
            href="/auth/login"
            className={cx('mt-6 inline-block', ui.btnPrimary)}
          >
            ▸ Authenticate
          </Link>
        </div>
      </div>
    );

  const utc = clock
    ? clock.toISOString().slice(11, 19)
    : '--:--:--';

  return (
    <div className={cx('min-h-screen', ui.screen)}>
      {/* top status bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#132030] bg-[#070d14]/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center gap-3">
          <StatusDot color="green" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo-dark-bg.png"
            alt="KalaCUBE"
            width={611}
            height={515}
            className="h-6 w-auto rounded"
          />
          <span className="text-sm font-semibold tracking-[0.3em] text-[#c2d0dc]">
            <span className="text-[#3ef2a1]">// </span>MISSION CONTROL
          </span>
        </div>
        <div className="hidden items-center gap-4 text-[11px] text-[#5f7285] md:flex">
          <span>
            API <span className={ui.green}>●</span>
          </span>
          <span>
            DB <span className={ui.green}>●</span>
          </span>
          <span>
            QUEUE <span className={ui.amber}>●</span>
          </span>
          <span className="tabular-nums text-[#aab8c6]">{utc} UTC</span>
          <Link
            href="/"
            className="rounded border border-[#1b2c3d] px-2.5 py-1 text-[#8fa4b6] transition hover:border-[#3ef2a1] hover:text-[#3ef2a1]"
          >
            ⏎ EXIT TO SITE
          </Link>
        </div>
      </div>

      <div className="flex">
        {/* sidebar */}
        <aside className="sticky top-[41px] hidden h-[calc(100vh-41px)] w-56 shrink-0 flex-col border-r border-[#132030] bg-[#070d14] md:flex">
          <div className="px-4 py-4 text-[11px] leading-relaxed text-[#3ef2a1]">
            <div className="text-[#5f7285]">root@kalacube:~#</div>
            <div>./admin --console</div>
          </div>
          <nav className="flex-1 space-y-0.5 px-2">
            {NAV.map((n) => {
              const on = section === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => setSection(n.key)}
                  className={cx(
                    'flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs transition',
                    on
                      ? 'bg-[#3ef2a1]/10 text-[#3ef2a1]'
                      : 'text-[#7d8fa0] hover:bg-[#0e1926] hover:text-[#c2d0dc]',
                  )}
                >
                  <span className="w-3 text-[#3ef2a1]">{on ? '▸' : ' '}</span>
                  <span className="w-10 shrink-0 text-[10px] text-[#4f6577]">
                    {n.code}
                  </span>
                  <span className="truncate">{n.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="border-t border-[#132030] px-4 py-3 text-[11px]">
            <div className="flex items-center gap-2 text-[#7d8fa0]">
              <StatusDot color="green" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="mt-0.5 uppercase tracking-widest text-[#4f6577]">
              clearance: <span className={ui.amber}>{user.role}</span>
            </div>
            <button
              onClick={() => logout()}
              className="mt-3 w-full rounded border border-[#3a1e22] px-3 py-1.5 text-left text-[#ff6b6b] transition hover:bg-[#ff6b6b]/10"
            >
              ⏻ terminate session
            </button>
          </div>
        </aside>

        {/* main */}
        <main className="min-w-0 flex-1">
          {/* mobile nav */}
          <div className="flex gap-1 overflow-x-auto border-b border-[#132030] bg-[#070d14] px-3 py-2 md:hidden">
            {NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => setSection(n.key)}
                className={cx(
                  'whitespace-nowrap rounded px-3 py-1.5 text-xs',
                  section === n.key
                    ? 'bg-[#3ef2a1]/10 text-[#3ef2a1]'
                    : 'text-[#7d8fa0]',
                )}
              >
                {n.label}
              </button>
            ))}
            <Link
              href="/"
              className="ml-auto whitespace-nowrap rounded border border-[#1b2c3d] px-3 py-1.5 text-xs text-[#8fa4b6]"
            >
              ⏎ Exit
            </Link>
          </div>

          <div className="mx-auto max-w-6xl px-4 py-6">
            {section === 'dashboard' && <DashboardSection />}
            {section === 'artists' && <ArtistsSection />}
            {section === 'artworks' && <ArtworksSection />}
            {section === 'featured' && <FeaturedSection />}
            {section === 'email' && <EmailSection userEmail={user.email} />}
            {section === 'campaigns' && <EmailCampaignsSection />}
            {section === 'artspaces' && (
              <SimpleTableSection
                title="Art Spaces"
                endpoint="/api/admin/artspaces"
                columns={[
                  { header: 'Name', render: (r) => (r.name as string) || '' },
                  {
                    header: 'Category',
                    render: (r) => (r.category as string) || '',
                  },
                  {
                    header: 'Contact',
                    render: (r) => (r.contactPerson as string) || '',
                  },
                  { header: 'Email', render: (r) => (r.email as string) || '' },
                  {
                    header: 'Country',
                    render: (r) => (r.country as string) || '',
                  },
                ]}
              />
            )}
            {section === 'events' && (
              <SimpleTableSection
                title="Events"
                endpoint="/api/admin/events"
                columns={[
                  { header: 'Title', render: (r) => (r.title as string) || '' },
                  { header: 'Start', render: (r) => fmtDate(r.start) },
                  { header: 'End', render: (r) => fmtDate(r.end) },
                ]}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
