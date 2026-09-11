import { ImageResponse } from 'next/og';
import { brandedOg, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og';
import { fetchArtwork, artistDisplayName } from '@/lib/seo';

export const alt = 'Original artwork on KalaCUBE';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

const CREAM = '#faf7f2';
const YELLOW = '#f5c542';

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const art = await fetchArtwork(id);
  const title = art?.title || 'Untitled';
  const artistName = art?.artist ? artistDisplayName(art.artist) : null;
  const image: string | undefined = art?.images?.[0];

  // No artwork image → fall back to the branded card.
  if (!image) {
    return brandedOg({
      label: 'Artwork',
      title,
      subtitle: artistName ? `by ${artistName}` : 'Art Lives Here',
    });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: '#0B1F52',
          fontFamily: 'sans-serif',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          width={1200}
          height={630}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            background:
              'linear-gradient(0deg, rgba(11,31,82,0.92) 0%, rgba(11,31,82,0.35) 55%, rgba(11,31,82,0.15) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 72,
            right: 72,
            bottom: 64,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: YELLOW,
              display: 'flex',
            }}
          >
            KalaCUBE
          </div>
          <div
            style={{
              marginTop: 14,
              fontSize: title.length > 40 ? 60 : 76,
              fontWeight: 800,
              lineHeight: 1.05,
              color: CREAM,
              display: 'flex',
            }}
          >
            {title}
          </div>
          {artistName && (
            <div style={{ marginTop: 12, fontSize: 32, color: '#dfe5f5', display: 'flex' }}>
              by {artistName}
            </div>
          )}
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
