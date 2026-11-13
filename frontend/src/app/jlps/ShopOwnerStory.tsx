/**
 * "Be a real shop owner" — illustrated explainer for the JLPS page:
 *  1. A SAMPLE kid shop profile (what a young maker's page looks like),
 *     with their Young Entrepreneur stamp.
 *  2. The journey: kid updates inventory + photo → buyer buys online →
 *     KalaCUBE picks up → delivered → kid earns 100%.
 *  3. The entrepreneur stamp passport kids fill as they grow their shop.
 * Pure illustration (emoji + CSS/SVG) — no real child data or photos.
 */

const INVENTORY = [
  { emoji: '💍', name: 'Galaxy Bead Bracelet', price: '$8', stock: '3 left', tone: '#ffe3f0' },
  { emoji: '🎄', name: 'Snowy Clay Ornament', price: '$6', stock: '5 left', tone: '#dff7ec' },
  { emoji: '🍪', name: 'Gingerbread Cookies (6)', price: '$10', stock: '2 left', tone: '#fff1d6' },
  { emoji: '⭐', name: 'Glitter Star Stickers', price: '$4', stock: 'Sold out!', tone: '#fff7c2' },
];

const JOURNEY = [
  {
    who: 'Kid',
    whoColor: '#ff8a00',
    scene: ['🧒', '📸', '🎨'],
    title: 'Make it & snap it',
    text: 'Kids only do two things: add a photo of the craft and say how many they have.',
  },
  {
    who: 'Buyer',
    whoColor: '#29b6f6',
    scene: ['📱', '🛒', '💳'],
    title: 'Neighbours buy online',
    text: 'Shoppers order on the market page and pay safely by card. Kids never meet them.',
  },
  {
    who: 'KalaCUBE',
    whoColor: '#00a896',
    scene: ['🏠', '🚐', '📦'],
    title: 'We pick it up',
    text: 'Our team collects the craft from your family at a time that works for you.',
  },
  {
    who: 'KalaCUBE',
    whoColor: '#00a896',
    scene: ['🚐', '🏙️', '🚪'],
    title: 'We deliver it',
    text: 'Hand-delivered to the buyer’s door in CityPlace & downtown Toronto.',
  },
  {
    who: 'Kid',
    whoColor: '#d81b60',
    scene: ['🐷', '💰', '🏅'],
    title: 'Kid gets paid',
    text: '100% of the money goes to the young maker, plus a new entrepreneur stamp!',
  },
];

const STAMPS = [
  { emoji: '🛍️', label: 'Shop Opened', got: true, color: '#7c4dff' },
  { emoji: '📸', label: 'First Listing', got: true, color: '#29b6f6' },
  { emoji: '🎉', label: 'First Sale', got: true, color: '#ff8a00' },
  { emoji: '🔥', label: '5 Sales', got: true, color: '#d81b60' },
  { emoji: '⭐', label: 'Sold Out!', got: false, color: '#e6bd00' },
  { emoji: '💛', label: '10 Happy Buyers', got: false, color: '#00a896' },
];

/** Round rubber-stamp badge (SVG text on a circle). */
function EntrepreneurStamp({ size = 150 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className="jlps-stamp"
      role="img"
      aria-label="JLPS Young Entrepreneur 2026 stamp"
    >
      <defs>
        <path id="stamp-top" d="M 34,100 A 66,66 0 0 1 166,100" />
        <path id="stamp-bottom" d="M 30,100 A 70,70 0 0 0 170,100" />
      </defs>
      <circle cx="100" cy="100" r="94" fill="#fffaf0" stroke="#d81b60" strokeWidth="6" />
      <circle cx="100" cy="100" r="82" fill="none" stroke="#d81b60" strokeWidth="2" strokeDasharray="4 5" />
      <text fill="#d81b60" fontSize="14.5" fontWeight="700" letterSpacing="1.2">
        <textPath href="#stamp-top" startOffset="50%" textAnchor="middle">
          YOUNG ENTREPRENEUR
        </textPath>
      </text>
      <text fill="#d81b60" fontSize="15" fontWeight="700" letterSpacing="2.5">
        <textPath href="#stamp-bottom" startOffset="50%" textAnchor="middle">
          ★ JLPS · 2026 ★
        </textPath>
      </text>
      <text x="100" y="120" textAnchor="middle" fontSize="54">
        🏅
      </text>
    </svg>
  );
}

export default function ShopOwnerStory() {
  return (
    <>
      {/* ============ SAMPLE KID SHOP ============ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--berry)]">
            For young makers
          </p>
          <h2 className="mt-2 text-4xl font-bold sm:text-5xl">Be a real shop owner! 🌟</h2>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-[#3b4a6b]">
            Every maker gets their own shop page. Here&apos;s a sample of what yours could look
            like.
          </p>
        </div>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          {/* The sample profile, drawn as a big friendly card */}
          <div className="relative">
            <span className="jlps-chip absolute -top-4 left-6 z-10 bg-[var(--ink)] text-white">
              ✏️ Sample shop
            </span>
            <div className="jlps-card overflow-hidden">
              {/* Cover */}
              <div
                className="relative h-28 sm:h-36"
                style={{
                  background:
                    'radial-gradient(circle at 20% 30%, #ffd20055, transparent 40%), radial-gradient(circle at 80% 60%, #ff6fae55, transparent 45%), linear-gradient(120deg, #7c4dff, #29b6f6)',
                }}
                aria-hidden
              >
                <span className="absolute left-[8%] top-3 text-2xl">❄️</span>
                <span className="absolute left-[30%] top-10 text-xl">✨</span>
                <span className="absolute right-[34%] top-4 text-2xl">❅</span>
                <span className="absolute right-[10%] top-12 text-xl">⭐</span>
              </div>

              <div className="px-5 pb-6 sm:px-8">
                <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
                  <div className="flex items-end gap-4">
                    <div
                      className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white text-5xl shadow-lg"
                      style={{ background: '#fff1d6' }}
                      aria-hidden
                    >
                      🦄
                    </div>
                    <div className="pb-1">
                      <p className="text-2xl font-bold leading-tight sm:text-3xl">
                        Maya&apos;s Sparkle Studio
                      </p>
                      <p className="text-base text-[#3b4a6b]">
                        by <b>Maya R.</b> · Grade 4 · JLPS
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <EntrepreneurStamp size={118} />
                  </div>
                </div>

                <p className="mt-4 max-w-xl text-base text-[#3b4a6b]">
                  “I make sparkly bracelets and ornaments for my friends and family. My dream is to
                  save up for a big art kit!” 🎨
                </p>

                {/* Shop stats */}
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  {[
                    ['🧺', '4', 'items'],
                    ['🎉', '7', 'sold'],
                    ['🐷', '$58', 'earned'],
                  ].map(([e, n, l]) => (
                    <div key={l} className="rounded-2xl bg-[#f3ecff] px-2 py-3">
                      <p className="text-2xl font-bold">
                        <span aria-hidden>{e}</span> {n}
                      </p>
                      <p className="text-sm text-[#3b4a6b]">{l}</p>
                    </div>
                  ))}
                </div>

                {/* Inventory */}
                <div className="mt-6 flex items-center justify-between gap-3">
                  <p className="text-lg font-bold">My shop shelf</p>
                  <div className="flex gap-2">
                    <span className="jlps-chip bg-[var(--sun)] text-[var(--ink)]">+ Add a craft</span>
                    <span className="jlps-chip hidden bg-white text-[var(--ink)] ring-2 ring-[var(--ink)] sm:inline-flex">
                      📸 Update photo
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {INVENTORY.map((it) => {
                    const soldOut = it.stock === 'Sold out!';
                    return (
                      <div key={it.name} className="overflow-hidden rounded-2xl border-[3px] border-[var(--ink)] bg-white">
                        <div
                          className="relative flex aspect-square items-center justify-center text-5xl"
                          style={{ background: it.tone }}
                          aria-hidden
                        >
                          {it.emoji}
                          {soldOut && (
                            <span className="absolute inset-x-2 top-1/2 -translate-y-1/2 -rotate-12 rounded-md border-2 border-[var(--berry)] bg-white/90 py-0.5 text-center text-sm font-bold text-[var(--berry)]">
                              SOLD OUT!
                            </span>
                          )}
                        </div>
                        <div className="p-2.5">
                          <p className="truncate text-sm font-bold">{it.name}</p>
                          <div className="mt-1 flex items-center justify-between text-sm">
                            <span className="font-bold text-[var(--berry)]">{it.price}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                soldOut ? 'bg-[var(--berry)] text-white' : 'bg-[#dff7ec] text-[#087f6a]'
                              }`}
                            >
                              {it.stock}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* What the kid actually does */}
          <div className="space-y-5">
            <div className="flex justify-center sm:hidden">
              <EntrepreneurStamp size={130} />
            </div>
            <div className="jlps-card p-6" style={{ background: '#fff7c2' }}>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--berry)]">
                Your only two jobs
              </p>
              <ul className="mt-3 space-y-4 text-lg">
                <li className="flex gap-3">
                  <span className="text-3xl" aria-hidden>📸</span>
                  <span>
                    <b>Snap a photo</b> of each craft (the craft, not your face!).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-3xl" aria-hidden>🔢</span>
                  <span>
                    <b>Update your inventory</b>: how many you made and the price.
                  </span>
                </li>
              </ul>
              <p className="mt-4 rounded-2xl bg-white p-3 text-base">
                🛡️ Everything else (orders, payments, pickup and delivery) is handled by the
                KalaCUBE team, with a grown-up helping you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ JOURNEY ============ */}
      <section className="bg-[#eaf4ff] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--mint)]">
              How a sale works
            </p>
            <h2 className="mt-2 text-4xl font-bold sm:text-5xl">From your table to their door 🚐</h2>
          </div>

          <ol className="jlps-journey relative mt-12 grid gap-6 md:grid-cols-5 md:gap-4">
            {JOURNEY.map((j, i) => (
              <li key={j.title} className="relative">
                <div className="jlps-card jlps-pop flex h-full flex-col items-center p-5 text-center">
                  <span
                    className="jlps-chip -mt-9 mb-3 border-[3px] border-[var(--ink)] text-white"
                    style={{ background: j.whoColor }}
                  >
                    {i + 1} · {j.who}
                  </span>
                  <div
                    className="flex w-full items-center justify-center gap-1 rounded-2xl py-4 text-4xl"
                    style={{ background: `${j.whoColor}22` }}
                    aria-hidden
                  >
                    {j.scene.map((e, k) => (
                      <span key={k} className={k === 1 ? 'jlps-bob text-5xl' : ''}>
                        {e}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-4 text-xl font-bold" style={{ color: j.whoColor }}>
                    {j.title}
                  </h3>
                  <p className="mt-1 text-base text-[#3b4a6b]">{j.text}</p>
                </div>
                {i < JOURNEY.length - 1 && (
                  <span
                    className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 text-2xl md:-right-4 md:bottom-auto md:left-auto md:top-1/2 md:translate-x-0 md:-translate-y-1/2"
                    aria-hidden
                  >
                    <span className="md:hidden">⬇️</span>
                    <span className="hidden md:inline">➡️</span>
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============ STAMP PASSPORT ============ */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="jlps-card relative overflow-hidden p-6 sm:p-10" style={{ background: '#fffaf0' }}>
          <div className="grid items-center gap-8 md:grid-cols-[auto_minmax(0,1fr)]">
            <div className="flex justify-center">
              <EntrepreneurStamp size={170} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--grape)]">
                Entrepreneur passport
              </p>
              <h2 className="mt-1 text-3xl font-bold sm:text-4xl">Collect your shop stamps 🏅</h2>
              <p className="mt-2 text-lg text-[#3b4a6b]">
                Every milestone earns a stamp on your shop page, so you can show everyone your
                journey as a young entrepreneur. (Sample passport shown.)
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4 sm:grid-cols-6">
            {STAMPS.map((s, i) => (
              <div key={s.label} className="flex flex-col items-center text-center">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-dashed text-3xl ${
                    s.got ? '' : 'opacity-35 grayscale'
                  }`}
                  style={{
                    borderColor: s.color,
                    background: s.got ? `${s.color}22` : '#ffffff',
                    rotate: `${[-8, 6, -4, 9, -6, 4][i]}deg`,
                  }}
                >
                  {s.got ? s.emoji : '🔒'}
                </div>
                <p className="mt-2 text-sm font-bold leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
