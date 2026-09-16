'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Premium multi-image gallery for an artwork.
 *
 * - Large main image with a framer-motion crossfade when swapping.
 * - Thumbnail strip (only when >1 image); horizontally scrollable on mobile.
 * - Click the main image to open a full-screen lightbox (arrow / ESC nav).
 * - Falls back to a titled placeholder when no images exist.
 */
export default function ArtworkGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const has = images && images.length > 0;
  const count = has ? images.length : 0;

  const go = (next: number) =>
    setActive((count ? (next + count) % count : 0));

  // Keyboard controls while the lightbox is open.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') go(active + 1);
      if (e.key === 'ArrowLeft') go(active - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, active, count]);

  // Lock body scroll while the lightbox is open.
  useEffect(() => {
    if (!lightbox) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightbox]);

  return (
    <div>
      {/* Main image */}
      <div
        className={`group relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl border border-line bg-cream-2 ${
          has ? 'cursor-zoom-in' : ''
        }`}
        onClick={() => has && setLightbox(true)}
      >
        {has ? (
          <AnimatePresence mode="wait">
            <motion.img
              key={images[active]}
              src={images[active]}
              alt={`${title} — view ${active + 1} of ${count}`}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute inset-0 h-full w-full object-contain p-4"
            />
          </AnimatePresence>
        ) : (
          <span className="px-6 text-center font-serif text-2xl text-indigo/70">
            {title}
          </span>
        )}

        {has && (
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-navy/70 px-3 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
            Click to zoom
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border bg-cream-2 transition ${
                i === active
                  ? 'border-indigo ring-2 ring-indigo/30'
                  : 'border-line hover:border-indigo/50'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && has && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-navy/90 p-4 backdrop-blur-sm sm:p-10"
            onClick={() => setLightbox(false)}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setLightbox(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>

            <AnimatePresence mode="wait">
              <motion.img
                key={images[active]}
                src={images[active]}
                alt={`${title} — view ${active + 1} of ${count}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              />
            </AnimatePresence>

            {count > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(active - 1);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:left-6"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(active + 1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:right-6"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                  {active + 1} / {count}
                </span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
