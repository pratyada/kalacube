import { brandedOg, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og';
import { fetchArtist, artistDisplayName, DIMENSION_LABEL } from '@/lib/seo';

export const alt = 'Artist portfolio on KalaCUBE';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data = await fetchArtist(username);
  if (!data) {
    return brandedOg({ label: 'Artist', title: 'KalaCUBE', subtitle: 'Art Lives Here' });
  }
  const { user, profile } = data;
  const name = artistDisplayName(user);
  const dims: string[] = (profile?.artDimensions || []).map(
    (d: string) => DIMENSION_LABEL[d] || d,
  );
  return brandedOg({
    label: 'Artist Portfolio',
    title: name,
    subtitle: dims.length ? dims.join(' · ') : 'Art Lives Here',
  });
}
