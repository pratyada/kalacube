# KalaCUBE Backend — Serverless (Lambda + API Gateway) Deployment Runbook

Deploys the NestJS API (`backend/`) to **AWS Lambda + API Gateway HTTP API** in
**ap-south-1**, replacing the legacy EC2 box at `api.kalacube.com`
(`52.66.44.237`). Frontend is deployed separately (S3+CloudFront / Amplify).

> This is a SCAFFOLD. Nothing here has been deployed. A human runs the commands
> below. No secrets are committed — all sensitive values live in SSM Parameter
> Store and are pulled at deploy time by `backend/serverless.yml`.

---

## 1. What was scaffolded

| File | Purpose |
|------|---------|
| `backend/src/lambda.ts` | Lambda handler. Wraps `AppModule` in an Express adapter via `@codegenie/serverless-express`; caches the bootstrapped app in a module-level promise for warm reuse; `app.init()` (no `listen()`); sets `callbackWaitsForEmptyEventLoop = false`; CORS + `ValidationPipe` mirror `main.ts`. |
| `backend/serverless.yml` | Serverless Framework v3 service: HTTP API (catch-all route), Node 20 arm64 Lambda from `dist/`, env wired from SSM, S3 IAM policy, custom-domain notes. |
| `backend/src/app.module.ts` (edited) | Mongoose connection tuned for Lambda reuse (`bufferCommands`, small pool). Bull Redis factory now accepts optional TLS + password (Upstash) behind env flags — local dev path unchanged. |
| `backend/src/config/config.schema.ts` (edited) | Added optional `REDIS_PASSWORD` + `REDIS_TLS`. |
| `backend/package.json` (edited) | Added `build:lambda`, `package`, `deploy`, `deploy:offline` scripts and deploy deps. |

`main.ts` is untouched — the EC2 / `node dist/main` path still works as the rollback target.

---

## 2. Prerequisites (one-time)

- Node 20 + npm 10, repo cloned, on the deploying machine.
- **Serverless Framework v3** — installed as a backend devDependency. Run it with
  `npx serverless ...` or the npm scripts below. (v3 is Apache-2.0 / free; do NOT
  `npm i -g serverless@4` — v4 requires a license key.)
- AWS credentials for account **333578919713** with permission to create
  Lambda, API Gateway, IAM roles, CloudFormation stacks, and read SSM. Export a
  profile before deploying:
  ```bash
  export AWS_PROFILE=kalacube-prod   # or AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
  export AWS_REGION=ap-south-1
  ```
- **MongoDB Atlas Serverless** cluster reachable from the public internet
  (Lambda here is NOT in a VPC). Atlas Network Access must allow `0.0.0.0/0`
  (or use AWS PrivateLink later). Get its SRV `MONGO_URI`.
- **Upstash Redis** database (serverless, TLS) for the Bull email queue — see §5.

---

## 3. Required AWS values / secrets (create in SSM first)

Create these SSM parameters (Standard tier; use `SecureString` for anything
secret). `serverless.yml` reads them at deploy time — nothing is hardcoded.

```bash
REGION=ap-south-1
put() { aws ssm put-parameter --region $REGION --name "$1" --type "$2" --value "$3" --overwrite; }

put /kalacube/prod/CLIENT_URL           String       "https://kalacube.com"
put /kalacube/prod/MONGO_URI            SecureString "mongodb+srv://USER:PASS@cluster.mongodb.net/kalacube?retryWrites=true&w=majority"
put /kalacube/prod/JWT_ACCESS_SECRET    SecureString "<random-32+ chars>"
put /kalacube/prod/JWT_REFRESH_SECRET   SecureString "<random-32+ chars>"
put /kalacube/prod/AWS_STORAGE_BUCKET   String       "05-202011-kalacube-artist"
put /kalacube/prod/AWS_ACCESS_KEY       SecureString "<s3 key — or leave empty to use the Lambda role>"
put /kalacube/prod/AWS_SECRET_KEY       SecureString "<s3 secret — or empty>"
put /kalacube/prod/COGNITO_REGION       String       "ap-south-1"
put /kalacube/prod/COGNITO_USER_POOL_ID String       "ap-south-1_6Tz4OLn4d"
put /kalacube/prod/COGNITO_APP_CLIENT_ID String      "<app client id>"
put /kalacube/prod/REDIS_HOST           String       "<xxxx>.upstash.io"
put /kalacube/prod/REDIS_PORT           String       "6379"
put /kalacube/prod/REDIS_PASSWORD       SecureString "<upstash password>"
put /kalacube/prod/REDIS_TLS            String       "true"
put /kalacube/prod/EMAIL_USERNAME       SecureString "<gmail address>"
put /kalacube/prod/EMAIL_PASSWORD       SecureString "<gmail app password>"
# Optional OAuth (app boots without them):
# put /kalacube/prod/GOOGLE_CLIENT_ID ... etc.
```

**`AWS_REGION` is intentionally NOT an SSM param / env var** — it is a *reserved*
Lambda runtime variable. The runtime sets it to the function's region
(`ap-south-1`), which satisfies the app's `AWS_REGION` config requirement. Trying
to set it in `serverless.yml` would fail the deploy.

---

## 4. Deploy (the exact human commands)

```bash
cd backend

# 1) Build the TypeScript -> dist/ (includes dist/lambda.js + dist/email/templates/*.hbs)
npm run build:lambda

# 2) Materialize a self-contained PRODUCTION node_modules for packaging.
#    IMPORTANT (monorepo gotcha): this is an npm-workspaces repo, so deps hoist to
#    the REPO ROOT and `backend/node_modules` is empty by default. serverless.yml
#    uses native packaging (ships dist/ + node_modules), so backend needs its own
#    prod deps present. Produce them without disturbing the root install:
npm install --omit=dev --install-links --workspaces=false
#    If your npm still hoists (backend/node_modules stays empty), use the fallback:
#      mkdir -p /tmp/kc-build && cp package.json /tmp/kc-build/ && \
#      (cd /tmp/kc-build && npm install --omit=dev) && cp -R /tmp/kc-build/node_modules ./node_modules

# 3) Dry-run the package to inspect the zip (optional, no AWS mutation):
npm run package            # -> .serverless/kalacube-api.zip

# 4) Deploy (creates/updates the CloudFormation stack, Lambda, HTTP API):
npm run deploy             # === npx serverless deploy --stage prod
#    Note the printed HttpApi endpoint URL (https://xxxx.execute-api.ap-south-1.amazonaws.com).

# 5) Restore your dev workspace afterwards (re-hoist dev deps):
cd .. && npm install
```

**Smoke test** against the printed endpoint (routes already include `/api`):
```bash
curl -i https://xxxx.execute-api.ap-south-1.amazonaws.com/api/explore/artists?limit=1
```
Expect `200` with JSON. A guarded route without a token should `401` (proves the
Cognito/JWT guard is live).

Local emulation without deploying: `npm run deploy:offline` (serverless-offline).

---

## 5. The Redis problem — analysis & decision

Bull (the email queue) needs a persistent Redis. A VPC-less Lambda cannot reach
ElastiCache easily, and per-invocation Redis connections are wasteful.

| Option | Change size | Verdict |
|--------|-------------|---------|
| **(a) Upstash serverless Redis, keep Bull** | Tiny — TLS+password over the internet, wired behind `REDIS_TLS`/`REDIS_PASSWORD` env flags (DONE). | **Chosen for launch.** |
| (b) Drop Bull in Lambda, send email synchronously via SES/SMTP | Medium — must edit `email.service.ts`/`email.module.ts` (owned by another agent). | Simplest *robust* interim; defer to email owner. |
| (c) SQS + separate worker Lambda | Large — new queue + worker fn + rewrite `EmailService` to enqueue to SQS; native retries + DLQ. | **Correct long-term / production-grade.** |

**Recommendation: (a) for launch, plan to move to (c).**

- **Why (a) now:** it is the smallest change, keeps local⇄prod parity (same Bull
  code path), and Upstash is reachable from a VPC-less Lambda over TLS. It's
  already wired: set `REDIS_TLS=true` + `REDIS_PASSWORD` in SSM and Bull connects
  to Upstash; locally those flags are absent so nothing changes. The existing
  Bull path is NOT ripped out.
- **Real caveat you must accept:** Bull's `@Processor` runs an *in-process*
  worker that only advances while the Lambda container is warm (not frozen). A
  job enqueued at the end of a request may not be drained until the container is
  next invoked/thawed, so verification/welcome emails can be **delayed**. For the
  current low volume of transactional email this is acceptable at launch, but it
  is why (c) is the right destination.
- **Upstash limits:** watch the max-concurrent-connections cap and per-command
  pricing (Bull uses blocking pops). Keep Lambda reserved concurrency modest.
- **Migration path to (c):** add an SQS queue + a worker Lambda subscribed to it;
  change `EmailService.sendEmail` to `sqs.sendMessage` and move the
  `mailerService.sendMail` call into the worker. No Redis, native retries/DLQ.
  (Requires edits to the email module — coordinate with its owner.)

---

## 6. Custom domain — `api.kalacube.com`

The HTTP API deploys with an `execute-api` URL first. Then map the vanity domain:

1. **ACM cert (regional, ap-south-1):**
   ```bash
   aws acm request-certificate --region ap-south-1 \
     --domain-name api.kalacube.com --validation-method DNS
   ```
   Add the returned CNAME validation record in Route53; wait for `ISSUED`.
2. **API Gateway custom domain + mapping:**
   ```bash
   aws apigatewayv2 create-domain-name --region ap-south-1 \
     --domain-name api.kalacube.com \
     --domain-name-configurations CertificateArn=<ACM_ARN>,EndpointType=REGIONAL
   # then create an API mapping from api.kalacube.com -> this HTTP API, stage $default
   aws apigatewayv2 create-api-mapping --region ap-south-1 \
     --domain-name api.kalacube.com --api-id <HTTP_API_ID> --stage '$default'
   ```
   (Or automate steps 1–2 with the `serverless-domain-manager` plugin +
   `npx serverless create_domain`.)
3. **Route53 DNS flip (the cutover):** update the `api.kalacube.com` record from
   the EC2 A-record (`52.66.44.237`) to an **A/AAAA alias** targeting the API
   Gateway regional domain target (from `get-domain-name`). This is the moment
   traffic moves off EC2.

---

## 7. Rollback

The EC2 box and `main.ts` path are unchanged — keep the instance **running** as a
hot fallback through launch.

- **Fast rollback (DNS):** in Route53, point `api.kalacube.com` back to the EC2
  A-record `52.66.44.237`. Traffic returns to EC2 within the record TTL — keep
  the TTL low (60s) during cutover.
- **Tear down the serverless stack (optional):** `npx serverless remove --stage prod`.
- Decommission EC2 only after the Lambda stack has been stable in production.

---

## 8. Open risks / follow-ups

- **Cold starts:** NestFactory bootstrap adds ~1–3s on cold invocations. Mitigate
  with provisioned concurrency if latency matters.
- **Mongo Atlas from public Lambda** requires `0.0.0.0/0` network access (or
  PrivateLink). Ensure the Atlas cluster is Serverless/M-tier reachable publicly.
- **Bull-worker freeze** (see §5) — accepted for launch; migrate to SQS+worker.
- **Static S3 keys:** the Lambda already has an S3 IAM role; migrate the S3 module
  off `AWS_ACCESS_KEY`/`AWS_SECRET_KEY` to role creds when that module can change.
- **Gmail SMTP** deliverability/limits — consider Amazon SES for production.
- **Payload size:** API Gateway caps request/response at ~10MB; large artwork
  uploads should go direct-to-S3 via presigned URLs (the S3 module already
  presigns) rather than proxied through the Lambda.
- **Monorepo packaging** (§4 step 2) is the fiddliest human step — verify
  `backend/node_modules` is populated before `serverless deploy`.
