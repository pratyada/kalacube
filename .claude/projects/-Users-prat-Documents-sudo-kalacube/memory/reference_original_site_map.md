---
name: Original kalacube.com Site Map
description: Full page + API map of the original live kalacube.com app, reverse-engineered from its CRA JS bundle. Blueprint for the revamp rebuild.
type: reference
---

Original kalacube.com is a **live CRA (Create React App) SPA** — root `/` shows "Coming soon", but real routes work (e.g. https://kalacube.com/all-artist). Source code is NOT on disk / not in any GitHub repo/branch (kalacube-frontend main+dev are only the coming-soon page). Extracted the site map from the live bundle `https://kalacube.com/static/js/main.2516aaee.chunk.js` (2026-09-09).

**FRONTEND ROUTES (rebuild these in the new Next.js app, mirroring the paths):**
- `/home` — landing
- `/all-artist` — artist directory/grid  ← user pointed here first
- `/artist/:userName` — artist profile detail (+ their artworks)
- `/art-work/:id` — artwork detail
- `/gallery` — artwork gallery
- `/all-categories` — categories / art styles
- `/art-space` and `/art-space/:username` — art spaces (alt_spaces)
- `/events` — events
- `/art-collection` — collections (e.g. `/catalog/2025/jan`)
- `/profile` — own profile · `/registration/login` — auth · `/faqs` · `/admin`

**ORIGINAL API endpoints the app called (data now migrated — map to new backend):**
`/api/artists` (+ `/getPopularArtists`, `/getPublicArtistData`), `/api/art-works` (+ `/getPublicArtWork`, `/getRecentArtWork`, `/getallartwork`), `/api/alt-spaces`, `/api/art-styles`, `/api/events`, `/api/users` (+ `/getUsername`, `/roles`), `/api/admins`, `/api/tags`. Plus Instagram integration (`/fetchInstagramPosts`, `/linkInstagramAccount`).

**PLAN:** recreate these pages in the new app wired to migrated data (users/artistprofiles/artworks/artspaces/events), then apply the muse.tv cinematic revamp styling ([[project_redesign_vision]]). New backend browse API being built under `/api/explore/*` (artworks, artists). This is the concrete meaning of the user's "build on top of the original" — original frontend is gone, so rebuild its page structure from the live blueprint + recovered data.
