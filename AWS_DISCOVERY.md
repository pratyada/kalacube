# KalaCUBE — AWS-side Discovery (read-only)
*Completed by the AWS-access session · 2026-09-08 · AWS account 333578919713 · region ap-south-1*

This is the AWS half of the migration (Cognito + S3). Everything below is **read-only findings** — nothing was created, changed, or deleted. Pair it with the Mongo inventory in the migration hub.

---

## 🔐 Cognito — RESOLVED

**User Pool** `kala_cube` → `ap-south-1_6Tz4OLn4d`
- **467 users** · MFA OFF · created 2021-05-22
- Each user has: `email`, `sub` (uuid), `UserStatus` (CONFIRMED / UNCONFIRMED), `email_verified`, Enabled
- These are **real Cognito User-Pool users** → fully exportable via `aws cognito-idp list-users` (paginate 60/page). **Passwords are NOT exportable** (Cognito never exposes hashes).

**Identity Pool** `kala_cube` → `ap-south-1:8900d046-2da1-497a-b296-13ae762c41bb`
- Linked to the User Pool above (provider `cognito-idp.ap-south-1.amazonaws.com/ap-south-1_6Tz4OLn4d`, app client `6n3t3poh0co772eaahgvopcfn`), AllowUnauthenticated = true.
- ⇒ Each Mongo `users.identityId` (`ap-south-1:…`) is that user's **Identity-Pool identity**, obtained after they authenticate against the User Pool.

**Reconciliation:** User Pool 467 · Mongo users 478 · Mongo with identityId 360. The ~118 Mongo users without an identityId likely never completed Cognito sign-in / are admin-created; some pool users are UNCONFIRMED (never verified email).

**Migration recommendation (auth):**
- **Best / seamless:** have the NEW app keep using **this same User Pool** (`ap-south-1_6Tz4OLn4d`). Zero user migration, zero password resets, logins unchanged.
- **Only if** the rebuild uses its own JWT auth: export the 467 users (email/sub/status), import them, and force a password reset by email (passwords can't be carried over). Match Mongo ↔ Cognito by **email**.

---

## 🖼️ S3 — #1 BLOCKER RESOLVED (key structure decoded)

**Prod bucket:** `05-202011-kalacube-artist` (ap-south-1)
- **4,140 objects · ~979 MB (~0.98 GB)** — small, trivial to copy.
- Other buckets are NOT prod: `05-202011-kalacube-artist-dev`, `kalacube-backup`, `kalacubetest` → ignore for migration.

**AWS Amplify Storage layout — every file maps back to Mongo:**
```
protected/{identityId}/artist_profile/cover_pic.png
protected/{identityId}/artist_profile/profile_pic.png
protected/{identityId}/artist_work/{artworkId}/{filename}
protected/{identityId}/artist_work/{artworkId}/{timestamp}/{filename}   (newer uploads)
public/alt_space/{spaceName}/profile_pic.png
public/alt_space/{spaceName}/events/{timestamp}/{filename}
public/alt_space/{spaceName}/gallery/{timestamp}/{filename}
```
- `{identityId}` = `ap-south-1:…` = **exactly the Mongo `users.identityId`**
- `{artworkId}` = **the Mongo `art_works._id`** (24-hex ObjectId, e.g. `63257d69c03d930009291fdd`)
- `{spaceName}` = the alt-space name (e.g. `Artcafe.Kalacube`, `Cafecomm`) — keyed by NAME, under `public/`
- **310** distinct `protected/{identityId}/` prefixes have content (of 360 Mongo users with an identityId).

**How to reconstruct images (the mapping the migration needs):**
1. Artwork images: for each `art_works` doc → look up its artist's `identityId` (join to `users`) → list `protected/{identityId}/artist_work/{art_works._id}/` (may have a `{timestamp}/` sublevel) → those objects are that artwork's images (often multiple).
2. Artist avatar/cover: `protected/{identityId}/artist_profile/{profile_pic|cover_pic}.png`
3. Alt-space media: `public/alt_space/{alt_spaces.name}/…`

**Copy plan:** `aws s3 sync s3://05-202011-kalacube-artist s3://<new-bucket>` (or download ~1 GB), then rewrite the front-end to serve `{new-bucket}/protected|public/…`. Because keys already encode identityId + artworkId, you can generate each artwork's image URL list programmatically without adding refs to Mongo (though writing them into the new schema is cleaner).

---

## Open decisions (for the user)
1. **Drafts:** migrate the ~2,023 mostly-empty draft artworks, or only the 2,123 submitted? (Recommend: submitted only; drafts as an optional second pass.)
2. **Auth:** keep the existing Cognito User Pool (seamless) vs. move to the rebuild's own auth (needs export + forced password reset).
3. **118 users with no identityId:** almost all have no S3 content; likely skip or import as login-only.

## Commands used (all read-only)
- `aws cognito-idp list-user-pools / describe-user-pool / list-users --region ap-south-1`
- `aws cognito-identity list-identity-pools / describe-identity-pool --region ap-south-1`
- `aws s3 ls` · `aws s3api list-objects-v2 --bucket 05-202011-kalacube-artist …` · `aws s3 ls --recursive --summarize`
