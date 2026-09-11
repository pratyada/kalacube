import { brandedOg, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og';

export const alt = "KalaCUBE — A home for India's artists. Art Lives Here.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return brandedOg({
    label: "A Home for India's Artists",
    title: "Where India's artists come alive",
    subtitle: 'Art Lives Here',
  });
}
