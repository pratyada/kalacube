---
name: KalaCUBE Deployment Pipeline
description: Docker Compose deployment foundation built for the rebuild — Dockerfiles, compose stack, CI. Config done, not yet deployed.
type: project
---

Built a **Docker Compose deployment foundation** for the KalaCUBE rebuild (the new `backend/` + `frontend/` monorepo apps). Chosen approach: Docker Compose (host-agnostic base), config-only first pass. Verified locally 2026-07-15; NOT yet deployed anywhere.

**Files added:**
- `backend/Dockerfile` — multi-stage NestJS image (deps → build → slim runtime), built from **monorepo root** context so npm workspaces resolve.
- `frontend/Dockerfile` — multi-stage Next.js **standalone** image (also root context). Standalone `server.js` lands at `frontend/.next/standalone/frontend/server.js`.
- `docker-compose.yml` — services: `backend` (:8000), `frontend` (:3000), `mongo` (:27017), `redis` (:6379). Compose injects `MONGO_URI=mongodb://mongo:27017/kalacube`, `REDIS_HOST=redis`. Named volumes `mongo_data`/`redis_data`.
- `.env.docker.example` → copy to `.env.docker` (git-ignored). AWS_* and EMAIL_* are Joi-`required`, so placeholders are shipped so the API boots.
- `.dockerignore`, `.github/workflows/ci.yml` (lint + build both apps + build both images w/ GHA cache), `DEPLOYMENT.md`.

**Incidental fixes required (both real, both verified):**
- `backend/nest-cli.json` — added `assets` so email `.hbs` templates copy into `dist/email/templates` (mailer reads `join(__dirname,'templates')`). Was broken for `start:prod` AND Docker before.
- root `package.json` — added `"packageManager": "npm@10.8.2"` (Turbo 2.9 refused to run without it).

**Verified:** `npm run build:backend` ✓ (templates in dist), `npm run build:frontend` ✓ (standalone path correct), `turbo run lint` resolves. **Docker images NOT built** — Docker Desktop daemon was off. To test end-to-end: start Docker Desktop → `cp .env.docker.example .env.docker && docker compose up --build`.

**Known debt:** 3 pre-existing frontend lint errors (`no-explicit-any` in `profile/[username]/page.tsx` and `profile/edit/page.tsx`). CI lint step set `continue-on-error: true` so first CI run stays green; flip to blocking once cleaned. Also note: `main.ts` has NO global `/api` prefix but OAuth callback env URLs assume `/api/...` — pre-existing inconsistency, not yet addressed.

**LOCAL E2E RUNNING (2026-09-09):** full stack up via `docker compose up --build -d`. Ports remapped in `./.env` (git-ignored) because host has clashes: `FRONTEND_PORT=3005` (3000/3001 taken by other node apps), `MONGO_PORT=27018` (host has a NATIVE mongod on 27017 too — big gotcha). Compose ports now use `${FRONTEND_PORT:-3000}` / `${MONGO_PORT:-27017}`. Frontend Dockerfile + compose take NEXT_PUBLIC_COGNITO_* build args. `.env.docker` created (git-ignored) with live Cognito values. Migration run into CONTAINER mongo via `TARGET_URI=mongodb://localhost:27018/kalacube node .secrets/migrate.js` (`.secrets/migrate.js` = the write-mode migration, copy-only, preserves _id). Backend (internal `mongo:27017`) serves it. Verified: 478 users/481 profiles/2123 artworks; real artist `arthouseecstasy` (vatsala428@gmail.com) has 53 artworks w/ correct S3 imagePrefix `protected/{identityId}/artist_work/{artworkId}/`. Backend guard 401s w/o token; Cognito verifier ready. **To log in for testing:** AWS session must create a Cognito user with a REAL migrated email (e.g. vatsala428@gmail.com) + known password. Images NOT wired yet (need S3). ⚠️ CLEANUP: first migration attempt accidentally wrote a `kalacube` db into the user's NATIVE mongod (localhost:27017, alongside dinetist-media/hotel-crm-dev) — offer to drop it.

**DEV WORKFLOW (2026-09-09, switched from Docker rebuilds — too slow for iteration):** Docker runs ONLY mongo(27018)+redis(6379). Backend+frontend run as HOST dev servers (hot reload):
- Backend: `MONGO_URI="mongodb://localhost:27018/kalacube" npm run dev:backend` (nest watch, :8000, connects container mongo+redis, Cognito live). 
- Frontend: `PORT=3005 npm run dev:frontend` (next dev, :3005, reads frontend/.env.local).
Docker backend/frontend containers are STOPPED (their images were stale). For a prod-parity check, rebuild images later (`docker compose up --build`, slow ~10min).

**REBUILD PAGES (revamp, matching original site map [[reference_original_site_map]]):** Built public browse API `/api/explore/{artists,artworks}` (ExploreModule + artwork.schema.ts mapping `artworks` collection; returns `{items,total,page,limit}` — note ResponseInterceptor unwraps a `data` key so DON'T name the payload key `data`). Frontend pages built + verified serving real data: `/` (cinematic home: hero + 3 dimensions + featured artists + recent artworks), `/all-artist` (478 artists grid), `/explore` (2123 artworks gallery). Style: user asked for LIGHT theme (2026-09-09, NOT the dark cinematic muse.tv vision) — switched all pages+header to light: bg `#faf8f5`, text neutral-900, borders neutral-200, gold accent darkened to `#a06f1e` for contrast, gold fills/borders `#cda45c` kept, serif headings. Images = placeholders (S3 not wired). Also built + verified: global dark **Header** nav (Home/Explore/Artists + Sign in) mounted in layout.tsx; `/artist/[username]` (artist detail: bio, dimensions, socials, their works) + `/art-work/[id]` (artwork detail) via public `/api/explore/artists/:username` and `/api/explore/artworks/:id`. Fixed CORS in main.ts (allow any localhost port in non-prod — frontend on :3005 was blocked by hardcoded :3000). Full nav works: home→explore→artist→artwork. Harmless hydration warning in console is from a browser extension (`data-scribe-recorder-ready`), not our code. NOT built yet: `/all-categories`, `/art-space`, `/events`, images (S3). All on branch `revamp`, uncommitted.

**Deploy target decision:** user chose **guided cloud deploy (Render/Railway)** with managed **MongoDB Atlas** (auto-backups) + managed Redis. Images → registry → PaaS. Not started — blocked on migration (see [[project_data_migration]]).

**BRANCHING (2026-09-08):** ALL revamp work lives on branch **`revamp`** (first revamp commit `04f4504`). **`main` = untouched original** (only `9de4cf7`). User wants the revamp kept as a totally separate track from the original code. Not pushed to remote yet. Secrets (.env, .secrets/, docs/client_secret_*.json) are git-ignored and were verified absent from the commit. See [[feedback_build_approach]] and [[project_kalacube_overview]].
