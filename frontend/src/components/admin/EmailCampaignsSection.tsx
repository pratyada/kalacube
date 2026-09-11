'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '@/lib/api';
import { Panel, StatTile, StatusDot, ui, cx } from './console';

/** Default/latest campaign to focus when the section first loads. */
const PREFERRED_CAMPAIGN = 'relaunch-artists-2026-09';
const REFRESH_MS = 30000;

interface CampaignRow {
  campaign: string;
  sent: number;
  opened: number;
  openRate: number;
  lastActivity: string | null;
}

interface Recipient {
  email: string;
  name: string;
  sentAt: string | null;
  opened: boolean;
  firstOpenAt: string | null;
  openCount: number;
}

interface EmailStats {
  selectedCampaign: string | null;
  totals: { sent: number; opened: number; openRate: number };
  campaigns: CampaignRow[];
  recipients: Recipient[];
}

function fmtTime(v: string | null): string {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

function pct(n: number): string {
  return `${Math.round((n || 0) * 100)}%`;
}

export default function EmailCampaignsSection() {
  const [data, setData] = useState<EmailStats | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(() => {
    const params = selected ? { campaign: selected } : {};
    api
      .get('/api/admin/email/stats', { params })
      .then(({ data: body }) => {
        const payload: EmailStats = body.data;
        setData(payload);
        setError(false);
        setLoading(false);
        setLastSync(new Date());
        // First load: focus the preferred campaign if present, else the
        // server-chosen latest, else the first available.
        if (!selected) {
          const names = payload.campaigns.map((c) => c.campaign);
          const def = names.includes(PREFERRED_CAMPAIGN)
            ? PREFERRED_CAMPAIGN
            : payload.selectedCampaign || names[0] || null;
          if (def) setSelected(def);
        }
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [selected]);

  useEffect(() => {
    load();
    timer.current = setInterval(load, REFRESH_MS);
    const clock = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
      clearInterval(clock);
    };
  }, [load]);

  const syncedAgo = lastSync
    ? Math.max(0, Math.round((Date.now() - lastSync.getTime()) / 1000))
    : null;
  void tick; // re-render the "synced Ns ago" counter each second

  const totals = data?.totals ?? { sent: 0, opened: 0, openRate: 0 };
  const notOpened = Math.max(0, totals.sent - totals.opened);

  const recipients = useMemo(() => {
    const rows = data?.recipients ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        (r.name || '').toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <div className="space-y-4">
      {/* command header */}
      <div
        className={cx(
          ui.panel,
          'flex flex-wrap items-center justify-between gap-3 px-4 py-3',
        )}
      >
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.3em] text-[#c2d0dc]">
            <StatusDot color={error ? 'red' : 'green'} />
            EMAIL CAMPAIGNS
          </div>
          <div className="mt-1 text-[11px] text-[#5f7285]">
            kalacube.comms // open-tracking telemetry
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-[11px] text-[#5f7285]">
            <div>
              STATUS:{' '}
              <span className={error ? ui.red : ui.green}>
                {error ? 'DEGRADED' : 'NOMINAL'}
              </span>
            </div>
            <div>
              SYNC:{' '}
              <span className="tabular-nums text-[#aab8c6]">
                {syncedAgo === null ? '—' : `${syncedAgo}s ago`}
              </span>
              <span className="ml-1 text-[#3ef2a1]">●</span>
            </div>
          </div>
          <button onClick={() => load()} className={ui.btn}>
            ⟳ refresh
          </button>
        </div>
      </div>

      {error && (
        <div className={cx(ui.panel, 'px-4 py-3 text-sm', ui.red)}>
          ✕ telemetry feed unavailable — check API / auth token.
        </div>
      )}

      {/* campaign selector */}
      <div
        className={cx(
          ui.panel,
          'flex flex-wrap items-center gap-3 px-4 py-3',
        )}
      >
        <span className={ui.label}>campaign</span>
        <select
          className={ui.select}
          value={selected ?? ''}
          onChange={(e) => {
            setSelected(e.target.value);
            setLoading(true);
          }}
        >
          {(data?.campaigns ?? []).length === 0 && (
            <option value="">— none —</option>
          )}
          {(data?.campaigns ?? []).map((c) => (
            <option key={c.campaign} value={c.campaign}>
              {c.campaign} · {c.sent} sent / {c.opened} opened
            </option>
          ))}
        </select>
        {data?.selectedCampaign && (
          <span className="text-[11px] text-[#5f7285]">
            active: <span className={ui.cyan}>{data.selectedCampaign}</span>
          </span>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading && !data ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={cx(ui.panel, 'h-[92px] animate-pulse')} />
          ))
        ) : (
          <>
            <StatTile
              label="Emails Sent"
              value={totals.sent.toLocaleString()}
              accent="cyan"
            />
            <StatTile
              label="Opened"
              value={totals.opened.toLocaleString()}
              accent="green"
              sub="unique recipients"
            />
            <StatTile
              label="Open Rate"
              value={pct(totals.openRate)}
              accent="amber"
            />
            <StatTile
              label="Not Opened"
              value={notOpened.toLocaleString()}
              accent="red"
            />
          </>
        )}
      </div>

      {/* recipients table */}
      <Panel
        title="RECIPIENTS // DELIVERY & OPENS"
        right={
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="filter email / name…"
            className={cx(ui.input, 'w-full !py-1 text-xs sm:w-56')}
          />
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className={cx(ui.rTable, 'border-collapse')}>
            <thead className={ui.rThead}>
              <tr>
                <th className={ui.th}>Email</th>
                <th className={ui.th}>Name</th>
                <th className={ui.th}>Sent At</th>
                <th className={ui.th}>Status</th>
                <th className={ui.th}>First Open</th>
                <th className={cx(ui.th, 'text-right')}>Opens</th>
              </tr>
            </thead>
            <tbody className={ui.rTbody}>
              {recipients.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className={cx(ui.rTdEmpty, 'py-8 text-sm text-[#5f7285]')}
                  >
                    {loading ? '▸ loading telemetry…' : 'no recipients on this campaign'}
                  </td>
                </tr>
              ) : (
                recipients.map((r) => (
                  <tr key={r.email} className={cx(ui.rowHover, ui.rTr)}>
                    <td
                      data-label="Email"
                      className={cx(ui.rTd, 'text-[#c2d0dc]')}
                    >
                      {r.email}
                    </td>
                    <td data-label="Name" className={ui.rTd}>
                      {r.name || '—'}
                    </td>
                    <td
                      data-label="Sent At"
                      className={cx(ui.rTd, 'tabular-nums')}
                    >
                      {fmtTime(r.sentAt)}
                    </td>
                    <td data-label="Status" className={ui.rTd}>
                      {r.opened ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3ef2a1]/40 bg-[#3ef2a1]/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-[#3ef2a1]">
                          <StatusDot color="green" /> opened
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1b2c3d] px-2 py-0.5 text-[10px] uppercase tracking-widest text-[#5f7285]">
                          <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[#2a3a4a]" />
                          not opened
                        </span>
                      )}
                    </td>
                    <td
                      data-label="First Open"
                      className={cx(ui.rTd, 'tabular-nums')}
                    >
                      {fmtTime(r.firstOpenAt)}
                    </td>
                    <td
                      data-label="Opens"
                      className={cx(ui.rTd, 'text-right tabular-nums')}
                    >
                      {r.openCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[#132030] px-3 py-2 text-[11px] text-[#5f7285]">
          {recipients.length} shown · sorted opened-first · auto-refresh 30s
        </div>
      </Panel>
    </div>
  );
}
