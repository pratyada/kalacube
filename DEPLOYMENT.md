# KalaCUBE — Production Deployment (as-built)

Authoritative reference for the **live** KalaCUBE stack at **https://kalacube.com**.
Everything is all-serverless on AWS (no Docker in prod). No secrets are in this
file — connection strings / keys live in git-ignored `.secrets/` and AWS SSM.

- **Live site:** https://kalacube.com (and `www`)
- **API:** https://api.kalacube.com
- **Repo / branch:** `github.com/pratyada/kalacube`, branch **`revamp`** (`main` = original, untouched)
- **AWS account:** `333578919713` · **Region:** `ap-south-1` (Mumbai) · IAM user used: `Claude_sudo`

---

## Architecture

```
kalacube.com ─┐                                   ┌─ MongoDB Atlas (kalacube DB)
              ▼                                   │
     Route 53 (zone Z02921781C5L2ZJPCCMIH)        │
              │  A-ALIAS                           │
              ▼                                   ▼
  AWS Amplify Hosting  ──client fetch──▶  API Gateway (HTTP API) ──▶ AWS Lambda (NestJS)
  (Next.js 16 SSR)         to api.          api.kalacube.com          │
  d2dp26a5omh9kk           kalacube.com                               ├─▶ S3 (artwork images)
  CloudFront: dctuy46slnri9                                           └─▶ Cognito (verify ID token)
        │
        └─ GA4 (G-TP8KDLQR1Z)
```

---

## 1. Frontend — AWS Amplify Hosting (Next.js SSR)

- **App:** `kalacube-revamp` · **appId `d2dp26a5omh9kk`** · platform **WEB_COMPUTE** (Next.js SSR)
- **Source:** `github.com/pratyada/kalacube`, branch **`revamp`**, **monorepo app root = `frontend`**
- **Build spec:** `amplify.yml` (repo root). Auto-builds on **every push to `revamp`**.
- **Amplify CloudFront distribution:** `dctuy46slnri9.cloudfront.net`
- **App created via CLI** using a GitHub token (no console OAuth needed):
  ```bash
  aws amplify create-app --name kalacube-revamp \
    --repository https://github.com/pratyada/kalacube \
    --access-token "$(gh auth token)" --platform WEB_COMPUTE \
    --environment-variables '{...}' --region ap-south-1
  aws amplify create-branch --app-id d2dp26a5omh9kk --branch-name revamp \
    --enable-auto-build --framework 'Next.js - SSR' --region ap-south-1
  aws amplify start-job --app-id d2dp26a5omh9kk --branch-name revamp \
    --job-type RELEASE --region ap-south-1
  ```
- **Environment variables** (set on the app; `NEXT_PUBLIC_*` are baked at build time):

  | Key | Value |
  |---|---|
  | `NEXT_PUBLIC_API_URL` | `https://api.kalacube.com` |
  | `NEXT_PUBLIC_APP_URL` | `https://kalacube.com` |
  | `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | `ap-south-1_6Tz4OLn4d` |
  | `NEXT_PUBLIC_COGNITO_APP_CLIENT_ID` | `6n3t3poh0co772eaahgvopcfn` |
  | `NEXT_PUBLIC_COGNITO_DOMAIN` | `kalacube.auth.ap-south-1.amazoncognito.com` |
  | `NEXT_PUBLIC_GOOGLE_LOGIN` | `false` (Google login disabled until Cognito IdP set up) |
  | `AMPLIFY_MONOREPO_APP_ROOT` | `frontend` |

- **Deploy = `git push origin revamp`.** Watch a build:
  ```bash
  aws amplify list-jobs --app-id d2dp26a5omh9kk --branch-name revamp --region ap-south-1 --max-items 1
  ```

---

## 2. Backend — AWS Lambda + API Gateway (NestJS)

- **Stack:** `kalacube-api-staging` (Serverless Framework v3, `backend/serverless.yml`) · **stage `staging`** · region ap-south-1
- **Function:** `kalacube-api-staging-api` · Node.js 20 · **arm64** · handler `dist/lambda.js` (serverless-express wrapping the Nest `AppModule`)
- **Default endpoint:** `https://nmk8io3ru5.execute-api.ap-south-1.amazonaws.com`
- **Custom domain:** **`api.kalacube.com`** (API Gateway HTTP API custom domain + ACM cert + Route 53 alias)
- **IAM:** the function's execution role has S3 (Get/Put/Delete/List) on the bucket. **S3 uses the role** (no static keys — `AWS_ACCESS_KEY`/`AWS_SECRET_KEY` are reserved Lambda names and are unset).
- **CORS:** allowed origins = `CLIENT_URL` (comma-separated). Currently `https://kalacube.com,https://www.kalacube.com,https://revamp.d2dp26a5omh9kk.amplifyapp.com`.

### Deploy the backend (manual)
```bash
cd backend
# 1) build dist WITH dev deps (use the root nest binary; npm-workspaces hoists to root)
../node_modules/.bin/nest build
cp src/email/templates/*.hbs dist/email/templates/ 2>/dev/null   # ensure .hbs in dist
# 2) materialize a prod, LINUX-arm64 node_modules for packaging (CRITICAL flags)
rm -rf node_modules
npm install --omit=dev --install-links --workspaces=false --os=linux --cpu=arm64 --no-audit --no-fund
# 3) deploy
npx serverless deploy --stage staging --region ap-south-1
# 4) (optional) restore full dev deps for local work
cd .. && npm install
```
**Gotchas (learned the hard way):**
- `--os=linux --cpu=arm64` is REQUIRED so native deps (`bcrypt`, `@css-inline` via the mailer) get Linux binaries — else Lambda boots with `Cannot find module ...-linux-arm64-gnu`.
- Let the prod `npm install` FULLY finish (~1 min / ~480 pkgs) or you get `Cannot find module 'date-fns'`.
- Never set `AWS_ACCESS_KEY`/`AWS_SECRET_KEY` in `serverless.yml` env — reserved on Lambda (deploy fails).
- Logs: `aws logs filter-log-events --log-group-name /aws/lambda/kalacube-api-staging-api --region ap-south-1` (stream names contain `[$LATEST]` which breaks `get-log-events`).

### SSM Parameter Store (env, under `/kalacube/prod/*`)
`serverless.yml` pulls all env from SSM at deploy time. Sensitive ones are `SecureString`.
`MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL`, `AWS_STORAGE_BUCKET`,
`COGNITO_REGION`/`COGNITO_USER_POOL_ID`/`COGNITO_APP_CLIENT_ID`, `REDIS_HOST`/`REDIS_PORT`/`REDIS_TLS`,
`EMAIL_USERNAME`/`EMAIL_PASSWORD` (+ optional OAuth). `AWS_REGION` is auto-injected by Lambda.
```bash
aws ssm put-parameter --name /kalacube/prod/CLIENT_URL --value '...' --type String --overwrite --region ap-south-1
aws ssm get-parameters-by-path --path /kalacube/prod --with-decryption --region ap-south-1
```

---

## 3. Database — MongoDB Atlas

- **Cluster:** `cluster0.b5uay.mongodb.net`
- **Database:** **`kalacube`** (the production DB). The original **`05_202011_kalaCUBE` is UNTOUCHED**.
- **Auth:** a password DB user with `readWriteAnyDatabase`. Connection string (SRV) is stored **only** in git-ignored `.secrets/atlas_rw.uri`.
- **Network access:** `0.0.0.0/0` (Lambda is VPC-less and needs this).
- **Data (3,383 docs):** 478 users · 481 artistprofiles · 2,123 artworks (image URLs wired) · 111 artstyles · 132 arttags · 8 artspaces · 50 events.
- **How it was loaded:** `mongodump` the local container `kalacube` DB → `mongorestore` into Atlas `kalacube` (preserves the reconciled + image-wired data).
  ```bash
  mongorestore --uri="$(cat .secrets/atlas_rw.uri)" --archive=kalacube.archive --gzip --drop
  mongosh "$(cat .secrets/atlas_rw.uri)" --quiet --eval 'db.getCollectionNames()'
  ```

---

## 4. Auth — AWS Cognito

- **User Pool:** `kala_cube` = **`ap-south-1_6Tz4OLn4d`** (467+ real users; passwords not exportable)
- **App client:** **`6n3t3poh0co772eaahgvopcfn`** — allows `USER_SRP_AUTH` (Amplify login) + `ADMIN_USER_PASSWORD_AUTH` (headless test tokens). No client secret.
- **Hosted-UI domain:** `kalacube.auth.ap-south-1.amazoncognito.com`
- **Sign-in:** email/password via Amplify SRP. **The pool has NO email alias** → users log in with their **username** (migrated users = legacy handle). The login field accepts username.
- **The backend** verifies the Cognito **ID token** (email claim) and maps to the Mongo user by email; unknown = `{ isNewUser: true }` → onboarding creates the profile.
- **Admin test user:** username `devteam` (email musee.initialize@gmail.com), password `Admin@1234`, role `superadmin`.
- **Google login: NOT configured** (deferred). To enable: add Google as an IdP in the pool, set app-client callback URLs (`https://kalacube.com/auth/oauth/callback`) + sign-out (`https://kalacube.com/`), then set Amplify env `NEXT_PUBLIC_GOOGLE_LOGIN=true`.
- Headless token for testing:
  ```bash
  aws cognito-idp admin-initiate-auth --user-pool-id ap-south-1_6Tz4OLn4d \
    --client-id 6n3t3poh0co772eaahgvopcfn --auth-flow ADMIN_USER_PASSWORD_AUTH \
    --auth-parameters USERNAME=devteam,PASSWORD='Admin@1234' --region ap-south-1 \
    --query 'AuthenticationResult.IdToken' --output text
  ```

---

## 5. Storage — Amazon S3

- **Bucket:** **`05-202011-kalacube-artist`** (ap-south-1), ~4,140 objects.
- **Public-read** via bucket policy on `protected/*` (Public Access Block off). Images served directly:
  `https://05-202011-kalacube-artist.s3.ap-south-1.amazonaws.com/<key>`
- **Key layout:** `protected/{identityId}/artist_work/{artworkId}/[timestamp/]{file}` and `protected/{identityId}/artist_profile/{profile_pic|cover_pic}.png`.
- **New uploads:** the backend `POST /api/artworks` (multipart) writes under `protected/{legacyIdentityId||userId}/artist_work/{id}/` using the Lambda role.
- Optional prod polish: CloudFront + OAC in front of the bucket.

---

## 6. DNS — Route 53 (in this AWS account)

- **Hosted zone:** `kalacube.com` = **`Z02921781C5L2ZJPCCMIH`** (also `kalacube.ca`, `kalacube.in`).
- **Records:**

  | Name | Type | Target |
  |---|---|---|
  | `kalacube.com` | A (ALIAS) | `dctuy46slnri9.cloudfront.net` (Amplify) — HostedZoneId `Z2FDTNDATAQYW2` |
  | `www.kalacube.com` | A (ALIAS) | `dctuy46slnri9.cloudfront.net` (Amplify) |
  | `api.kalacube.com` | A (ALIAS) | API Gateway custom-domain regional target |
  | `_38a427da….kalacube.com` | CNAME | ACM validation record for the Amplify cert |
  | `kalacube.com` | MX | `mx.zoho.com` (email — **do not touch**) |

- **Amplify custom-domain gotcha:** AWS won't let two CloudFront distributions claim the same alias. During cutover the **old** distribution (`EDDWKHBOLRHIG` / `d2hqaleog4pppu.cloudfront.net`) had to have `kalacube.com` + `www` **removed from its Alternate Domain Names** before Amplify's new distro could take them. `www` must be an **A-ALIAS** (not CNAME) because a CNAME conflicts with the existing A record.

---

## 7. Analytics

- **Google Analytics 4:** Measurement ID **`G-TP8KDLQR1Z`**, web stream ID `15757761751`.
- Installed in `frontend/src/app/layout.tsx` via `next/script` **`strategy="beforeInteractive"`** (renders in the SSR HTML so Google's tag detector finds it). Loads on every page.
- **Core Web Vitals → GA4:** `frontend/src/components/WebVitals.tsx` (`useReportWebVitals`) sends LCP/INP/CLS/FCP/TTFB as GA4 events for per-page performance.
- **SEO/AEO:** per-page metadata + OG images (`next/og`), JSON-LD (Organization, WebSite+Search, Person, VisualArtwork, FAQPage), `sitemap.xml`, `robots.txt`.

---

## 8. Deploy workflow (day-to-day)

- **Frontend change:** commit → `git push origin revamp` → Amplify auto-builds & deploys (~3–4 min). Verify: `curl -I https://kalacube.com`.
- **Backend change:** rebuild + `serverless deploy` (see §2). Verify: `curl 'https://api.kalacube.com/api/explore/artworks?limit=1'`.
- **Env change (frontend):** update Amplify env var → trigger a rebuild (`start-job RELEASE`).
- **Env change (backend):** update SSM param → `serverless deploy` (or `aws lambda update-function-configuration` for a hot change).

---

## 9. Rollback

- **Frontend:** repoint Route 53 `kalacube.com` + `www` A-ALIAS back to the **old CloudFront `d2hqaleog4pppu.cloudfront.net`** (re-add its alternate domain names first). The old S3+CloudFront site still exists.
- **Backend:** repoint `api.kalacube.com` back to the **old EC2** (`3.7.236.23`) in Route 53, or `cd backend && npx serverless rollback --stage staging`.
- The original Atlas DB (`05_202011_kalaCUBE`) and Cognito pool are shared/unchanged, so no data rollback needed.

---

## 10. Not yet enabled (deferred)

- **Google / Hosted-UI login** — needs Cognito Google IdP + callback URLs (see §4). Button hidden via `NEXT_PUBLIC_GOOGLE_LOGIN=false`.
- **Email + newsletter** — templates are branded and wired, but the Bull queue needs a managed Redis. Set `REDIS_HOST/PORT/PASSWORD/TLS` (Upstash serverless Redis, works over TLS from Lambda) in SSM + redeploy to activate. Until then email is inert (no transactional email is triggered by browse/login/upload).
- **CloudFront + OAC** in front of the S3 image bucket (currently direct public-read).
- A dedicated **staging** S3 bucket for uploads (currently the prod bucket).

## Related docs
`DEPLOYMENT_BACKEND_SERVERLESS.md`, `DEPLOYMENT_FRONTEND_SERVERLESS.md` (original scaffolding runbooks), `PRODUCTION_STATUS.md` (E2E test results), and the migration/AWS discovery notes in the memory bank.
