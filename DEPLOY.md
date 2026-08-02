# Deploy SplitSMS

Production URLs are defined in `config/site.json` (default: **https://www.splitsms.com**). After changing them, run:

```bash
npm run sync:site-config
```

## Environment

| Variable | Required | Notes |
|----------|----------|--------|
| `DATABASE_URL` | Yes | PostgreSQL (e.g. Neon) |
| `NEXT_PUBLIC_APP_URL` | Yes in production | e.g. `https://www.splitsms.com` |
| `SESSION_SECRET` | Yes | Long random string |
| `REDIS_URL` | Optional | BullMQ queue storage. Without workers, sends run inline on the web app. |
| `SMS_WORKERS_ENABLED` | Optional | Set to `true` only when `npm run worker:sms` runs on a separate host (Railway, Render, VPS). |
| `CRON_SECRET` | Recommended on Vercel | Protects `/api/cron/process-sms` (Vercel Cron sends `Authorization: Bearer …`). |
| `MAILJET_*` | For email OTP | See `.env.example` |

Optional: `NEXT_PUBLIC_API_BASE_URL` if the API is served from a different host (defaults to `{NEXT_PUBLIC_APP_URL}/api/v1`).

## Build

```bash
npm install
npx prisma generate
npm run build
npm run start
```

`npm run build` runs `sync:site-config` automatically (WordPress plugin PHP, Postman collection, `public/wordpress-plugin/version.json`).

## Cloud Run staging

Staging service: `splitsms-staging` in project `splitsms`, region `us-central1`.

Requires a `Dockerfile` (Next.js `output: "standalone"`) and env vars from your local `.env` (not committed).

```bash
npm run deploy:staging
```

The script (`scripts/deploy-staging.mjs`) loads `DATABASE_URL`, `SESSION_SECRET`, and `REDIS_URL` from `.env` / `.env.local`, builds from source, and deploys without printing secrets.

Overrides (optional): `GCP_PROJECT`, `CLOUD_RUN_SERVICE`, `CLOUD_RUN_REGION`, `STAGING_URL`.

Leave `SMS_WORKERS_ENABLED` unset so SMS sends inline in the web process (same default as Vercel).

## Cloud SQL (production database)

Instance: `splitsms-db` · Postgres 16 · `us-central1` · connection name `splitsms:us-central1:splitsms-db`

- Cloud Run connects via the Cloud SQL Auth socket (`/cloudsql/...`).
- Local `.env` uses the instance public IP with `sslmode=require`.
- Neon dump kept temporarily at `/tmp/splitsms-neon.dump` on the machine that ran the migration; keep Neon online 24–48h before deleting.

## Point `splitsms.com` / `www` at Cloud Run (Namecheap)

### Step 1 — Verify domain ownership with Google

In your own terminal (opens a browser):

```bash
gcloud domains verify splitsms.com
```

Complete the Google Site Verification flow (usually a **TXT** record on Namecheap).

**Namecheap → Domain List → Manage → Advanced DNS:**

| Type | Host | Value | TTL |
|------|------|--------|-----|
| TXT | `@` | *(value shown in the Google verify wizard)* | Automatic |

Wait until Google says verified (often a few minutes).

### Step 2 — Create Cloud Run domain mappings

```bash
gcloud beta run domain-mappings create \
  --service=splitsms-staging \
  --domain=splitsms.com \
  --region=us-central1 \
  --project=splitsms

gcloud beta run domain-mappings create \
  --service=splitsms-staging \
  --domain=www.splitsms.com \
  --region=us-central1 \
  --project=splitsms

gcloud beta run domain-mappings describe --domain=www.splitsms.com \
  --region=us-central1 --project=splitsms
```

Use the `resourceRecords` from that output if they differ from the defaults below.

### Step 3 — DNS records in Namecheap (typical Cloud Run values)

Remove old A/CNAME records that pointed at Vercel/cPanel/hosting for `@` and `www` (keep email MX untouched).

| Type | Host | Value | TTL |
|------|------|--------|-----|
| A | `@` | `216.239.32.21` | Automatic |
| A | `@` | `216.239.34.21` | Automatic |
| A | `@` | `216.239.36.21` | Automatic |
| A | `@` | `216.239.38.21` | Automatic |
| CNAME | `www` | `ghs.googlehosted.com.` | Automatic |

Optional IPv6 (if Namecheap shows AAAA and mapping requires it):

| Type | Host | Value |
|------|------|--------|
| AAAA | `@` | `2001:4860:4802:32::15` |
| AAAA | `@` | `2001:4860:4802:34::15` |
| AAAA | `@` | `2001:4860:4802:36::15` |
| AAAA | `@` | `2001:4860:4802:38::15` |

### Step 4 — Wait and test

DNS can take 5 minutes to 48 hours (often under an hour). Then open:

- https://www.splitsms.com  
- https://splitsms.com  

Managed certificates are issued by Google after DNS is correct.

### Step 5 — After cutover is stable

- Do **not** delete Neon until you confirm logins and critical flows on the new DB.
- Then delete the Neon project when ready.
## SMS workers

By default on Vercel, SMS sends **inline** in the web process (no separate worker required).

Set `SMS_WORKERS_ENABLED=true` only when you host BullMQ workers separately with the same `DATABASE_URL` and `REDIS_URL`:

```bash
npm run worker:sms
```

Use Railway, Render, Fly.io, or a VPS for workers when sending very high volume.

A Vercel Cron job (`/api/cron/process-sms`, every minute) drains any stuck `PENDING` messages when workers are not enabled.

## WordPress plugin

Bump `wordpressPlugin.version` in `config/site.json`, run `sync:site-config`, deploy, then build the plugin zip per `wordpress-plugin/RELEASE.md`.
