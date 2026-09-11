'use client';

import React from 'react';

/** Shared "mission control" console design system for the admin panel. */

export const cx = (...a: (string | false | null | undefined)[]) =>
  a.filter(Boolean).join(' ');

// Class tokens — dark NOC / terminal aesthetic. Import and reuse everywhere so
// every admin section reads as one system.
export const ui = {
  screen: 'bg-[#05080c] text-[#c2d0dc] font-mono',
  panel: 'rounded-md border border-[#132030] bg-[#0a1119]',
  head:
    'flex flex-wrap items-center justify-between gap-2 border-b border-[#132030] px-3 py-2 ' +
    'text-[11px] uppercase tracking-[0.25em] text-[#4f6577]',
  input:
    'w-full rounded border border-[#1b2c3d] bg-[#0a1119] px-3 py-2 text-sm ' +
    'text-[#c2d0dc] placeholder:text-[#3d5266] outline-none ' +
    'focus:border-[#3ef2a1] focus:ring-1 focus:ring-[#3ef2a1]/30',
  select:
    'rounded border border-[#1b2c3d] bg-[#0a1119] px-2 py-1 text-xs ' +
    'text-[#c2d0dc] outline-none focus:border-[#3ef2a1]',
  btn:
    'rounded border border-[#1b2c3d] px-3 py-1.5 text-xs text-[#8fa4b6] ' +
    'transition hover:border-[#3ef2a1] hover:text-[#3ef2a1]',
  btnPrimary:
    'rounded border border-[#3ef2a1]/50 bg-[#3ef2a1]/10 px-3 py-1.5 text-xs ' +
    'font-medium text-[#3ef2a1] transition hover:bg-[#3ef2a1]/20',
  btnDanger:
    'rounded border border-[#3a1e22] px-3 py-1.5 text-xs text-[#ff6b6b] ' +
    'transition hover:border-[#ff6b6b] hover:bg-[#ff6b6b]/10',
  th: 'px-3 py-2 text-left text-[10px] font-normal uppercase tracking-widest text-[#4f6577] border-b border-[#132030]',
  td: 'px-3 py-2 text-sm text-[#aab8c6] border-b border-[#0f1a26]',
  rowHover: 'transition hover:bg-[#0e1926]',
  // Responsive "reflow" table: at `sm`+ it is a normal <table>; below `sm`
  // every row collapses into a stacked label:value card so phones never need
  // horizontal scrolling. Pair `rTd` with a `data-label` on each <td> — the
  // label is drawn from that attribute via a ::before pseudo-element. Desktop
  // (sm+) is completely unaffected by these tokens.
  rTable: 'w-full max-sm:block',
  rThead: 'max-sm:hidden',
  rTbody: 'max-sm:block',
  rTr:
    'max-sm:mb-3 max-sm:block max-sm:rounded-md max-sm:border ' +
    'max-sm:border-[#132030] max-sm:bg-[#0a1119] max-sm:p-1 last:max-sm:mb-0',
  rTd:
    'px-3 py-2 text-sm text-[#aab8c6] border-b border-[#0f1a26] ' +
    'max-sm:flex max-sm:items-center max-sm:justify-between max-sm:gap-4 ' +
    'max-sm:border-b-0 max-sm:px-3 max-sm:py-2 max-sm:text-right ' +
    'max-sm:[overflow-wrap:anywhere] ' +
    'max-sm:before:content-[attr(data-label)] max-sm:before:shrink-0 ' +
    'max-sm:before:text-left max-sm:before:text-[10px] max-sm:before:font-normal ' +
    'max-sm:before:uppercase max-sm:before:tracking-widest max-sm:before:text-[#4f6577] ' +
    'max-sm:not-last:border-b max-sm:not-last:border-[#0f1a26]',
  rTdEmpty: 'px-3 py-6 text-center max-sm:block',
  green: 'text-[#3ef2a1]',
  amber: 'text-[#f5c451]',
  cyan: 'text-[#5cc8ff]',
  red: 'text-[#ff6b6b]',
  mut: 'text-[#5f7285]',
  label: 'text-[10px] uppercase tracking-[0.2em] text-[#4f6577]',
};

const DOT: Record<string, string> = {
  green: '#3ef2a1',
  amber: '#f5c451',
  red: '#ff6b6b',
  cyan: '#5cc8ff',
};

export function StatusDot({ color = 'green' }: { color?: keyof typeof DOT }) {
  const c = DOT[color] ?? DOT.green;
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: c, boxShadow: `0 0 6px ${c}` }}
    />
  );
}

export function Panel({
  title,
  right,
  children,
  className,
  bodyClassName,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cx(ui.panel, className)}>
      <div className={ui.head}>
        <span className="flex items-center gap-2">
          <span className="text-[#3ef2a1]">▸</span>
          {title}
        </span>
        {right}
      </div>
      <div className={cx('p-3', bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatTile({
  label,
  value,
  accent = 'green',
  sub,
}: {
  label: string;
  value: React.ReactNode;
  accent?: keyof typeof DOT;
  sub?: React.ReactNode;
}) {
  const c = DOT[accent] ?? DOT.green;
  return (
    <div className={cx(ui.panel, 'p-3')}>
      <div className="flex items-center justify-between">
        <span className={ui.label}>{label}</span>
        <StatusDot color={accent} />
      </div>
      <div
        className="mt-2 text-3xl font-semibold tabular-nums"
        style={{ color: c }}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-[#5f7285]">{sub}</div>}
    </div>
  );
}

/** Horizontal labelled meter bar used for status/dimension breakdowns. */
export function Meter({
  label,
  value,
  max,
  accent = 'cyan',
}: {
  label: string;
  value: number;
  max: number;
  accent?: keyof typeof DOT;
}) {
  const c = DOT[accent] ?? DOT.cyan;
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#aab8c6]">{label}</span>
        <span className="tabular-nums text-[#5f7285]">{value}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-sm bg-[#0f1a26]">
        <div
          className="h-full rounded-sm"
          style={{ width: `${pct}%`, background: c, boxShadow: `0 0 8px ${c}66` }}
        />
      </div>
    </div>
  );
}
