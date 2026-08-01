# Cloud Run Staging Deploy — Design

**Date:** 2026-08-01  
**Status:** Approved  
**Goal:** Deploy SplitSMS web app to Cloud Run as a staging environment with a `*.run.app` URL.

## Context

- GCP project: `splitsms` (billing linked to `My Billing Account 1`)
- App: Next.js 16 + Prisma (Postgres) + optional Redis/BullMQ
- Existing production URLs remain on current hosting (`www.splitsms.com`)
- Staging reuses existing Neon `DATABASE_URL` and current env secrets from local `.env`

## Approach

**Source deploy via Dockerfile** (`gcloud run deploy --source`).

- One Cloud Run service: `splitsms-staging`
- Region: `us-central1`
- SMS workers disabled (inline send, same as default Vercel behavior)
- No custom domain, Cloud SQL, or Memorystore for this pass

## Components

| Piece | Decision |
|-------|----------|
| Container | Multi-stage Dockerfile, Next.js `output: "standalone"` |
| Build | Cloud Build from source |
| Runtime | Cloud Run, port `8080`, public unauthenticated for staging |
| Config | Env vars on the service (`DATABASE_URL`, `SESSION_SECRET`, `REDIS_URL`, `NEXT_PUBLIC_APP_URL`) |
| Cron | Out of scope initially; optional Cloud Scheduler later |

## Non-goals

- Production DNS / `www.splitsms.com`
- Separate worker Cloud Run services
- Migrating database to Cloud SQL
- Secret Manager (env vars sufficient for staging; secrets stay out of git)

## Success criteria

1. `https://splitsms-staging-….run.app` serves the app
2. App connects to Neon with existing `DATABASE_URL`
3. Health/login pages load without container crash loops
