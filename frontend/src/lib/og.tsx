import { ImageResponse } from 'next/og';

// Shared 1200x630 branded Open Graph card. Satori only supports flexbox and a
// subset of CSS, so this deliberately avoids grid and exotic properties.
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

const NAVY = '#0B1F52';
const NAVY_2 = '#132a6b';
const CREAM = '#faf7f2';
const YELLOW = '#f5c542';

export function brandedOg(opts: {
  label?: string;
  title: string;
  subtitle?: string;
}) {
  const { label = 'KalaCUBE', title, subtitle = 'Art Lives Here' } = opts;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: `linear-gradient(135deg, ${NAVY} 0%, ${NAVY_2} 100%)`,
          padding: '72px 80px',
          color: CREAM,
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: CREAM,
            }}
          >
            KalaCUBE
          </div>
          <div
            style={{
              marginLeft: 20,
              height: 28,
              width: 3,
              background: YELLOW,
              display: 'flex',
            }}
          />
          <div style={{ marginLeft: 20, fontSize: 24, color: '#c7d0ea' }}>
            {label}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: title.length > 40 ? 68 : 84,
              fontWeight: 800,
              lineHeight: 1.05,
              color: CREAM,
              display: 'flex',
            }}
          >
            {title}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              height: 6,
              width: 56,
              background: YELLOW,
              borderRadius: 3,
              display: 'flex',
            }}
          />
          <div style={{ marginLeft: 20, fontSize: 30, color: YELLOW, fontWeight: 600 }}>
            {subtitle}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
