# Production Cutover: Cloud SQL + Domain — Design

**Date:** 2026-08-01  
**Status:** Approved (approach A)  
**Goal:** Move Postgres from Neon to Cloud SQL, point `splitsms.com` / `www.splitsms.com` at Cloud Run, keep a short maintenance window.

## Approach

Cloud SQL for PostgreSQL with public IP + SSL; `pg_dump` / `pg_restore` from Neon during a write freeze; Cloud Run custom domain mapping; Namecheap DNS records provided to the operator.

## Scope

| In | Out |
|----|-----|
| Cloud SQL Postgres 16 in `us-central1` | Private VPC / AlloyDB |
| Full DB migrate (users + all tables) | Redis/Memorystore (keep inline SMS if Redis unavailable) |
| Cloud Run `DATABASE_URL` update | Immediate Neon deletion (keep 24–48h rollback) |
| Domain mapping + DNS instructions for Namecheap | cPanel app hosting changes beyond DNS |

## Domains

- `splitsms.com`
- `www.splitsms.com`

## Success criteria

1. Cloud SQL holds migrated data; app login works against it.
2. Cloud Run serves the mapped domains (after DNS propagates).
3. Operator has exact Namecheap A/CNAME/TXT records.
4. Neon left intact until explicit delete confirmation.
