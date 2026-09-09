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

**Deploy target decision:** user chose **guided cloud deploy (Render/Railway)** with managed **MongoDB Atlas** (auto-backups) + managed Redis. Images → registry → PaaS. Not started — blocked on migration (see [[project_data_migration]]).

Nothing committed yet — all changes are in the working tree. See [[feedback_build_approach]] and [[project_kalacube_overview]].
