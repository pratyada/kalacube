# KalaCUBE — SEO & AEO Keyword Map

India-first target-keyword map guiding on-page work. Each cluster maps head terms,
secondary terms, and long-tail / AI-answer-engine (AEO/GEO) question phrases to the
page that should **own** them. Kept realistic — intent-led, not volume-chasing. No
keyword stuffing: every term below must read naturally in human-first copy.

Brand frame: *"A Home for India's Artists — Art Lives Here."* Three dimensions —
**Handicraft · Visual Art · Performing Arts.**

---

## 1. Home — `/`
**Role:** brand + category entry point; "artists / creators / artisans in the AI age".

| Type | Terms |
|---|---|
| Head | home for India's artists, Indian artists platform, discover Indian art |
| Secondary | art creators India, Indian artisans, handmade art India, original Indian art, showcase art online |
| Long-tail / AEO | "what should artists do in the AI age", "how can artists survive the AI world", "human-made art vs AI art", "where can Indian artists showcase their work online", "why buy original human-made art" |

## 2. Explore the Gallery — `/explore`
**Role:** transactional discovery — buy/discover original Indian art.

| Type | Terms |
|---|---|
| Head | buy original Indian art online, original art India, art gallery online India |
| Secondary | discover original artwork, shop handmade art India, browse Indian paintings |
| Long-tail / AEO | "where to buy original Indian art online", "where can I buy handmade art from Indian artists", "buy Madhubani / Pichwai / Warli art online" |

## 3. Artists — `/all-artist`
**Role:** artist discovery + "artist portfolio India".

| Type | Terms |
|---|---|
| Head | Indian artists, discover Indian artists, artist portfolio India |
| Secondary | Indian painters, sculptors, photographers, artisans directory, hire Indian artists |
| Long-tail / AEO | "how to build an artist portfolio in India", "how do I get discovered as an artist in India", "best platform for Indian artist portfolios", "book / hire performing artists in India" |

## 4. Categories & Art Styles — `/all-categories`
**Role:** owns **Indian art styles** — Madhubani, Pichwai, Warli, Gond, Pattachitra, etc.

| Type | Terms |
|---|---|
| Head | Indian art styles, traditional Indian art, folk art India |
| Secondary | Madhubani, Pichwai, Warli, Gond, Pattachitra, Kalamkari, Tanjore, Phad painting |
| Long-tail / AEO | "what are the different Indian art styles", "what is Madhubani / Warli / Pichwai painting", "difference between Madhubani and Warli art", "types of Indian folk and tribal art" |

## 5. FAQs — `/faqs`
**Role:** primary AEO / AI-Overview surface (FAQPage schema). Artist + buyer intent.

| Type | AEO question phrases (own these) |
|---|---|
| Artist intent | "how do I showcase my art online", "how can I sell my art online in India", "how to build an artist portfolio in India", "how can artists survive / thrive in the AI age", "is it free for artists to join KalaCUBE" |
| Buyer intent | "where to buy original Madhubani art", "how do I buy original art from Indian artists", "is the art on KalaCUBE handmade / human-made", "how do I commission an artist in India" |
| Trust | "is human-made art better than AI art", "what is KalaCUBE / how is it linked to Musée Art Café" |

## 6. Journal / Blog — `/blog`, `/blog/[username]`
**Role:** editorial depth + long-tail; artist stories, art-style guides, AI-age essays.

| Type | Terms |
|---|---|
| Head | Indian art blog, artist stories India |
| Long-tail / AEO | "how to display / see my artwork online", "how artists can use / respond to AI", art-style explainer queries, per-artist name searches |

## 7. Events — `/events`
**Role:** exhibitions/workshops + performing-arts booking intent.

| Type | Terms |
|---|---|
| Head | Indian art events, art exhibitions India, art workshops |
| Long-tail / AEO | "art exhibitions near me India", "book performing artists for an event", "live art demos and workshops India" |

## 8. Artist profile — `/artist/[username]` (dynamic)
Owns per-artist branded + long-tail: "{artist name} artist", "{name} portfolio",
"{name} {art style / dimension} India". Built from real profile data via
`generateMetadata`.

## 9. Artwork — `/art-work/[id]` (dynamic)
Owns "{artwork title} by {artist}", "buy {medium/style} painting", plus VisualArtwork
+ Offer schema for shopping/AI answers. Built from real artwork data.

---

## Structured data coverage (AEO)
- **Organization + WebSite (+ SearchAction)** — root layout (existing).
- **FAQPage** — `/faqs` (expanded Q&A set).
- **BreadcrumbList** — section pages + detail pages.
- **ProfilePage → Person + Offer[]** — `/artist/[username]`.
- **VisualArtwork + Offer + ImageObject** — `/art-work/[id]`.

## Guardrails
- Titles ≤ ~60 chars, descriptions ≤ ~158 chars, unique per route, human-first.
- Canonicals: `https://kalacube.com`, no trailing slash.
- India-first phrasing; never stuff, cloak, or publish thin pages.
</content>
</invoke>
