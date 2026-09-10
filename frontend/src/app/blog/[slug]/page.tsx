import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchArtist, museeArtistUrl, MUSEE, SITE } from '@/lib/blog';

export const dynamic = 'force-dynamic';

const DIMENSION_LABEL: Record<string, string> = {
  handicraft: 'Handicraft',
  visual_art: 'Visual Art',
  performing_arts: 'Performing Arts',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await fetchArtist(slug);
  if (!data) return { title: 'Artist not found — KalaCUBE Journal' };
  const { user, profile, artworks } = data;
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
  const desc =
    profile?.statement?.slice(0, 155) ||
    `Explore the portfolio of ${name} on KalaCUBE — ${artworks.length} original works across ${(profile?.artDimensions || []).map((d: string) => DIMENSION_LABEL[d] || d).join(', ') || 'art'}.`;
  const image = user.avatar?.url || artworks.find((a: any) => a.images?.[0])?.images?.[0];
  return {
    title: `${name} — Artist Portfolio | KalaCUBE`,
    description: desc,
    alternates: { canonical: `${SITE}/blog/${user.username}` },
    openGraph: {
      title: `${name} — Artist Portfolio | KalaCUBE`,
      description: desc,
      url: `${SITE}/blog/${user.username}`,
      type: 'profile',
      images: image ? [{ url: image }] : [],
    },
  };
}

export default async function ArtistBlog({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchArtist(slug);
  if (!data) notFound();

  const { user, profile, artworks } = data;
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
  const socials: Record<string, string> = user.socialLinks || {};
  const sameAs = Object.values(socials).filter(Boolean);
  const museeUrl = museeArtistUrl(user.firstName, user.lastName, user.username);
  const dims = (profile?.artDimensions || []).map((d: string) => DIMENSION_LABEL[d] || d);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: `${SITE}/blog/${user.username}`,
    ...(user.avatar?.url ? { image: user.avatar.url } : {}),
    ...(profile?.statement ? { description: profile.statement } : {}),
    jobTitle: 'Artist',
    sameAs: [...sameAs, museeUrl],
    knowsAbout: dims,
    worksFor: { '@type': 'Organization', name: 'Musée Art Café', url: MUSEE },
  };

  return (
    <main className="min-h-screen bg-[#faf8f5] text-neutral-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="mx-auto max-w-4xl px-6 py-14">
        <nav className="text-sm text-neutral-500">
          <Link href="/blog" className="hover:text-[#a06f1e]">Journal</Link> / {name}
        </nav>

        <header className="mt-6 flex items-center gap-6">
          {user.avatar?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar.url} alt={name} className="h-24 w-24 rounded-full object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#cda45c]/20 font-serif text-3xl text-[#a06f1e]">
              {(user.firstName?.[0] || user.username?.[0] || 'A').toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-serif text-4xl md:text-5xl">{name}</h1>
            <p className="mt-1 text-neutral-500">
              {[user.location?.city, user.location?.country].filter(Boolean).join(', ') || 'India'}
              {dims.length > 0 && ` · ${dims.join(', ')}`}
            </p>
          </div>
        </header>

        {profile?.headline && (
          <p className="mt-8 font-serif text-2xl italic text-[#a06f1e]">“{profile.headline}”</p>
        )}
        {profile?.statement && (
          <p className="mt-5 text-lg leading-relaxed text-neutral-700">{profile.statement}</p>
        )}

        {/* Backlink — editorial feature */}
        <div className="mt-8 rounded-xl border border-[#cda45c]/30 bg-[#f3efe9] p-5 text-sm text-neutral-700">
          Read the editorial feature on {name} at the{' '}
          <a href={museeUrl} className="font-medium text-[#a06f1e] underline" target="_blank" rel="noopener">
            Musée Living Journal
          </a>
          . {name} has exhibited at{' '}
          <a href={MUSEE} className="font-medium text-[#a06f1e] underline" target="_blank" rel="noopener">
            Musée Art Café
          </a>
          , Dehradun — where KalaCUBE began.
        </div>

        {/* Portfolio */}
        <h2 className="mt-14 font-serif text-3xl">Selected Works ({artworks.length})</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {artworks.map((w: any) => (
            <Link key={w._id} href={`/art-work/${w._id}`}
              className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:border-[#cda45c]/50">
              <div className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-neutral-100">
                {w.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.images[0]} alt={w.title || 'Artwork'} className="h-full w-full object-cover" />
                ) : (
                  <span className="p-3 text-center font-serif text-sm text-[#a06f1e]/70">{w.title || 'Untitled'}</span>
                )}
              </div>
              <div className="p-3">
                <h3 className="truncate text-sm">{w.title || 'Untitled'}</h3>
                {w.cost ? <p className="text-xs text-[#a06f1e]">{w.currency || 'INR'} {w.cost.toLocaleString()}</p> : null}
              </div>
            </Link>
          ))}
        </div>

        {/* Socials + closing backlink */}
        <div className="mt-12 border-t border-neutral-200 pt-6 text-sm text-neutral-600">
          {sameAs.length > 0 && (
            <p>Follow {name}: {Object.entries(socials).filter(([, v]) => v).map(([k, v]) => (
              <a key={k} href={v as string} target="_blank" rel="noopener" className="mr-3 text-[#a06f1e] hover:underline">{k}</a>
            ))}</p>
          )}
          <p className="mt-4">
            KalaCUBE is a home for India’s artists, born on the walls of{' '}
            <a href={MUSEE} className="text-[#a06f1e] underline" target="_blank" rel="noopener">Musée Art Café</a>.
            View {name}’s live profile on{' '}
            <Link href={`/artist/${user.username}`} className="text-[#a06f1e] underline">KalaCUBE</Link>.
          </p>
        </div>
      </article>
    </main>
  );
}
