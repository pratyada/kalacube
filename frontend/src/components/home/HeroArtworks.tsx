'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import ArtworkMarquee from '@/components/ArtworkMarquee';

/**
 * HeroArtworks — the "living gallery": two rows of real artworks floating
 * behind the hero headline (client island; fetches once, degrades to nothing
 * if the API is unavailable so the base gradient still shows).
 */
export default function HeroArtworks() {
  const [imgs, setImgs] = useState<string[]>([]);

  useEffect(() => {
    let alive = true;
    api
      .get('/api/explore/artworks', { params: { limit: 40 } })
      .then((r) => {
        if (!alive) return;
        const items = r?.data?.data?.items ?? [];
        const urls: string[] = items
          .flatMap((w: { images?: string[] }) => w.images || [])
          .filter(Boolean);
        setImgs(urls);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!imgs.length) return null;
  const rowA = imgs.slice(0, 12);
  const rowB = imgs.slice(12, 24).length ? imgs.slice(12, 24) : rowA;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-center gap-4 opacity-[0.65]">
      <ArtworkMarquee images={rowA} duration={60} />
      <ArtworkMarquee images={rowB} reverse duration={72} />
    </div>
  );
}
