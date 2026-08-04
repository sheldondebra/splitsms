# Google Integrations Design

## Goal

Let logged-in SplitSMS members connect a Google account (separate from Google Sign-In) and use Google Contacts, Sheets/Drive files, and Forms with SplitSMS SMS flows — click-and-work, with incremental OAuth scopes.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Scope of work | All four: Connect hub, Contacts, Sheets, Forms |
| Connect UX | Settings/Integrations → Connect Google (not at login) |
| Scopes | Incremental — base connect first, add scopes per feature |
| Forms latency | Near-real-time polling (~30–60s), no Apps Script paste |
| Google accounts | One connected Google account per SplitSMS user |
| Login vs connect | Login stays identity-only (`openid email profile`); product tokens live in `GoogleConnection` |
| Architecture | Shared connection hub + feature modules |

## Ship order

1. **Google connection hub** — OAuth connect/disconnect, encrypted refresh token, incremental scope helper, Integrations UI
2. **Google Contacts** — import (select one / select all) + export SplitSMS contacts to Google
3. **Google Sheets** — pick Sheet/Excel from Drive → map columns → import contacts or send SMS; Smart Forms export to Sheets
4. **Google Forms → SMS** — pick form, map phone/message fields, poll for new responses, send SMS

Each phase is independently usable once shipped.

---

## Phase 1 — Connection hub

### User flow

1. Member opens **Dashboard → Integrations → Google**.
2. Clicks **Connect Google** → Google consent (base scopes + offline access).
3. Callback stores encrypted refresh token + email + subject + scopes.
4. UI shows connected email, granted scopes, Connect/Reconnect/Disconnect.
5. Feature buttons (Contacts / Sheets / Forms) call incremental OAuth when required scopes are missing.

### Data model

```prisma
model GoogleConnection {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(...)
  googleSubject         String   // Google `sub`
  email                 String
  encryptedRefreshToken String
  scopes                String[] // granted scope URLs
  tokenExpiry           DateTime? // last access-token expiry (optional cache)
  lastError             String?
  connectedAt           DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([googleSubject])
}
```

Related feature models (Phases 2–4) reference `userId` and require a live connection at runtime; they are not deleted on disconnect (UI shows “Reconnect required”).

### OAuth

- Same env client as login: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- Separate routes (do not overload login callback):
  - `GET /api/integrations/google/connect` — start (optional `?scopes=` + `returnTo`)
  - `GET /api/integrations/google/callback` — finish, upsert connection
  - `POST /api/integrations/google/disconnect` — revoke + delete row
- Connect authorize URL: `access_type=offline`, `prompt=consent` on first connect (to obtain refresh token), `include_granted_scopes=true` on incremental.
- Base scopes: `openid email profile`.
- Redirect URI: `{origin}/api/integrations/google/callback` (register in Google Cloud Console alongside login callback).
- State JWT includes `userId`, `nonce`, `returnTo`, `requestedScopes[]`, purpose `google_connect_state`.
- PKCE required (same pattern as `lib/auth/google.ts`).

### Token security

- Encrypt refresh tokens at rest with AES-256-GCM.
- Key: `GOOGLE_TOKEN_ENCRYPTION_KEY` (32-byte base64) or derive from `SESSION_SECRET` via SHA-256 if unset (document production requirement for dedicated key).
- Ciphertext format: `v1:<iv_b64>:<tag_b64>:<ciphertext_b64>`.
- Never return refresh/access tokens to the browser.

### Core library API

```ts
// lib/google/scopes.ts
GOOGLE_SCOPES.base | .contactsReadonly | .contacts | .spreadsheets | .driveReadonly | .formsBodyReadonly

// lib/google/crypto.ts
encryptToken(plain: string): string
decryptToken(encrypted: string): string

// lib/google/connection.ts
getGoogleConnection(userId: string): Promise<GoogleConnectionPublic | null>
hasScopes(connection, required: string[]): boolean
getAccessTokenForUser(userId: string, requiredScopes: string[]): Promise<
  | { ok: true; accessToken: string }
  | { ok: false; code: "not_connected" | "needs_scopes" | "reconnect"; missingScopes?: string[] }
>
upsertGoogleConnection(...)
disconnectGoogleConnection(userId: string): Promise<void>
```

### UI

- Page: `app/dashboard/integrations/google/page.tsx`
- Panel: connect status, email, scope badges, actions
- Nav: add Google under Integrations (next to WordPress); link from Connect hub quick links
- Soft entry points on Contacts page and Forms settings that deep-link here when not connected

### Errors

`google_denied`, `google_failed`, `google_config`, `google_session` (state/user mismatch), `reconnect_required`

### GCP checklist

- Enable APIs as features ship: People API, Sheets API, Drive API, Forms API
- OAuth consent screen: add incremental scopes as External test/production allows
- Add connect callback redirect URI

### Tests

- Encrypt/decrypt round-trip; reject tampered ciphertext
- `hasScopes` true/false
- State purpose must be `google_connect_state` (not login state)

---

## Phase 2 — Google Contacts

### Import

1. Ensure People API scopes (`contacts.readonly` for import; upgrade to `contacts` for export).
2. List contacts with phone numbers (paginated).
3. Preview UI mirrors CSV import: checkbox per row + **Select all** valid.
4. Confirm → reuse `importContactsSelectedAction` / same phone normalization as CSV.

### Export

1. User selects SplitSMS contacts (or group) → **Export to Google Contacts**.
2. Create/update Google contacts with name + phone (+ email when present).
3. Skip / report rows without phone.

### UI

- Contacts page: “Import from Google” / “Export to Google” next to CSV import.
- Selection UX: same select-one / select-all pattern as `CsvImportPanel`.

### Data

- Optional `googleResourceName` on Contact later if we need stable sync; **v1 is one-shot import/export**, not continuous sync.

---

## Phase 3 — Google Sheets

### Import Sheet / Excel from Drive → SMS or contacts

1. Request `spreadsheets` + `drive.readonly` (incremental).
2. Picker/list: recent Sheets + Excel files user can open.
3. User picks spreadsheet + sheet/tab; preview first N rows.
4. Map columns → phone, name, (optional message personalization).
5. Actions:
   - **Import as contacts** (reuse contact import pipeline)
   - **Send SMS** (create campaign or compose bulk send with mapped recipients + template)

### Smart Forms → Google Sheets export

1. From Smart Form responses: **Export to Google Sheets**.
2. Create a new spreadsheet (or append to a linked sheet id stored on `SmartForm` / export record).
3. Header row = field labels; rows = responses.
4. Record `SmartFormExport` with type extension `GOOGLE_SHEETS` (add enum value) and metadata (spreadsheet id, url, row count).

### v1 limits

- No live two-way sync.
- Max rows per import/send: align with existing campaign/import limits.

---

## Phase 4 — Google Forms → SMS

### Click-and-work flow

1. Connect + grant Forms/Drive scopes as needed.
2. List user’s Google Forms.
3. User picks a form → map “phone” question (and optional name/message fields) → choose sender ID + SMS template (supports `{{field}}` placeholders).
4. Save `GoogleFormSmsAutomation` (active flag, form id, field map, sender, template, `lastSeenResponseToken` / timestamp).
5. Worker polls every ~45s for active automations; for each, fetch new responses since cursor; enqueue SMS via existing orchestrator/queue; advance cursor.

### Near-real-time

- Target: SMS within ~30–60 seconds of submit.
- Deduplicate by Google response id stored in a small `GoogleFormSmsSend` log table.

### Data model (sketch)

```prisma
model GoogleFormSmsAutomation {
  id              String   @id @default(cuid())
  userId          String
  formId          String   // Google form id
  formTitle       String?
  phoneFieldId    String
  fieldMap        Json     // questionId → template token
  senderId        String
  messageTemplate String
  isActive        Boolean  @default(true)
  cursor          String?  // last processed response id or timestamp
  lastPolledAt    DateTime?
  lastError       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([userId, formId])
  @@index([isActive, lastPolledAt])
}
```

### Failure handling

- Missing phone → skip + count
- Wallet/credits insufficient → pause automation + notify user
- Token revoked → set `lastError`, deactivate or mark reconnect required

---

## Error handling (cross-cutting)

| Situation | Behavior |
|-----------|----------|
| Not connected | Feature CTAs → Connect Google |
| Missing scopes | Incremental OAuth with only missing scopes |
| Refresh fails / revoked | Clear usable token state, set `lastError`, UI Reconnect |
| Google API 429 | Backoff; Forms worker skips cycle |
| Partial import | Per-row success/fail report (same as CSV) |

## Testing strategy

- Unit: crypto, scope checks, field mapping, response cursor advancement
- Integration (mocked Google HTTP): connect upsert, contacts list→import mapping, sheets row map, forms poll dedupe
- Manual: real Google test user through Connect → each feature

## Out of scope (v1)

- Multiple Google accounts per user
- Continuous Contacts sync / conflict resolution
- Instant Forms webhooks / Apps Script
- Google Workspace admin install
- Changing Google Sign-In to request product scopes

## Success criteria

- Member can connect/disconnect Google without affecting password or Google login sessions
- Contacts: import selected or all phone contacts; export to Google
- Sheets: import file and send SMS or save contacts; export Smart Form responses to a Sheet
- Smart Forms export → Google Sheets creates a new spreadsheet (recorded as an export with the Sheet URL)
- Forms: pick form once; new submissions trigger SMS within about a minute while automation is active

**Note:** Google Sheets export rows are stored as `SmartFormExport` with `exportType = EXCEL` and `fileUrl` pointing at the Google Sheet URL (avoids a Postgres enum migration requiring elevated ownership).
