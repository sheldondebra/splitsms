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
