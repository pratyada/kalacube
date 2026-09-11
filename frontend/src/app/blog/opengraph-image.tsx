import { brandedOg, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og';

export const alt = 'The KalaCUBE Journal — stories of India’s artists';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return brandedOg({
    label: 'The Journal',
    title: 'Where handmade art meets its story',
    subtitle: 'Art Lives Here',
  });
}
