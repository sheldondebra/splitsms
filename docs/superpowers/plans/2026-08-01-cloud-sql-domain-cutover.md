# Cloud SQL + Domain Cutover Implementation Plan

> **For agentic workers:** Use executing-plans / implement task-by-task.

**Goal:** Create Cloud SQL, migrate Neon data, wire Cloud Run, output Namecheap DNS steps.

**Architecture:** Public-IP Cloud SQL Postgres 16; dump/restore; Cloud Run domain mappings for apex + www.

**Tech Stack:** gcloud, Cloud SQL, pg_dump/pg_restore, Cloud Run

## Global Constraints

- Project: `splitsms`
- Region: `us-central1`
- Domains: `splitsms.com`, `www.splitsms.com`
- Do not delete Neon in this plan
- Do not print DB passwords in logs

---

### Task 1: Provision Cloud SQL

- [ ] Enable `sqladmin.googleapis.com`
- [ ] Create instance `splitsms-db`, Postgres 16, small tier, public IP, SSL
- [ ] Create DB `splitsms` and user; store password securely for env update

### Task 2: Migrate data from Neon

- [ ] `pg_dump` Neon (custom or plain SQL)
- [ ] `pg_restore` / `psql` into Cloud SQL
- [ ] Spot-check table counts

### Task 3: Point Cloud Run at Cloud SQL

- [ ] Update Cloud Run service `DATABASE_URL`
- [ ] Verify health/login against Cloud SQL

### Task 4: Domain mapping + DNS instructions

- [ ] Create Cloud Run domain mappings for `splitsms.com` and `www.splitsms.com`
- [ ] Document exact Namecheap records for the user
