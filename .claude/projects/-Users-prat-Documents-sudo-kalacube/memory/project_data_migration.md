---
name: KalaCUBE Data Migration
description: Plan to migrate old kalacube.com data into the new system before go-live. PAUSED waiting on user's old MongoDB connection string.
type: project
---

User wants to deploy the rebuild live, but **top priority: do NOT lose any old data (users, artwork, images, logins).** So deployment is gated on migrating old data first.

**GOLDEN RULE (stated to user):** Migration is **copy-only**. The old kalacube.com stays fully intact and untouched as backup until user verifies the new system and explicitly says "cut over." Claude never deletes/modifies the old system.

**Discovery findings (2026-07-15, read-only inspection of local legacy repos):**
- Old **frontend** (`kalacube-frontend/`) = bare "Coming soon" Next.js splash. NO Amplify/Cognito/AWS deps → **no Cognito logins to migrate** (earlier memory note about Cognito appears wrong for this repo).
- Old **backend** (`kalaCUBE-backend/`) = NestJS + MongoDB. Public registration never enabled; only a **CLI admin command** (`create:user <role> <username> <email> ...`) to seed superadmin/admin. No artwork/image upload feature ever shipped. Old user schema fields: authType, role, username, email, phone, countryCode, dob, firstName, lastName, password?, profile(ObjectId ref), emailVerifiedAt, phoneVerifiedAt, isActive, timestamps.
- **No connection string anywhere** in old repo (no `.env`, no hardcoded URI).
- Claude's initial read (little-to-no data) was **WRONG** — see real inventory below.

**REAL INVENTORY (2026-09-08, read-only mongosh against Atlas db `05_202011_kalaCUBE`, cluster `cluster0.b5uay.mongodb.net`):**
- Access set up: temporary **read-only** Atlas DB user `readonly_migration` + Network Access `0.0.0.0/0` (BOTH must be removed after migration). Connection string in `.secrets/mongo.uri` (git-ignored). mongosh 2.8.2.
- Counts: **art_works 4146**, **artists 481**, **users 478**, art_work_tags 132, art_styles 111, events 50, user_roles 20, alt_spaces 8, admins 4. This is REAL production data (~478 people, 481 artist profiles, 4000+ artworks).
- **Old schema differs from new backend** (old: users/artists/art_works/alt_spaces/art_styles/art_work_tags/events/user_roles/admins; new: users + artist/curator/art-space profile schemas). Mapping required.
- Key old fields — users: role[], userName, email, phone, firstName/middleName/lastName, country, region, location(google place id), **identityId** (= AWS Cognito identity, e.g. `ap-south-1:...`), userRolesId. artists: status, artStyleId[], userId, brandName, instagramId, story, tagLine, rank, curatorIds, certificates, level, receivedProfessionalTraining, withholdingDegree. art_works: status, title, cost, artistId, artStyleId (sparse — image field NOT in sample).

**TWO CRITICAL FINDINGS — migration has THREE sources, not one:**
1. **Logins are in AWS Cognito, not Mongo** (users have `identityId` = Cognito pool `ap-south-1:...`). Cognito passwords can't be exported → users must reset password on first login, OR bulk-import the Cognito user pool. Needs user's AWS Cognito access.
2. **Artwork images are in AWS S3, not Mongo** (art_works have metadata only, no image URL in sample). Need old S3 bucket name + region to migrate 4146 artworks' images.

**DEEP PROFILE (2026-09-08, read-only):**
- users: ALL 478 have role=["artist"]. 100% email/phone/userName; names partial (~68%); **identityId (Cognito) present on 360/478** (118 have no Cognito login). NO password field (auth = Cognito only).
- artists: 481 docs (slightly more than users — possible orphans). Rich profile + social links (instagram/facebook/twitter/youtube/pinterest/website).
- art_works: 4146 = **submitted 2123 + draft 2023**. Drafts mostly empty shells (artistId/title/cost only ~44-47% populated overall). Real artworks ≈ 2100.
- **IMAGES: zero image/file references anywhere in Mongo** (art_works, artists, users, alt_spaces all checked). Image files must be in **S3 keyed by an ID convention NOT stored in Mongo** — must inspect the actual S3 bucket + possibly old backend s3.service.ts to reverse-engineer the artwork→file mapping. THIS IS THE BIGGEST OPEN QUESTION.

**AWS DISCOVERY — DONE by user's other (AWS-access) session, 2026-09-08. Full writeup at repo root `AWS_DISCOVERY.md`. AWS account 333578919713, region ap-south-1. BOTH blockers RESOLVED:**

*Cognito (logins):* User Pool `kala_cube` = **`ap-south-1_6Tz4OLn4d`**, **467 users** (real User-Pool users, exportable via `aws cognito-idp list-users`; passwords NOT exportable). Identity Pool `ap-south-1:8900d046-2da1-497a-b296-13ae762c41bb` linked to it → Mongo `users.identityId` = that user's identity-pool id. Match Mongo↔Cognito by **email**. Reconcile: pool 467 / Mongo 478 / with identityId 360.

*S3 (images):* Prod bucket **`05-202011-kalacube-artist`** (ap-south-1), **4,140 objects ~979 MB**. Amplify key layout maps directly to Mongo:
  - `protected/{identityId}/artist_profile/{profile_pic|cover_pic}.png`
  - `protected/{identityId}/artist_work/{artworkId}/[{timestamp}/]{filename}`  (identityId=users.identityId, artworkId=art_works._id)
  - `public/alt_space/{alt_spaces.name}/{profile_pic|events|gallery}/...`
  310/360 identityId prefixes have content. Ignore non-prod buckets (…-dev, kalacube-backup, kalacubetest).
  Image reconstruction: art_works → join users (artistId→userId→identityId) → list `protected/{identityId}/artist_work/{_id}/`.

**AUTH DECISION — RESOLVED (user chose 2026-09-08): KEEP AWS Cognito + S3/Amplify stack.** Rationale: everything already in Cognito/Amplify; zero user disruption, no password resets, identityId links stay valid. New app keeps using Cognito User Pool `ap-south-1_6Tz4OLn4d`. Wants **Google login + email/password**.
- Implication: NEW NestJS backend's own auth (JWT+bcrypt+refresh-token+register/login) gets REPLACED by Cognito-token validation (verify against pool JWKS `https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_6Tz4OLn4d/.well-known/jwks.json`). New JwtStrategy validates Cognito access/id tokens; drop bcrypt/refresh-token schema. Frontend uses AWS Amplify Auth (or Cognito Hosted UI) for login.
- Mongo user records link to Cognito by `sub`/`email`/`identityId`.
- **NEW FEATURE (user req 2026-09-08):** add **"Continue with Google" — one-tap signup + login** on top of existing Cognito email/password. Google is NOT currently on the pool (was email/password only) → must ADD Google as federated IdP.
  - Needs: Google OAuth client (id+secret) from Google Cloud Console; add Google IdP to Cognito pool `ap-south-1_6Tz4OLn4d`; configure Cognito Hosted UI domain + app-client callback/logout URLs + enable Google as allowed IdP + map Google email→Cognito email attr.
  - Frontend: AWS Amplify Auth `signInWithRedirect({ provider: 'Google' })` (or Hosted UI). Backend still just validates Cognito tokens (provider-agnostic).
  - ⚠️ **GOTCHA — account linking:** existing 467 users are email/password. If an existing user clicks "Sign in with Google" with the SAME email, Cognito creates a SEPARATE duplicate user unless we link. Must handle via pre-sign-up Lambda trigger `AdminLinkProviderForUser` (link Google identity to existing email/password user) so no duplicate/split accounts. Critical for user-data integrity.
- Since staying on AWS: MongoDB can also STAY on the existing Atlas cluster (no Mongo migration needed) OR move to a fresh Atlas — decide later. S3 bucket `05-202011-kalacube-artist` stays as-is.

**OTHER DECISIONS:** drafts — migrate only 2123 submitted (recommend) vs also 2023 empty drafts. 118 users w/o identityId — mostly no S3 content; skip or import login-only.

**EMAIL LIST + GOOGLE REACH (2026-09-08, exported read-only to `.secrets/artist_emails.csv`, git-ignored PII):** 478 unique valid emails, 0 blank, 0 dupes. **445/478 (93%) are Gmail → eligible for one-tap Google login**; 33 non-Google → email/password. 360 have Cognito identityId. User plans to email all artists THIS WEEK; chose sequence = **Google login LIVE before the email** (email will feature it). Relaunch email drafted (accounts/artwork preserved + Continue-with-Google + one-time link step).
**Profile-on-Google-login answer:** default Cognito creates a NEW empty account on Google sign-in even with matching email → MUST add Pre-SignUp Lambda (`AdminLinkProviderForUser`) to link Google→existing account AND resolve profile by email, else artists land in blank profiles. This is the make-or-break step.
**Build split:** AWS/user session does Google OAuth client + Cognito Google IdP + Hosted UI domain/callbacks + Pre-SignUp linking Lambda. Claude does backend Cognito-token validation (+profile-by-email) + frontend Amplify Auth (Google + email/password) + deploy.

**BUILD PROGRESS (2026-09-08, both compile clean):**
- AWS checklist written → `AWS_SETUP_CHECKLIST.md` (repo root) for the AWS session. Has a "VALUES TO HAND BACK" block (app client id, Hosted UI domain) needed to finish wiring.
- BACKEND (done, `npm run build:backend` ✓): added `aws-jwt-verify` dep; `src/auth/cognito/cognito.service.ts` (+module, @Global) verifies Cognito **ID token** via pool JWKS; rewrote `src/common/guards/jwt-auth.guard.ts` (kept class name JwtAuthGuard) → verifies token, resolves Mongo user by email (`findUserByEmail`), attaches to `request.user`; new users get `{email,cognitoSub,isNewUser:true}`. `auth.controller.ts` reduced to `GET /api/auth/me` (legacy own-JWT register/login/refresh/forgot/reset/verify + passport-google routes removed). Config: `COGNITO_REGION/USER_POOL_ID/APP_CLIENT_ID` added to config.schema + .env.example + .env.docker.example (allow '' so boots unconfigured).
- FRONTEND (done, `next build` ✓): added `aws-amplify` 6.20; `src/lib/amplify.ts` (configure from NEXT_PUBLIC_COGNITO_*, `getIdToken()` = ID token); `AmplifyProvider` in layout; `api.ts` attaches ID token (async) + 401→/auth/login (no manual refresh); `authStore.ts` → `loginWithEmail`(signIn) / `loginWithGoogle`(signInWithRedirect Google) / logout(signOut) / fetchUser(getIdToken+/me); login + register pages rebuilt (Continue-with-Google + email/password; register does Amplify signUp+confirm, stashes profile fields to localStorage `pendingProfile`); oauth callback listens Hub 'signInWithRedirect'. `frontend/.env.local.example` added.
**AWS VALUES RECEIVED (2026-09-08, from AWS session):** app client `6n3t3poh0co772eaahgvopcfn` is PUBLIC (no secret), supports USER_PASSWORD_AUTH + USER_SRP_AUTH; Hosted UI domain `https://kalacube.auth.ap-south-1.amazoncognito.com` already exists; issuer `https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_6Tz4OLn4d`. → email/password login + ID-token verification are TESTABLE NOW. Wired into `backend/.env` + `frontend/.env.local` (git-ignored). Google still BLOCKED: no Google IdP / OAuth-on-client / Pre-SignUp Lambda yet — all gated on **Prateek creating a Google OAuth client (id+secret) in Google Cloud Console** (redirect URI `https://kalacube.auth.ap-south-1.amazoncognito.com/oauth2/idpresponse`). Once he provides id+secret, AWS session flips GOOGLE_ENABLED + LAMBDA_ATTACHED and we test all 3 flows.
**GOOGLE CLIENT CREATED (2026-09-08):** project `kalacube`, client_id `152743922302-alo2t9k0uvcekv7hme22gbn5si6sti3r.apps.googleusercontent.com`; secret in `docs/client_secret_152743922302-...json` (now git-ignored via `**/client_secret_*.json`; never committed). Redirect URI verified = `https://kalacube.auth.ap-south-1.amazoncognito.com/oauth2/idpresponse`. NEXT: AWS session reads that file → adds Google IdP + enables OAuth on client + Lambda. ⚠️ Consent screen must be PUBLISHED (not Testing) before the artist email, else only test users can Google-login.

**SCHEMA RECONCILIATION — dry-run done + schema relaxed (2026-09-08).** Read-only dry-run (`.secrets/reconcile_dryrun.js`) transformed old→new in memory. Findings: 478 users, **0 dup usernames, 0 dup emails**, all role→artist, 360 legacyIdentityId preserved; artists 481, 0 missing/dup userId. Blockers = new schema `required` fields absent in legacy data: **dob missing 348/478, firstName 150/478, lastName 169/478, artDimensions empty 169/481**. FIX APPLIED (compiles): relaxed `dob/firstName/lastName` to optional in user.schema; `artDimensions` → default [] in artist-profile.schema; ADDED `legacyIdentityId` (indexed, preserves S3 key) + `legacyLocationPlaceId` to user.schema. username/email kept required+unique (data clean).
Mapping decided: preserve original _id across all collections (keeps artists.userId / art_works.artistId / S3 artworkId refs valid); user.socialLinks+website pulled from joined artists doc; location.city=old region, location.country=old country; authType=kalacube; role=role[0]. artistprofile.artDimensions derived via art_styles.domain join; statement=story, headline=tagLine(≤120).
**FULL DRY-RUN DONE (2026-09-08, `.secrets/reconcile_full_dryrun.js`, read-only) — ALL collections mapped + validated:**
- art_works 4146 (submitted 2123 / draft 2023). **2119 submitted resolve artist via artwork.artistId→artists._id→userId→identityId → valid S3 prefix `protected/{identityId}/artist_work/{_id}/`.** ~2027 unresolved ≈ the empty drafts (skip drafts). Target `artworks` shape: {_id, artist(userId), legacyArtistId, status,title,description,cost,currency, medium,material,theme,dimensions{h,w}, available, legacyArtStyleId, imagePrefix, timestamps}.
- alt_spaces 8 → `artspaces` (standalone, NOT user-linked): {_id,name,username,contactPerson,email,size,sqft,category,frequency,country,legacyLocationPlaceId,socialLinks,imagePrefix=`public/alt_space/{name}/`,...}.
- events 50 → `events` {_id,title,start,end,legacyAlternateSpaceId,legacyArtistId,...}.
- Reference/as-is (copy unchanged, preserve _id): art_styles 111, art_work_tags 132, user_roles 20 (obsolete), admins 4 (config).
- NOTE: new backend has NO Artwork/ArtSpace/Event Mongoose modules yet — migration writes these target shapes directly; build modules later (Module 2).

**TO EXECUTE migration (next):** need a WRITABLE target = fresh empty Atlas DB (recommend new DB `kalacube`, leave `05_202011_kalaCUBE` untouched = copy-only) + a read-WRITE Atlas user (readonly_migration can't write). Then run write-mode migration: users+artistprofiles (Tier 1, schema-reconciled) + artworks(submitted)+artspaces+events + reference copies. Then S3 `aws s3 sync` old→new bucket and populate concrete image URLs from imagePrefix.

- **NOT yet done / follow-ups:** need AWS "VALUES TO HAND BACK" to actually run it; NO live end-to-end test yet (needs Cognito domain+client). `forgot-password` page still calls removed backend endpoint → repoint to Amplify `resetPassword`. Onboarding flow for `isNewUser` (create Mongo profile from `pendingProfile`) not built. Legacy `auth.service.ts`/dtos/strategies still present but dead — prune later. **Old-vs-new Mongo schema reconciliation still unresolved** (existing DB uses userName/role[]; new schema uses username/role enum) — affects pointing new backend at existing Atlas DB.

**S3 IMAGES — user chose public-read + CloudFront (2026-09-09). PREP DONE, awaiting AWS.** artwork.schema has `images:[String]`; ExploreService returns images; all frontend tiles/detail render `images[0]` (fallback = title placeholder). Job ready: `.secrets/wire_images.js` — reads `.secrets/s3_keys.txt` (one S3 key per line) + `CDN_BASE` env, maps `protected/{identityId}/artist_work/{artworkId}/*` → artworks.images and `artist_profile/{profile_pic,cover_pic}` → user avatar (by legacyIdentityId), writes to local mongo (27018). **S3 IMAGES — DONE ✅ (2026-09-09).** Bucket `05-202011-kalacube-artist` was ALREADY public-read (policy PublicReadArtwork on protected/*, Public Access Block OFF) — no AWS change needed. Base URL `https://05-202011-kalacube-artist.s3.ap-south-1.amazonaws.com`; keys (4140) dumped to `.secrets/s3_keys.txt`. Ran `CDN_BASE=https://05-202011-kalacube-artist.s3.ap-south-1.amazonaws.com node .secrets/wire_images.js` → **2102/2123 artworks have image URLs, 267 avatars set.** URL-encoding per path segment (colon in identityId → %3A) confirmed correct in wire_images.js. Image verified loads (HTTP 200, content-type image). Optional prod polish later: CloudFront + OAC in front of the bucket.

**REMAINING WORK (no longer blocked):** get read-only AWS keys (or have AWS session run exports) → export Cognito users + `aws s3 sync` bucket; write migration scripts mapping old Mongo schema → new backend schemas + wiring image URLs; run into a NEW Atlas (staging) empty DB; verify counts; user approves; then cut over. Deploy per [[project_deployment_pipeline]].
**Cleanup owed:** remove temp Atlas `readonly_migration` user + `0.0.0.0/0` Network Access rule after migration.

**PAUSE POINT / NEXT ACTION (start here next session):**
1. Waiting for user to place old Mongo connection string in **`.secrets/mongo.uri`** (git-ignored dir `.secrets/` already created; verified `git check-ignore` passes). Instructed them to use `! printf '%s' 'mongodb+srv://...' > .../.secrets/mongo.uri`. NEVER echo this back, NEVER write it to memory, NEVER commit it.
2. Once file exists: run **read-only** inventory with `mongosh` (v2.8.2 installed) — `show collections`, `countDocuments()` per collection, sample ONE doc per collection to learn shape. NO writes/deletes/drops.
3. Report real counts (how many users / artworks actually exist).
4. Then need old **S3 bucket name + region + AWS keys** for images/artwork (separate from Mongo).
5. Then plan copy-only migration: old Mongo → new Atlas (map old schema → new `backend/src/user/schemas/*`), old S3 → new S3 bucket. Old passwords: if unhashed/compatible keep, else users reset.

Migration must complete + user-verify BEFORE the guided cloud deploy in [[project_deployment_pipeline]].
