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
| `REDIS_URL` | For queues | SMS workers and background jobs |
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

Queue workers do **not** run inside the Next.js web process. Host them separately with the same `DATABASE_URL` and `REDIS_URL`:

```bash
npm run worker:sms
```

Use Railway, Render, Fly.io, or a VPS for workers.

## WordPress plugin

Bump `wordpressPlugin.version` in `config/site.json`, run `sync:site-config`, deploy, then build the plugin zip per `wordpress-plugin/RELEASE.md`.
