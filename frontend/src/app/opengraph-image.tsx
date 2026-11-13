import { brandedOg, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og';

export const alt = "KalaCUBE — A world of art in one cube. Art Lives Here.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return brandedOg({
    label: "A World of Art. In One Cube.",
    title: "Where the world's artists come alive",
    subtitle: 'Art Lives Here',
  });
}
