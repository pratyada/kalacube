'use client';

import { useState } from 'react';

const URL = 'https://jlps.kalacube.com';
const TEXT =
  'JLPS kids are making & selling their own crafts! ❄️ Winter Craft Market, Dec 10–31 — jewellery, ornaments, treats, art, stickers, toys & gifts. 100% goes to the young makers.';

export default function ShareButton({ className = '' }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'JLPS Winter Craft Market', text: TEXT, url: URL });
        return;
      }
      await navigator.clipboard.writeText(`${TEXT} ${URL}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* user cancelled the share sheet — nothing to do */
    }
  }

  return (
    <button type="button" onClick={share} className={className}>
      {copied ? '✅ Link copied!' : '📣 Tell a friend'}
    </button>
  );
}
