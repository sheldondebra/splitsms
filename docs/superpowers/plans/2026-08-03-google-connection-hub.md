# Google Integrations — Phase 1 Connection Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a shared Google connection hub so logged-in members can connect/disconnect Google with an encrypted refresh token and incremental scopes, ready for Contacts/Sheets/Forms.

**Architecture:** Separate OAuth connect flow from Google login. Persist one `GoogleConnection` per user. Feature modules call `getAccessTokenForUser(userId, requiredScopes)`.

**Tech Stack:** Next.js 16, Prisma/PostgreSQL, jose PKCE/state (existing patterns), Node `crypto` AES-256-GCM, native `fetch` to Google token endpoints.

**Spec:** `docs/superpowers/specs/2026-08-03-google-integrations-design.md`

## Global Constraints

- Do not change Google **login** scopes or `/api/auth/google/*` behavior.
- Never expose refresh/access tokens to the client.
- One Google connection per SplitSMS user.
- Reuse `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
- Follow existing dashboard page-shell / WordPress integration UI patterns.
- Tests use `node:test` + `node:assert/strict` like `tests/auth/google-pending.test.ts`.

---

### Task 1: Token encryption helper

**Files:**
- Create: `lib/google/crypto.ts`
- Test: `tests/google/crypto.test.ts`

**Interfaces:**
- Produces: `encryptToken(plain: string): string`, `decryptToken(encrypted: string): string`

- [ ] **Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { decryptToken, encryptToken } from "../../lib/google/crypto";

test("encryptToken round-trips", () => {
  process.env.SESSION_SECRET = "test-session-secret-for-google-crypto";
  delete process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  const enc = encryptToken("refresh-token-abc");
  assert.match(enc, /^v1:/);
  assert.equal(decryptToken(enc), "refresh-token-abc");
});

test("decryptToken rejects tampered ciphertext", () => {
  process.env.SESSION_SECRET = "test-session-secret-for-google-crypto";
  const enc = encryptToken("secret");
  assert.throws(() => decryptToken(enc.slice(0, -2) + "xx"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/google/crypto.test.ts`  
Expected: FAIL (module not found)

- [ ] **Step 3: Write minimal implementation**

```ts
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

function getKey(): Buffer {
  const dedicated = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim();
  if (dedicated) {
    const buf = Buffer.from(dedicated, "base64");
    if (buf.length !== 32) {
      throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must be 32 bytes base64");
    }
    return buf;
  }
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return createHash("sha256").update(`splitsms-google-token:${secret}`).digest();
}

export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64url")}:${tag.toString("base64url")}:${ciphertext.toString("base64url")}`;
}

export function decryptToken(encrypted: string): string {
  const [version, ivB64, tagB64, dataB64] = encrypted.split(":");
  if (version !== "v1" || !ivB64 || !tagB64 || !dataB64) {
    throw new Error("invalid_token_blob");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]);
  return plain.toString("utf8");
}
```

- [ ] **Step 4: Run tests and make sure they pass**

Run: `node --import tsx --test tests/google/crypto.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit** (only if user requested commits)

---

### Task 2: Scopes + connection helpers (pure logic)

**Files:**
- Create: `lib/google/scopes.ts`
- Create: `lib/google/connection-utils.ts`
- Test: `tests/google/scopes.test.ts`

**Interfaces:**
- Produces: `GOOGLE_SCOPES`, `hasScopes(granted: string[], required: string[]): boolean`, `missingScopes(granted, required): string[]`, `mergeScopes(a, b): string[]`

- [ ] **Step 1: Write failing tests** for `hasScopes` / `missingScopes` / `mergeScopes`

- [ ] **Step 2: Implement**

```ts
// lib/google/scopes.ts
export const GOOGLE_SCOPES = {
  openid: "openid",
  email: "email",
  profile: "profile",
  contactsReadonly: "https://www.googleapis.com/auth/contacts.readonly",
  contacts: "https://www.googleapis.com/auth/contacts",
  spreadsheets: "https://www.googleapis.com/auth/spreadsheets",
  driveReadonly: "https://www.googleapis.com/auth/drive.readonly",
  formsBodyReadonly: "https://www.googleapis.com/auth/forms.body.readonly",
  formsResponsesReadonly: "https://www.googleapis.com/auth/forms.responses.readonly",
} as const;

export const GOOGLE_BASE_SCOPES = [
  GOOGLE_SCOPES.openid,
  GOOGLE_SCOPES.email,
  GOOGLE_SCOPES.profile,
] as const;
```

```ts
// lib/google/connection-utils.ts
export function hasScopes(granted: string[], required: string[]): boolean {
  const set = new Set(granted);
  return required.every((s) => set.has(s));
}

export function missingScopes(granted: string[], required: string[]): string[] {
  const set = new Set(granted);
  return required.filter((s) => !set.has(s));
}

export function mergeScopes(...lists: string[][]): string[] {
  return [...new Set(lists.flat().filter(Boolean))].sort();
}
```

- [ ] **Step 3: Run tests — PASS**

---

### Task 3: Prisma `GoogleConnection` model

**Files:**
- Modify: `prisma/schema.prisma` (User relation + new model)
- Run: `npx prisma generate` (migrate when DB available)

**Model:** as in spec (`userId` unique, `encryptedRefreshToken`, `scopes String[]`, etc.)

- [ ] **Step 1: Add model + `googleConnection GoogleConnection?` on User**
- [ ] **Step 2: `npx prisma generate`**
- [ ] **Step 3: Create migration `npx prisma migrate dev --name google_connection`** (or `db push` in local)

---

### Task 4: OAuth connect library + persistence

**Files:**
- Create: `lib/google/oauth-connect.ts`
- Create: `lib/google/connection.ts`
- Modify: reuse helpers from `lib/auth/google.ts` where safe (`getGoogleClientCredentials`, PKCE) — prefer importing shared pieces or duplicating connect-specific authorize/exchange that returns refresh_token

**Interfaces:**
- Produces:
  - `buildGoogleConnectAuthorizeUrl(opts)`
  - `exchangeGoogleConnectCode(opts) => { accessToken, refreshToken?, scope? }`
  - `signConnectState` / `verifyConnectState` (purpose `google_connect_state`, includes `userId`)
  - `getGoogleConnectionPublic(userId)`
  - `upsertGoogleConnectionFromOAuth(...)`
  - `getAccessTokenForUser(userId, requiredScopes)`
  - `disconnectGoogleConnection(userId)`

- [ ] **Step 1: Implement oauth-connect.ts** with offline access + refresh token parsing
- [ ] **Step 2: Implement connection.ts** using prisma + encryptToken + token refresh endpoint
- [ ] **Step 3: Unit-test state verify rejects login-purpose tokens** (if testable without DB)

Refresh token request:

```ts
POST https://oauth2.googleapis.com/token
grant_type=refresh_token
refresh_token=...
client_id=...
client_secret=...
```

On refresh failure: set `lastError`, return `{ ok: false, code: "reconnect" }`.

---

### Task 5: API routes

**Files:**
- Create: `app/api/integrations/google/connect/route.ts`
- Create: `app/api/integrations/google/callback/route.ts`
- Create: `app/api/integrations/google/disconnect/route.ts`

- [ ] **Step 1: connect** — require session; build PKCE + state; set httpOnly cookies; redirect to Google
- [ ] **Step 2: callback** — verify state.userId === session.userId; exchange code; upsert; redirect `returnTo` or `/dashboard/integrations/google?connected=1`
- [ ] **Step 3: disconnect** — POST, session required, revoke best-effort, delete row, redirect/json ok

Cookie names: `splitsms_google_connect_pkce`, distinct from login PKCE cookie.

---

### Task 6: Dashboard UI + nav

**Files:**
- Create: `app/dashboard/integrations/google/page.tsx`
- Create: `components/dashboard/google-integration-panel.tsx`
- Modify: `lib/navigation/dashboard-nav.ts` — add Google link
- Modify: `components/dashboard/connect-hub.tsx` — quick link
- Modify: `DEPLOY.md` — document connect redirect URI + optional `GOOGLE_TOKEN_ENCRYPTION_KEY`

- [ ] **Step 1: Server page loads connection public status**
- [ ] **Step 2: Panel with Connect / Reconnect / Disconnect buttons**
- [ ] **Step 3: Wire nav**

---

### Task 7: Smoke verification

- [ ] Run: `node --import tsx --test tests/google/*.test.ts`
- [ ] Run: `npx tsc --noEmit` (or project typecheck script if present)
- [ ] Manual: open `/dashboard/integrations/google` (needs OAuth client redirect URI registered)

---

## Later plans (do not implement in Phase 1)

- Phase 2: `docs/superpowers/plans/2026-08-03-google-contacts.md` (after hub ships)
- Phase 3: Google Sheets import/export
- Phase 4: Google Forms SMS poller worker

## File map (Phase 1)

| File | Responsibility |
|------|----------------|
| `lib/google/crypto.ts` | Encrypt/decrypt refresh tokens |
| `lib/google/scopes.ts` | Scope URL constants |
| `lib/google/connection-utils.ts` | Pure scope set helpers |
| `lib/google/oauth-connect.ts` | Connect OAuth URL/state/token exchange |
| `lib/google/connection.ts` | DB upsert, access token, disconnect |
| `app/api/integrations/google/*/route.ts` | HTTP entrypoints |
| `app/dashboard/integrations/google/page.tsx` | Page shell |
| `components/dashboard/google-integration-panel.tsx` | Connect UI |
