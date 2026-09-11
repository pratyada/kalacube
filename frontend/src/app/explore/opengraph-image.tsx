import { brandedOg, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og';

export const alt = 'The Gallery — browse original artworks on KalaCUBE';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return brandedOg({
    label: 'The Gallery',
    title: 'Explore the Gallery',
    subtitle: 'Handicraft · Visual Art · Performing Arts',
  });
}
