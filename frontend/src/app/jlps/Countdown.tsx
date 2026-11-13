'use client';

import { useSyncExternalStore } from 'react';

// Shop opens Thu Dec 10, 2026, 00:00 Toronto time (EST, UTC−5).
const OPENS_AT = Date.parse('2026-12-10T05:00:00Z');
// Last day Dec 31, 2026 — closes at midnight Toronto time.
const CLOSES_AT = Date.parse('2027-01-01T05:00:00Z');

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    mins: Math.floor((s % 3600) / 60),
    secs: s % 60,
  };
}

// A 1-second clock as an external store. Snapshot is floored to the second so
// it stays stable between ticks; the server snapshot is null (placeholders).
function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}
const getNow = () => Math.floor(Date.now() / 1000) * 1000;
const getServerNow = () => null;

export default function Countdown() {
  const now = useSyncExternalStore<number | null>(subscribe, getNow, getServerNow);

  if (now !== null && now >= CLOSES_AT) {
    return (
      <p className="text-xl font-semibold">
        ❄️ That&apos;s a wrap! Thank you for supporting our young makers.
      </p>
    );
  }

  if (now !== null && now >= OPENS_AT) {
    return (
      <p className="text-2xl font-bold">
        🎉 The market is <span className="text-[var(--sun)]">OPEN</span>! Happy shopping!
      </p>
    );
  }

  const p = now === null ? null : parts(OPENS_AT - now);
  const cells: [string, number | undefined][] = [
    ['days', p?.days],
    ['hours', p?.hours],
    ['mins', p?.mins],
    ['secs', p?.secs],
  ];

  return (
    <div>
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
        The shop opens in
      </p>
      <div className="flex justify-center gap-2 sm:gap-3" aria-live="off">
        {cells.map(([label, v]) => (
          <div key={label} className="jlps-tick text-center">
            <div className="text-3xl font-bold tabular-nums sm:text-4xl">
              {v === undefined ? '–' : String(v).padStart(2, '0')}
            </div>
            <div className="text-xs font-medium uppercase tracking-wider text-white/75">
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
