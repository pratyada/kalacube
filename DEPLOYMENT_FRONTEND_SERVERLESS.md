# Frontend Serverless Deployment — Next.js on AWS Amplify Hosting (Gen 2)

Deploy the KalaCUBE **frontend** (`frontend/`, Next.js 16 App Router, SSR) to
**AWS Amplify Hosting** with git-push auto-builds, a managed CloudFront CDN, and
the custom domain **kalacube.com** (+ **www**). This replaces the old React SPA
served from S3 + CloudFront.

- Region: **ap-south-1** · Account: **333578919713**
- GitHub repo: **github.com/pratyada/kalacube** · Branch: **`revamp`**
- Platform: **WEB_COMPUTE** (Amplify managed Next.js SSR — several routes are
  server-rendered on demand: `/blog`, `/blog/[slug]`, `/art-work/[id]`,
  `/artist/[username]`, `/profile/[username]`). Static export is NOT an option.

> This is a SCAFFOLD + runbook. Nothing here has been applied to live AWS. No
> DNS was changed. Do the steps below by hand (or translate to IaC) at cutover.

---

## 0. Prerequisites (do first)

1. **Push the `revamp` branch** — it is not on GitHub yet:
   ```bash
   git push -u origin revamp
   ```
   (Amplify connects to a branch that exists on the remote. You can also open a
   PR and deploy from `main` later; the steps are identical, just pick the branch.)
2. Confirm `amplify.yml` (repo root) and `frontend/next.config.ts` are committed.
3. Have the AWS console open in **ap-south-1**.

---

## 1. Files this deployment relies on

| File | Purpose |
| --- | --- |
| `amplify.yml` (repo root) | Monorepo build spec: `npm ci` at root, build only the `frontend` workspace, artifacts at `frontend/.next`, npm + `.next/cache` caching. |
| `frontend/next.config.ts` | Sets `outputFileTracingRoot` to the repo root (hoisted workspace deps) and makes `output: "standalone"` opt-in (`BUILD_STANDALONE=true`) so Amplify uses managed SSR output while Docker still works. |

No changes are required in `frontend/src/**` for Amplify.

---

## 2. Create the Amplify app from GitHub

1. Amplify console → **Create new app** → **GitHub** → authorize → pick
   **pratyada/kalacube** → branch **`revamp`**.
2. Check **"My app is a monorepo"** and enter the app root: **`frontend`**.
   (This sets `AMPLIFY_MONOREPO_APP_ROOT=frontend` automatically, and must match
   `appRoot` in `amplify.yml`.)
3. Build settings: Amplify detects the committed `amplify.yml` and uses it
   (its settings override the console). Platform should resolve to
   **WEB_COMPUTE / Next.js SSR**. If it shows "Static", stop — the build spec or
   `next build` script wasn't detected correctly.
4. Add the environment variables from section 3, then **Save and deploy**.

**Auto-build on push (the "no delay / see changes fast" workflow):** once the
branch is connected, every `git push` to `revamp` triggers an Amplify build +
deploy automatically. No manual step. Preview/PR builds can be enabled per
branch if desired.

---

## 3. Environment variables (Amplify → Hosting → Environment variables)

All `NEXT_PUBLIC_*` values are **inlined at build time**, so they must be set on
the Amplify app **before** the build (changing one requires a rebuild/redeploy).
Set for the `revamp` branch (or "All branches").

| Variable | Prod value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://api.kalacube.com` | Serverless backend base URL (client + SSR fetches). |
| `NEXT_PUBLIC_APP_URL` | `https://kalacube.com` | SSR-side OAuth redirect origin; browser uses `window.origin`. |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | `ap-south-1_6Tz4OLn4d` | Cognito pool. |
| `NEXT_PUBLIC_COGNITO_APP_CLIENT_ID` | `6n3t3poh0co772eaahgvopcfn` | Cognito app client. |
| `NEXT_PUBLIC_COGNITO_DOMAIN` | `kalacube.auth.ap-south-1.amazoncognito.com` | Hosted-UI host only, **no** `https://`. |
| `NEXT_PUBLIC_GOOGLE_LOGIN` | `false` (or unset) | Gates the hidden Google button; set `true` only once the Google IdP is enabled on the pool. |
| `AMPLIFY_MONOREPO_APP_ROOT` | `frontend` | Set automatically by the monorepo wizard; add manually if the app was created via CloudFormation. |
| `API_URL` *(optional)* | `https://api.kalacube.com` | Server-only override read by `src/lib/blog.ts`; falls back to `NEXT_PUBLIC_API_URL`, so usually unnecessary. |

Do NOT set `NEXT_PUBLIC_*` to `http://localhost:*` in prod — those are dev
defaults only. Never put Cognito **client secrets** here (this app client is a
public SPA client with no secret).

---

## 4. Custom domain + TLS (Amplify → Hosting → Custom domains)

1. **Add domain** → `kalacube.com`. Amplify provisions an **ACM certificate**
   and manages the CloudFront distribution + TLS for you.
2. Map subdomains:
   - apex `kalacube.com` → branch `revamp`
   - `www` → branch `revamp` (Amplify can auto-redirect www → apex, or vice versa)
3. If DNS is in **Route 53** for `kalacube.com`, Amplify can create the records
   directly. If DNS is elsewhere, add the CNAME/ANAME records Amplify shows.
4. Wait for the domain to reach **Available** (ACM validation + propagation).

---

## 5. Update Cognito callback / redirect URLs

The app builds OAuth redirects as `${origin}/auth/oauth/callback` and sign-out
as `${origin}/`. In the Cognito **App client** (pool `ap-south-1_6Tz4OLn4d`,
client `6n3t3poh0co772eaahgvopcfn`) → Hosted UI settings, add:

- **Allowed callback URLs:** `https://kalacube.com/auth/oauth/callback`
  (add `https://www.kalacube.com/auth/oauth/callback` too if www is not redirected)
- **Allowed sign-out URLs:** `https://kalacube.com/`

Keep the existing `http://localhost:3000/...` entries for local dev. Do this
BEFORE cutover so hosted-UI / Google login works on the new origin.

---

## 6. Cutover from the old S3 + CloudFront SPA

1. Verify the Amplify app on its default domain
   (`https://revamp.<app-id>.amplifyapp.com`): home renders, `/all-artist` and
   `/explore` load data from `https://api.kalacube.com`, email/password login
   works, `/blog` (SSR) renders.
2. **Repoint DNS** for `kalacube.com` (and `www`) from the old CloudFront
   distribution to the Amplify domain (done via the Custom domains step above —
   Route 53 alias/records now point at Amplify's CloudFront).
3. **Keep the old S3 bucket + CloudFront distribution intact** as the rollback
   target. Do not delete them until the new site is verified stable for a few days.
4. **Rollback:** if the new site misbehaves, revert the Route 53 records to the
   old CloudFront distribution. (Lower the record TTL a day before cutover to
   speed this up.)

---

## 7. Post-cutover verification checklist

- [ ] `https://kalacube.com` and `https://www.kalacube.com` both serve the new app over HTTPS.
- [ ] SSR routes render server-side (view-source shows content): `/blog`, `/artist/<username>`.
- [ ] API calls hit `https://api.kalacube.com` (Network tab), no CORS errors.
- [ ] Email/password login works; post-login redirect lands on the app.
- [ ] Hosted-UI/OAuth (if enabled) redirects to `https://kalacube.com/auth/oauth/callback`.
- [ ] A test `git push` to `revamp` triggers an automatic Amplify build + deploy.

---

## Appendix — why these config choices

- **SSR, not static export:** dynamic routes require a server → Amplify
  WEB_COMPUTE. `output: "export"` would break SSR and is deliberately avoided.
- **`baseDirectory: frontend/.next`:** Amplify's managed Next.js SSR expects the
  standard `.next` output (with `required-server-files.json`), not a standalone
  bundle. Confirmed: local `next build` (Amplify path) emits
  `frontend/.next/required-server-files.json` and no standalone folder.
- **`outputFileTracingRoot` = repo root:** npm workspaces hoist deps to the repo
  root; pinning the trace root keeps monorepo dependency tracing deterministic.
- **CDN:** Amplify Hosting fronts the app with its own managed CloudFront
  distribution + ACM cert — no separate CloudFront setup needed.
