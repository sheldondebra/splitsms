# Cloud Run Staging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the SplitSMS Next.js app to Cloud Run as `splitsms-staging` with a public `*.run.app` URL.

**Architecture:** Multi-stage Docker image with Next.js standalone output; `gcloud run deploy --source` builds via Cloud Build and deploys one service in `us-central1`. Staging reuses Neon + existing secrets; SMS sends inline (no workers).

**Tech Stack:** Next.js 16, Prisma, Docker, Cloud Run, Cloud Build, gcloud CLI

## Global Constraints

- GCP project ID: `splitsms`
- Service name: `splitsms-staging`
- Region: `us-central1`
- Do not commit `.env` / secrets
- Do not change production DNS

---

## File map

| File | Responsibility |
|------|----------------|
| `next.config.ts` | Enable `output: "standalone"` for slim container |
| `Dockerfile` | Multi-stage build/run for Cloud Run |
| `.dockerignore` | Keep build context small |
| `DEPLOY.md` | Document Cloud Run staging steps |

---

### Task 1: Containerize the Next.js app

**Files:** `next.config.ts`, `Dockerfile`, `.dockerignore`

- [ ] Add `output: "standalone"` to `next.config.ts`
- [ ] Add multi-stage `Dockerfile` (deps → build → runner on Node 22 Alpine)
- [ ] Add `.dockerignore` (node_modules, .next, .git, .env*, etc.)
- [ ] Ensure `PORT` defaults to 8080 for Cloud Run

### Task 2: Enable GCP APIs and deploy

- [ ] Enable `run.googleapis.com`, `cloudbuild.googleapis.com`, `artifactregistry.googleapis.com`
- [ ] Deploy with `gcloud run deploy --source` and required env vars from local `.env` (without printing secrets)
- [ ] Update `NEXT_PUBLIC_APP_URL` to the assigned Cloud Run URL and redeploy/update if needed
- [ ] Verify HTTP 200 on the service URL

### Task 3: Document staging deploy

**Files:** `DEPLOY.md`

- [ ] Add Cloud Run staging section (commands, env vars, region, notes about inline SMS)
