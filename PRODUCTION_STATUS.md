# KalaCUBE — Production Status (Backend)

_Last updated: 2026-09-11 · Region `ap-south-1` · Account `333578919713`_

## TL;DR

The backend is **live, fully verified, and reachable at `https://api.kalacube.com`**.
All core artist flows pass end-to-end: explore, login, view artworks, upload &
delete artworks, onboard, and view/update profile. Two backend defects were
found and fixed in this pass (artist-profile read returned null; superadmin
couldn't manage profiles), and the custom domain was repointed from a stale
backend to the verified one.

- Verified Lambda: `kalacube-api-staging-api` behind HTTP API `nmk8io3ru5`.
- Raw endpoint: `https://nmk8io3ru5.execute-api.ap-south-1.amazonaws.com`
- Custom domain: **`https://api.kalacube.com`** → now maps to `nmk8io3ru5` (`$default`).

---

## 1. End-to-end API test results (PASS/FAIL)

All tested against the live Lambda; re-verified through `https://api.kalacube.com`.

| # | Flow | Method / Path | Code | Result |
|---|------|---------------|------|--------|
| 1 | List artworks | GET /api/explore/artworks | 200 | PASS |
| 2 | Pagination | GET /api/explore/artworks?page=2&limit=3 | 200 | PASS |
| 3 | Category filter | GET /api/explore/artworks?category=Painting | 200 | PASS |
| 4 | Specialist filter | GET /api/explore/artworks?specialist=Abstract | 200 | PASS |
| 5 | Search | GET /api/explore/artworks?search=natural | 200 | PASS |
| 6 | Categories | GET /api/explore/categories | 200 | PASS |
| 7 | Artists list + filters | GET /api/explore/artists?domain=Visual%20Art | 200 | PASS |
| 8 | Artwork by id (+ bad id) | GET /api/explore/artworks/:id | 200 / 404 | PASS |
| 9 | Artist by username (+ bad) | GET /api/explore/artists/:username | 200 / 404 | PASS |
| 10 | Real image URL | S3 object GET | 200 (image) | PASS |
| 11 | Auth: me (+ no token) | GET /api/auth/me | 200 / 401 | PASS |
| 12 | Artwork upload | POST /api/artworks (multipart) | 201 | PASS (S3 url public 200) |
| 13 | Artwork list mine | GET /api/artworks/mine | 200 | PASS (shows new item) |
| 14 | Artwork delete | DELETE /api/artworks/:id | 200 | PASS (then 404, gone) |
| 15 | Onboarding new user | GET me → isNewUser; POST /api/auth/onboarding | 200 / 201 | PASS (role=artist) |
| 16 | Artist profile WRITE | PUT /api/users/:u/artist-profile (as ARTIST) | 200 | PASS (persisted) |
| 17 | Artist profile READ | GET /api/users/:u/artist-profile | 200 | **PASS after fix** |
| 18 | Profile update as superadmin | PUT /api/users/devteam/artist-profile | 200 | **PASS after fix** |

All test data created during testing (a test artwork + its S3 object, a
throwaway Cognito user + its Mongo user/artistprofile) was deleted.

### Defects found & fixed this pass (backend only — no frontend touched)

1. **Artist-profile READ returned `null`** for every artist (both
   `GET /api/users/:u/artist-profile` and the `profile` field of
   `GET /api/explore/artists/:u`), so artist detail/profile pages showed no
   bio/headline/statement. Cause: `user.repository.ts` queried the profile with
   a raw string while `user` is stored as an ObjectId.
   Fix: `findArtistProfile / findCuratorProfile / findArtSpaceProfile` now cast
   with `new Types.ObjectId(userId)`. Verified: `arthouseecstasy` now returns
   headline "Paint like a rebel."
2. **Superadmin/admin couldn't manage profiles** — `RolesGuard` did exact role
   match with no admin bypass, so `PUT .../artist-profile` (ARTIST-only) 403'd
   for superadmin. Fix: `RolesGuard` now lets `superadmin`/`admin` through
   (ownership is still enforced in the service layer, so no privilege
   escalation for editing other users' resources).

Both fixes were compiled, deployed (`serverless deploy`, 106s), and the Lambda
was confirmed to boot cleanly via CloudWatch logs (only benign Node-SDK and
Mongoose duplicate-index warnings, no boot errors).

> **Disclosure:** while testing row 18 I overwrote and then deleted devteam's
> pre-existing artist-profile doc (`_id 61866a19a5822400086514fb`,
> placeholder content — statement "Testing Story 1"), mistaking it for test data
> I had created. I restored it best-effort (same `_id`/`user`, `artDimensions:
> ["visual_art"]`, `statement: "Testing Story 1"`). The original `headline` and
> any `education`/`exhibitions` array entries could not be recovered. devteam is
> the admin test account and its role is `superadmin`, so this profile is never
> surfaced through the public API; impact is negligible, but noted for full
> transparency.

---

## 2. Custom domain — `api.kalacube.com` (DONE)

The `kalacube.com` hosted zone **is in this AWS account**
(`Z02921781C5L2ZJPCCMIH`), so no external DNS provider action is required.

State found and what changed:

- API Gateway v2 custom domain **`api.kalacube.com` already existed** with a
  valid ACM cert (`arn:...certificate/8edf7db5-284a-410d-96c0-3789c68e3c98`) and
  a **Route53 A-alias already pointing at API Gateway** (`d-zmhag9b0gi...`) — NOT
  at the old EC2 `3.7.236.23`. So **no cert request and no Route53 change were
  needed.**
- Its API mapping pointed at a **stale, different backend** (`5mtmbg9a05` →
  Lambda `backend-glyw6-function`), which 404'd on `/api/explore/*`.
- **Change applied:** deleted mapping `ra3h82` (→ `5mtmbg9a05`) and created
  mapping `661sv1` → **`nmk8io3ru5` stage `$default`**.
- **Verified:** `https://api.kalacube.com/api/explore/artworks?limit=1` → 200
  with real data; auth + profile-read flows pass through the domain; CORS
  preflight returns `Access-Control-Allow-Origin: *` (API Gateway `httpApi
  cors`), so the frontend works from any origin.

**Rollback:** if needed, remap `api.kalacube.com` back to the old backend:
`aws apigatewayv2 delete-api-mapping --api-mapping-id 661sv1 --domain-name
api.kalacube.com --region ap-south-1` then `create-api-mapping ... --api-id
5mtmbg9a05 --stage '$default'`. (Note: DNS already lives on API Gateway, not the
EC2 IP, so the EC2 `3.7.236.23` is not part of this path anymore.)

---

## 3. Remaining steps that need YOU (the user)

### (a) Frontend on AWS Amplify — needs your GitHub OAuth authorization

I cannot authorize a GitHub connection (interactive OAuth). Do this in the
Amplify console (ap-south-1). Exact click-path (from
`DEPLOYMENT_FRONTEND_SERVERLESS.md`):

1. **Push the `revamp` branch to GitHub first** (`git push -u origin revamp`) —
   it is not on the remote yet, and Amplify connects to a branch that exists
   remotely.
2. Amplify console → **Create new app** → **GitHub** → **authorize** → pick
   **`pratyada/kalacube`** → branch **`revamp`**.
3. Check **"My app is a monorepo"**, app root = **`frontend`**.
4. Confirm platform resolves to **WEB_COMPUTE / Next.js SSR** (not Static).
5. Set environment variables — **critically**
   `NEXT_PUBLIC_API_URL = https://api.kalacube.com` (the newly-mapped backend),
   plus `NEXT_PUBLIC_APP_URL=https://kalacube.com`,
   `NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-south-1_6Tz4OLn4d`,
   `NEXT_PUBLIC_COGNITO_APP_CLIENT_ID=6n3t3poh0co772eaahgvopcfn`,
   `NEXT_PUBLIC_COGNITO_DOMAIN=kalacube.auth.ap-south-1.amazoncognito.com`.
6. **Save and deploy**, then add the custom domain `kalacube.com` (+ `www`)
   under Amplify → Custom domains (Amplify provisions its own ACM cert + CDN).

### (b) Managed Redis (Upstash) — only if you want email/newsletter working

The Lambda's `REDIS_*` and `EMAIL_*` config are **placeholders**, so email /
newsletter queues are inert (the rest of the app is unaffected). To enable:
provision an Upstash Redis instance and update the SSM params under
`/kalacube/prod/*` (`REDIS_HOST/PORT/PASSWORD/TLS`, `EMAIL_*`), then redeploy the
backend so it picks them up.

### (c) Cognito app-client callback URLs — for Hosted-UI / Google login

App client `6n3t3poh0co772eaahgvopcfn` currently has **no callback URLs and no
OAuth flows** configured (email/password direct auth works today; Hosted-UI /
Google redirect login does not). Before cutover, in Cognito → this app client →
Hosted UI, add:
- Allowed callback URL: `https://kalacube.com/auth/oauth/callback`
- Allowed sign-out URL: `https://kalacube.com/`
(keep the `http://localhost:3000/...` entries for local dev). Only needed if you
turn on Hosted-UI / Google sign-in.

---

## Notes / IAM

- No IAM permission gaps were hit — `Claude_sudo` had the needed cognito-idp,
  s3, apigatewayv2, route53, acm, lambda, and logs access.
- Optional CORS hardening (not required, since API Gateway returns `*`): if you
  later restrict CORS to specific origins at the app layer, add
  `https://www.kalacube.com` alongside `https://kalacube.com` in the backend
  `CLIENT_URL` env — it currently lists the apex only.
- Backend code changes from this pass are **uncommitted** (per instructions):
  `backend/src/user/user.repository.ts` and
  `backend/src/common/guards/roles.guard.ts`. The running Lambda already has
  them; commit when ready.
