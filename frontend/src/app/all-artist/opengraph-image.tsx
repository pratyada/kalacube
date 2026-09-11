import { brandedOg, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og';

export const alt = "Meet the artists of KalaCUBE";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return brandedOg({
    label: 'The Community',
    title: 'Meet the Artists',
    subtitle: 'Art Lives Here',
  });
}
