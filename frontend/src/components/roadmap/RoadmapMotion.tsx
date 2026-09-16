'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';

// SSR-safe layout effect (avoids the useLayoutEffect-on-server warning).
const useIsoLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/* ------------------------------------------------------------------ *
 * Reveal — scroll-triggered fade-up wrapper.
 * Wraps server-rendered children (they stay in the SSR HTML for SEO);
 * only the entrance transform is client-side. Reduced motion → no move.
 * ------------------------------------------------------------------ */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: 'easeOut' },
  }),
};

export function Reveal({
  children,
  delay = 0,
  className,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li';
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as];

  if (reduce) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
    >
      {children}
    </MotionTag>
  );
}

/* ------------------------------------------------------------------ *
 * Workflow — the animated order → pickup → delivery pipeline.
 * A parcel marker travels an SVG polyline drawn through the measured
 * centres of each stop; the fill line and each stop light up as it
 * passes. Horizontal on desktop, vertical on mobile (measured from the
 * DOM, so orientation just works). prefers-reduced-motion → the full
 * path is drawn, every stop lit, no motion.
 * ------------------------------------------------------------------ */

type Stop = {
  key: string;
  title: string;
  blurb: string;
  color: string; // dimension colour that the stop lights up to
  glyph: ReactNode;
};

const STROKE = '#dde3ee'; // --line

// Cycle the three dimension colours across the six stops.
const ORANGE = '#ff8a00'; // Visual Art
const TEAL = '#00a896'; // Handicraft
const MAGENTA = '#d81b60'; // Performing Art

const STOPS: Stop[] = [
  {
    key: 'order',
    title: 'Buyer orders',
    blurb: 'A collector finds the piece and checks out on KalaCUBE.',
    color: ORANGE,
    glyph: <CartGlyph />,
  },
  {
    key: 'arrange',
    title: 'We arrange the shipment',
    blurb: 'KalaCUBE books the courier and generates the prepaid label.',
    color: TEAL,
    glyph: <BoxGlyph />,
  },
  {
    key: 'pickup',
    title: 'Courier picks up',
    blurb: 'The courier collects the parcel from the artist’s door.',
    color: MAGENTA,
    glyph: <DoorGlyph />,
  },
  {
    key: 'transit',
    title: 'In transit',
    blurb: 'On its way, with live tracking every step of the journey.',
    color: ORANGE,
    glyph: <TruckGlyph />,
  },
  {
    key: 'delivered',
    title: 'Delivered',
    blurb: 'The artwork arrives safely in the buyer’s hands.',
    color: TEAL,
    glyph: <CheckGlyph />,
  },
  {
    key: 'paid',
    title: 'Artist paid',
    blurb: 'Once delivered, the artist gets paid. Just keep creating.',
    color: MAGENTA,
    glyph: <CoinGlyph />,
  },
];

const LOOP_MS = 11000; // full loop duration

export function Workflow() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const stopRefs = useRef<Array<HTMLDivElement | null>>([]);
  const pathRef = useRef<SVGPolylineElement>(null);

  const [size, setSize] = useState({ w: 0, h: 0 });
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [progress, setProgress] = useState(reduce ? 1 : 0);
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);

  // Measure stop centres relative to the wrapper (re-run on resize).
  useIsoLayoutEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const wb = wrap.getBoundingClientRect();
      const pts = stopRefs.current.map((el) => {
        const r = el!.getBoundingClientRect();
        return {
          x: r.left - wb.left + r.width / 2,
          y: r.top - wb.top + r.height / 2,
        };
      });
      setSize({ w: wb.width, h: wb.height });
      setPoints(pts);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Animate progress along the loop (skipped under reduced motion).
  useEffect(() => {
    if (reduce) {
      setProgress(1);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = ((t - start) % LOOP_MS) / LOOP_MS;
      setProgress(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  // Derive the marker position from the drawn path length.
  useEffect(() => {
    const path = pathRef.current;
    if (!path || points.length < 2) return;
    if (reduce) {
      setMarker(null);
      return;
    }
    const len = path.getTotalLength();
    const pt = path.getPointAtLength(progress * len);
    setMarker({ x: pt.x, y: pt.y });
  }, [progress, points, reduce]);

  const polyPoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // A stop is "lit" once the marker has reached (or passed) it.
  const litThreshold = (i: number) =>
    points.length > 1 ? i / (points.length - 1) : 0;

  return (
    <div
      ref={wrapRef}
      className="relative mx-auto grid max-w-5xl grid-cols-1 gap-y-10 md:grid-cols-6 md:gap-y-0 md:gap-x-2"
    >
      {/* Connecting line + travelling parcel (decorative overlay). */}
      {size.w > 0 && points.length > 1 && (
        <svg
          className="pointer-events-none absolute inset-0"
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          aria-hidden="true"
          fill="none"
        >
          {/* base track */}
          <polyline
            points={polyPoints}
            stroke={STROKE}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1 8"
          />
          {/* progress fill */}
          <polyline
            ref={pathRef}
            points={polyPoints}
            stroke="url(#kc-flow)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - progress}
          />
          <defs>
            <linearGradient id="kc-flow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={ORANGE} />
              <stop offset="50%" stopColor={TEAL} />
              <stop offset="100%" stopColor={MAGENTA} />
            </linearGradient>
          </defs>
          {/* travelling parcel */}
          {marker && (
            <g transform={`translate(${marker.x}, ${marker.y})`}>
              <circle r={16} fill="#ffffff" stroke="#0b1f52" strokeWidth={1.5} />
              <g transform="translate(-8,-8)">
                <rect
                  x={0}
                  y={0}
                  width={16}
                  height={16}
                  rx={2.5}
                  fill="#ffd200"
                  stroke="#0b1f52"
                  strokeWidth={1.2}
                />
                <path d="M0 6 H16 M8 0 V16" stroke="#0b1f52" strokeWidth={1.2} />
              </g>
            </g>
          )}
        </svg>
      )}

      {STOPS.map((s, i) => {
        const lit = reduce || progress >= litThreshold(i) - 0.001;
        return (
          <div
            key={s.key}
            ref={(el) => {
              stopRefs.current[i] = el;
            }}
            className="relative z-10 flex flex-col items-center px-1 text-center md:pt-2"
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 bg-cream transition-all duration-500"
              style={{
                borderColor: lit ? s.color : STROKE,
                color: lit ? s.color : '#93a3cf',
                boxShadow: lit ? `0 0 0 6px ${hexA(s.color, 0.12)}` : 'none',
                transform: lit ? 'scale(1)' : 'scale(0.94)',
              }}
            >
              {s.glyph}
            </div>
            <p
              className="mt-4 font-serif text-base leading-snug text-navy transition-colors duration-500"
              style={{ color: lit ? '#0b1f52' : '#65708a' }}
            >
              {s.title}
            </p>
            <p className="mt-1.5 max-w-[15rem] text-[13px] leading-relaxed text-muted">
              {s.blurb}
            </p>
          </div>
        );
      })}
    </div>
  );
}

// Translate a hex colour to an rgba() string with the given alpha.
function hexA(hex: string, a: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/* --- Minimal inline glyphs (stroke = currentColor) --------------- */
function base(children: ReactNode) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
function CartGlyph() {
  return base(
    <>
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M2 3h2l2.4 12.2a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L21 7H5" />
    </>,
  );
}
function BoxGlyph() {
  return base(
    <>
      <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </>,
  );
}
function DoorGlyph() {
  return base(
    <>
      <path d="M3 21h18M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17" />
      <path d="M14 12h.01" />
    </>,
  );
}
function TruckGlyph() {
  return base(
    <>
      <path d="M1 6h13v10H1zM14 9h4l3 3v4h-7" />
      <circle cx="6" cy="18" r="1.5" />
      <circle cx="17" cy="18" r="1.5" />
    </>,
  );
}
function CheckGlyph() {
  return base(
    <>
      <path d="M21 8 12 3 3 8v8l9 5 9-5z" opacity="0.35" />
      <path d="m8 12 3 3 5-6" />
    </>,
  );
}
function CoinGlyph() {
  return base(
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v8M9.5 9.5h3a1.75 1.75 0 0 1 0 3.5h-3M9.5 12.75h4" />
    </>,
  );
}
