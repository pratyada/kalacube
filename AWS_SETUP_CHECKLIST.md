# AWS Setup Checklist — Cognito + Google one-tap login

**For the AWS-access session.** Goal: add **"Continue with Google" (signup + login)** to the existing Cognito User Pool, and make Google sign-in **open the artist's existing profile** (not a new empty account).

Context (from `AWS_DISCOVERY.md`):
- Account `333578919713`, region **`ap-south-1`**
- User Pool **`ap-south-1_6Tz4OLn4d`** (`kala_cube`), existing app client **`6n3t3poh0co772eaahgvopcfn`**
- Identity Pool `ap-south-1:8900d046-2da1-497a-b296-13ae762c41bb`
- 467 existing email/password users; **93% have Gmail** so most will use Google.

> ⚠️ **The make-or-break step is #4 (account-linking Lambda).** Without it, an existing user who clicks "Sign in with Google" gets a **new empty account** even though the email matches — they'd lose sight of their profile + artwork. Do not skip it.

When done, **fill in the "VALUES TO HAND BACK" section at the bottom** — the app build needs those exact strings.

---

## 1. Google OAuth client (Google Cloud Console)
1. Google Cloud Console → create/select a project (e.g. "KalaCUBE").
2. **APIs & Services → OAuth consent screen** → External → fill app name, support email, logo. Add scopes `email`, `profile`, `openid`. Publish (or add test users for now).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application**.
4. **Authorized JavaScript origins:** your Cognito Hosted UI domain (from step 3 below), e.g. `https://kalacube.auth.ap-south-1.amazoncognito.com`
5. **Authorized redirect URI:** `https://<your-cognito-domain>/oauth2/idpresponse`
6. Save → copy **Client ID** and **Client secret**.

## 2. Add Google as an Identity Provider on the User Pool
Console: Cognito → User pool `ap-south-1_6Tz4OLn4d` → **Sign-in experience → Federated identity provider sign-in → Add identity provider → Google**.
- Client ID / Client secret: from step 1
- Authorized scopes: `profile email openid`
- **Attribute mapping (critical):** map Google `email` → Cognito `email`. Also map `name`/`given_name`/`family_name` if desired.

CLI equivalent:
```bash
aws cognito-idp create-identity-provider \
  --user-pool-id ap-south-1_6Tz4OLn4d --region ap-south-1 \
  --provider-name Google --provider-type Google \
  --provider-details client_id=<GOOGLE_CLIENT_ID>,client_secret=<GOOGLE_CLIENT_SECRET>,authorize_scopes="profile email openid" \
  --attribute-mapping email=email,name=name,given_name=given_name,family_name=family_name
```

## 3. Hosted UI domain + app client settings
1. Cognito → User pool → **App integration → Domain** → create a Cognito domain, e.g. `kalacube` → `https://kalacube.auth.ap-south-1.amazoncognito.com`. (Go back and paste this into step 1.4/1.5.)
2. Cognito → **App integration → App client `6n3t3poh0co772eaahgvopcfn` → Edit Hosted UI:**
   - **Identity providers:** enable **Cognito user pool** AND **Google**
   - **Allowed callback URLs:** MUST match the port the frontend actually runs on.
     Local dev currently runs on **:3005** (3000/3001 were taken), so add BOTH:
     `http://localhost:3005/auth/oauth/callback` AND `http://localhost:3000/auth/oauth/callback`
     (+ prod `https://<your-domain>/auth/oauth/callback`).
     NOTE: a `redirect_mismatch` error at the Hosted UI = the app's port isn't in this list.
   - **Allowed sign-out URLs:** `http://localhost:3005/`, `http://localhost:3000/`, prod `https://<your-domain>/`
   - **OAuth grant types:** Authorization code grant
   - **OpenID Connect scopes:** `openid`, `email`, `profile`
3. Confirm the app client is a **public client** (no secret) — the SPA uses PKCE. If it currently has a secret, create a new public app client for the web app and hand back its ID.

## 4. Account-linking Pre-SignUp Lambda ⭐ (the important one)
Purpose: when a Google sign-in arrives whose email matches an existing native (email/password) user, **link** the Google identity to that existing user instead of creating a duplicate.

1. Lambda (Node.js), env region `ap-south-1`, with IAM permission `cognito-idp:AdminLinkProviderForUser` and `cognito-idp:ListUsers` on the pool.
2. Handler logic:
```js
const { CognitoIdentityProviderClient, ListUsersCommand, AdminLinkProviderForUserCommand }
  = require('@aws-sdk/client-cognito-identity-provider');
const c = new CognitoIdentityProviderClient({ region: 'ap-south-1' });

exports.handler = async (event) => {
  // Only act on external (Google) sign-ups: userName looks like "Google_<sub>"
  if (event.triggerSource === 'PreSignUp_ExternalProvider') {
    const email = event.request.userAttributes.email;
    const found = await c.send(new ListUsersCommand({
      UserPoolId: event.userPoolId, Filter: `email = "${email}"`, Limit: 1,
    }));
    const existing = found.Users?.[0];
    if (existing) {
      const [providerName, providerValue] = event.userName.split('_'); // "Google", "<sub>"
      await c.send(new AdminLinkProviderForUserCommand({
        UserPoolId: event.userPoolId,
        DestinationUser: { ProviderName: 'Cognito', ProviderAttributeValue: existing.Username },
        SourceUser: { ProviderName: providerName, ProviderAttributeName: 'Cognito_Subject', ProviderAttributeValue: providerValue },
      }));
    }
  }
  return event;
};
```
3. Cognito → User pool → **Extensions/Triggers → Pre sign-up** → attach this Lambda.

> Note: after linking, the linked user signs in as the **original** user (same `sub`), so the app resolves the same profile. Their **email is the stable join key** to the Mongo profile — the app looks the artist up by email.

## 5. (Optional now, needed for prod) note the JWKS + issuer
The app validates tokens against:
- Issuer: `https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_6Tz4OLn4d`
- JWKS:   `https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_6Tz4OLn4d/.well-known/jwks.json`

---

## VALUES TO HAND BACK (paste these into the migration hub / memory)
```
COGNITO_REGION            = ap-south-1
COGNITO_USER_POOL_ID      = ap-south-1_6Tz4OLn4d
COGNITO_APP_CLIENT_ID     = __________   (public/SPA client used for Hosted UI)
COGNITO_HOSTED_UI_DOMAIN  = https://__________.auth.ap-south-1.amazoncognito.com
GOOGLE_ENABLED_ON_POOL    = yes/no
PRESIGNUP_LAMBDA_ATTACHED = yes/no
CALLBACK_URLS             = http://localhost:3000/auth/oauth/callback , https://<prod>/auth/oauth/callback
```

## Test before we send the artist email
1. Existing email/password user → Hosted UI login → lands in their profile. ✅
2. **Same** user clicks "Continue with Google" (same email) → **still their profile, not a new one** (proves linking works). ✅
3. Brand-new Google email → creates a fresh account. ✅
