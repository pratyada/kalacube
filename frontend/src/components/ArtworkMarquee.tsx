'use client';

import { motion } from 'framer-motion';

/** Seamless horizontal auto-scrolling strip of artwork images. */
export default function ArtworkMarquee({
  images,
  reverse = false,
  duration = 50,
  className = '',
}: {
  images: string[];
  reverse?: boolean;
  duration?: number;
  className?: string;
}) {
  if (!images.length) return null;
  const row = [...images, ...images]; // duplicate for a seamless loop
  return (
    <div className={`flex overflow-hidden ${className}`}>
      <motion.div
        className="flex flex-none gap-4 pr-4"
        animate={{ x: reverse ? ['-50%', '0%'] : ['0%', '-50%'] }}
        transition={{ duration, ease: 'linear', repeat: Infinity }}
      >
        {row.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            loading="lazy"
            className="h-56 w-44 flex-none rounded-2xl object-cover shadow-lg md:h-72 md:w-56"
          />
        ))}
      </motion.div>
    </div>
  );
}
