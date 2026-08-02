# Google Sign-In Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google login/signup with post-signup phone + SMS OTP verification, wired into SplitSMS’s existing JWT sessions.

**Architecture:** Authorization-code OAuth with PKCE against Google; callback links or starts a pending-Google cookie; `/complete-phone` creates the user and reuses the existing OTP verify path.

**Tech Stack:** Next.js App Router, Prisma/PostgreSQL, jose cookies, Google OAuth 2.0 + userinfo, existing OTP/SMS pipeline.

## Global Constraints

- Keep custom `splitsms_session` JWT auth; do not add NextAuth/Supabase Auth.
- Phone remains required and unique for every Member account.
- Google-only users use `generateOtpOnlyPassword()` hashed into `passwordHash`.
- Do not commit real `GOOGLE_CLIENT_SECRET` to git.

---

### Task 1: Schema + Google auth helpers

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `lib/auth/google.ts`
- Create: `tests/auth/google-pending.test.ts`

- [ ] Add `googleId String? @unique` on `User`
- [ ] Implement PKCE, signed OAuth state, pending cookie, token exchange helpers
- [ ] Unit-test pending cookie round-trip

### Task 2: OAuth routes + complete-phone flow

**Files:**
- Create: `app/api/auth/google/route.ts`
- Create: `app/api/auth/google/callback/route.ts`
- Create: `app/(auth)/complete-phone/page.tsx`
- Create: `components/auth/complete-phone-form.tsx`
- Modify: `lib/actions/auth.ts`
- Modify: `middleware.ts`

- [ ] Start + callback routes
- [ ] `completeGooglePhoneAction` creates user from pending cookie and sends SIGNUP_VERIFY OTP
- [ ] Middleware includes `/complete-phone`

### Task 3: UI + alerts + GCP/env

**Files:**
- Create: `components/auth/google-auth-button.tsx`
- Modify: `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`
- Modify: `components/auth/auth-alert.tsx`
- Modify: `.env` / `.env.local` (local only)
- Modify: `DEPLOY.md` (env docs)

- [ ] Google button on login + signup
- [ ] Alert messages for Google errors
- [ ] Create/configure OAuth web client in GCP project `splitsms` (Console if CLI cannot)
- [ ] Set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

### Task 4: Verify

- [ ] Run unit tests for google helpers
- [ ] `npx tsc --noEmit` or project lint/typecheck path used in repo
- [ ] Smoke the OAuth start redirect when credentials are present
