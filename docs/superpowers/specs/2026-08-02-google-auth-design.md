# Google Sign-In Design

## Goal

Let users sign up and sign in with Google on SplitSMS, then collect and SMS-verify a phone number for new Google accounts, while linking Google to existing accounts when the email already matches.

## Decisions

- Native Google OAuth authorization-code flow + existing JWT session cookies (no NextAuth/Supabase).
- “Continue with Google” on both `/login` and `/signup`.
- New Google users: enter phone → SMS OTP → account created/verified → dashboard.
- Existing account with same email: link `googleId` and sign in (skip phone if already verified).
- Reseller invite / branded host preserved through OAuth `state`.

## User flow

1. User clicks **Continue with Google**.
2. App redirects to Google with PKCE + signed `state`.
3. Callback at `/api/auth/google/callback` verifies code/state.
4. If `googleId` or email matches an existing user → link if needed → create session → destination.
5. Otherwise set a short-lived pending-Google cookie → `/complete-phone`.
6. User submits country + phone → create unverified user (or reject if phone taken) → SMS OTP → existing `/verify-otp` signup path → welcome credits → session.

## Data model

- `User.googleId String? @unique` stores Google `sub`.
- Google-only users get a random unusable `passwordHash` (same pattern as OTP-only signup).
- Pending Google identity lives in a signed httpOnly cookie (`splitsms_google_pending`, ~15 minutes), not a DB row.

## GCP / env

- Project: `splitsms`
- OAuth consent screen (External) + Web client
- Redirect URIs: `http://localhost:3000/api/auth/google/callback`, `https://www.splitsms.com/api/auth/google/callback`
- Env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (plus existing `SESSION_SECRET`, `NEXT_PUBLIC_APP_URL`)

## Components

- `lib/auth/google.ts` — PKCE, state, token exchange, pending cookie, userinfo
- `GET /api/auth/google` — start OAuth
- `GET /api/auth/google/callback` — finish OAuth / link / pending
- `/complete-phone` + form action — phone + OTP kickoff for pending Google
- `components/auth/google-auth-button.tsx` — UI on login/signup
- Middleware allows `/complete-phone` like other auth pages

## Errors

`google_denied`, `google_failed`, `google_email_missing`, `google_config`, `phone_taken`, `session` (expired pending), plus existing OTP errors.

## Security

- PKCE + signed state; validate on callback.
- Pending cookie signed with `SESSION_SECRET`, httpOnly, SameSite=Lax, short TTL.
- Never trust client-supplied Google identity without token verification.
- Suspended members blocked the same as password login.

## Tests

- Pending cookie encode/decode and expiry rejection.
- Link-by-email vs create-new decision helpers.
- Manual: new Google → phone → OTP → dashboard; returning Google login; email link.
