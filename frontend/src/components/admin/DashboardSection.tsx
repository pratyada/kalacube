'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import type { AdminStats } from './types';
import { Meter, Panel, StatTile, StatusDot, ui, cx } from './console';

const DIM_LABEL: Record<string, string> = {
  handicraft: 'Handicraft',
  visual_art: 'Visual Art',
  performing_arts: 'Performing Arts',
};

const STATUS_ACCENT: Record<string, 'green' | 'amber' | 'cyan' | 'red'> = {
  submitted: 'cyan',
  approved: 'green',
  draft: 'amber',
  hidden: 'red',
};

export default function DashboardSection() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(() => {
    api
      .get('/api/admin/stats')
      .then(({ data }) => {
        setStats(data.data);
        setError(false);
        setLastSync(new Date());
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
    timer.current = setInterval(load, 15000); // live refresh
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

  const tiles = stats
    ? ([
        { label: 'Total Users', value: stats.totalUsers, accent: 'cyan' },
        { label: 'Artists', value: stats.artists, accent: 'green' },
        { label: 'Artworks', value: stats.artworks, accent: 'green' },
        { label: 'Submitted', value: stats.submitted, accent: 'cyan' },
        { label: 'New / 30d', value: stats.newSignups30d, accent: 'amber' },
        { label: 'Featured', value: stats.featured, accent: 'amber' },
        { label: 'Art Spaces', value: stats.artspaces, accent: 'cyan' },
        { label: 'Events', value: stats.events, accent: 'green' },
      ] as const)
    : [];

  const maxStatus = stats
    ? Math.max(1, ...stats.artworksByStatus.map((s) => s.count))
    : 1;
  const maxDim = stats
    ? Math.max(1, ...stats.topDimensions.map((d) => d.count))
    : 1;
  const submittedPct =
    stats && stats.artworks > 0
      ? Math.round((stats.submitted / stats.artworks) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* command header */}
      <div className={cx(ui.panel, 'flex flex-wrap items-center justify-between gap-3 px-4 py-3')}>
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.3em] text-[#c2d0dc]">
            <StatusDot color={error ? 'red' : 'green'} />
            SYSTEM TELEMETRY
          </div>
          <div className="mt-1 text-[11px] text-[#5f7285]">
            kalacube.core // live platform monitor
          </div>
        </div>
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
      </div>

      {error && (
        <div className={cx(ui.panel, 'px-4 py-3 text-sm', ui.red)}>
          ✕ telemetry feed unavailable — check API / auth token.
        </div>
      )}

      {/* metric grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.length
          ? tiles.map((t) => (
              <StatTile
                key={t.label}
                label={t.label}
                value={(t.value ?? 0).toLocaleString()}
                accent={t.accent}
              />
            ))
          : Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={cx(ui.panel, 'h-[92px] animate-pulse')} />
            ))}
      </div>

      {/* breakdowns */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel
          title="ARTWORKS // STATUS DISTRIBUTION"
          right={
            <span className="tabular-nums text-[#5f7285]">
              submitted {submittedPct}%
            </span>
          }
        >
          {stats?.artworksByStatus.length ? (
            <div className="space-y-1">
              {stats.artworksByStatus.map((s) => (
                <Meter
                  key={s.status}
                  label={(s.status || 'unknown').replace('_', ' ')}
                  value={s.count}
                  max={maxStatus}
                  accent={STATUS_ACCENT[s.status] || 'cyan'}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#5f7285]">no signal</p>
          )}
        </Panel>

        <Panel title="DIMENSIONS // TOP CHANNELS">
          {stats?.topDimensions.length ? (
            <div className="space-y-1">
              {stats.topDimensions.map((d) => (
                <Meter
                  key={d.dimension}
                  label={DIM_LABEL[d.dimension] || d.dimension || 'unknown'}
                  value={d.count}
                  max={maxDim}
                  accent="green"
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#5f7285]">no signal</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
