'use client';

import { useState } from 'react';

/** Public shareable artist page always lives on the production domain. */
export function artistPageUrl(username: string) {
  return `https://kalacube.com/artist/${username}`;
}

/**
 * The "share your page" block reused on the onboarding success screen and the
 * activation dashboard: the live URL + Copy link + Share on WhatsApp.
 * Marks the page as shared (client-side flag) so the dashboard checklist can
 * reflect it — there is no server-side share tracking.
 */
export function markShared(username: string) {
  try {
    localStorage.setItem(`kalacube:shared:${username}`, '1');
  } catch {
    /* ignore */
  }
}

export function hasShared(username: string) {
  try {
    return localStorage.getItem(`kalacube:shared:${username}`) === '1';
  } catch {
    return false;
  }
}

export default function ShareArtistPage({
  username,
  onShared,
  variant = 'light',
}: {
  username: string;
  onShared?: () => void;
  variant?: 'light' | 'navy';
}) {
  const [copied, setCopied] = useState(false);
  const url = artistPageUrl(username);
  const waText = encodeURIComponent(
    `Check out my art portfolio on KalaCUBE 🎨 ${url}`,
  );
  const waHref = `https://wa.me/?text=${waText}`;

  const onNavy = variant === 'navy';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard blocked — still count the intent */
    }
    setCopied(true);
    markShared(username);
    onShared?.();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm ${
          onNavy
            ? 'border-white/20 bg-white/10 text-white'
            : 'border-line bg-cream text-navy'
        }`}
      >
        <span className="truncate font-medium" title={url}>
          kalacube.com/artist/{username}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={copy}
          aria-live="polite"
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            onNavy
              ? 'bg-yellow text-navy hover:bg-yellow-deep'
              : 'bg-navy text-white hover:bg-indigo'
          }`}
        >
          {copied ? 'Link copied ✓' : 'Copy link'}
        </button>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            markShared(username);
            onShared?.();
          }}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            onNavy
              ? 'border border-white/25 text-white hover:bg-white/10'
              : 'border border-line text-navy hover:bg-cream-2'
          }`}
        >
          <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-current">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.9c0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.9-4.45 9.9-9.9C21.95 6.45 17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.42 1.32-1.95 1.36-.5.05-.98.23-3.3-.69-2.78-1.1-4.55-3.94-4.69-4.13-.14-.19-1.13-1.5-1.13-2.86 0-1.36.71-2.03.97-2.31.24-.26.53-.32.71-.32.18 0 .35.002.51.01.16.007.38-.06.6.46.24.55.79 1.9.86 2.03.07.14.12.3.02.49-.09.19-.14.3-.28.46-.14.16-.3.36-.42.48-.14.14-.29.29-.12.57.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.16-.19.69-.8.87-1.08.18-.28.36-.23.6-.14.24.09 1.55.73 1.82.86.27.14.45.21.51.32.06.11.06.64-.18 1.32Z" />
          </svg>
          Share on WhatsApp
        </a>
      </div>
    </div>
  );
}
