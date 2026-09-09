# KalaCUBE — Deployment

> **This stack is the rebuild only.** It does **not** touch the existing live
> site at kalacube.com (React/CRA + AWS Amplify + Cognito). Nothing here
> provisions DNS, Amplify, or Cognito. Test locally, then decide the cutover
> yourself — separately.

## What's here

| File | Purpose |
|------|---------|
| `backend/Dockerfile` | NestJS API image (multi-stage, built from repo root) |
| `frontend/Dockerfile` | Next.js standalone image (built from repo root) |
| `docker-compose.yml` | Full stack: backend, frontend, MongoDB, Redis |
| `.env.docker.example` | Backend secrets template for compose |
| `.github/workflows/ci.yml` | Lint + build both apps + build both images on push/PR |
| `.dockerignore` | Keeps build context lean |

## Run the whole stack locally

```bash
cp .env.docker.example .env.docker      # then edit secrets
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend:  http://localhost:8000
- MongoDB:  localhost:27017  (data persisted in the `mongo_data` volume)
- Redis:    localhost:6379

Stop and wipe data:

```bash
docker compose down          # stop
docker compose down -v       # stop + delete Mongo/Redis volumes
```

## Notes

- **`.env.docker` is git-ignored** — real secrets never get committed.
- `MONGO_URI`, `REDIS_HOST/PORT`, `NODE_ENV`, `PORT` are injected by compose,
  so they are intentionally absent from `.env.docker`.
- `AWS_*` and `EMAIL_*` are required by the backend config schema (Joi). The
  example ships placeholders so the API boots; fill them in before using S3
  uploads or transactional email.
- `NEXT_PUBLIC_API_URL` is **baked into the frontend at build time** — it must
  be the URL the browser uses (default `http://localhost:8000`). Change it via
  the `build.args` in `docker-compose.yml` or `--build-arg`.

## Build a single image manually

```bash
# From the repo root (context must be root for npm workspaces to resolve):
docker build -f backend/Dockerfile  -t kalacube-backend  .
docker build -f frontend/Dockerfile -t kalacube-frontend \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 .
```

## Next layer (later, when you're ready to go live)

This Docker foundation is host-agnostic. To deploy to a managed platform:

1. **MongoDB** → MongoDB Atlas (swap `MONGO_URI`).
2. **Redis** → Upstash / Redis Cloud (swap `REDIS_HOST`/`REDIS_PORT`, add auth).
3. **Images** → push to a registry (GHCR/ECR) and run on a VPS, Fly.io, Render,
   Railway, or ECS. The CI workflow already builds both images; add a
   push/deploy step when the target is chosen.
4. Set production `CLIENT_URL`, JWT secrets, OAuth callback URLs, real AWS/SMTP.
