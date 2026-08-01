# Password Reset Security Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reject a reset password that matches the current password and send a security email after a successful password change.

**Architecture:** A focused password-policy helper performs the bcrypt comparison and is called by the reset server action before hashing. A new shared-layout email template reports completed changes; notification failure is logged without rolling back the password update.

**Tech Stack:** Next.js 16 server actions, TypeScript, bcryptjs, Node test runner through `tsx`, Prisma, existing email abstraction.

## Global Constraints

- Reject only the current password; do not introduce password history.
- Keep the reset session valid after a rejected reuse attempt.
- Never include passwords or reset codes in the notification.
- A notification failure must not undo a completed password change.

---

### Task 1: Current-password reuse policy

**Files:**
- Create: `lib/auth/password-policy.ts`
- Create: `tests/auth/password-policy.test.ts`
- Modify: `lib/actions/auth.ts`
- Modify: `components/auth/auth-alert.tsx`

**Interfaces:**
- Produces: `isCurrentPassword(candidate: string, currentHash: string): Promise<boolean>`
- Consumes: `verifyPassword(password: string, hash: string): Promise<boolean>`

- [ ] **Step 1: Write the failing policy test**

Create bcrypt hashes and assert that `isCurrentPassword` returns `true` for the current password and `false` for a different password.

- [ ] **Step 2: Verify RED**

Run: `npx tsx --test tests/auth/password-policy.test.ts`

Expected: FAIL because `lib/auth/password-policy.ts` does not exist.

- [ ] **Step 3: Implement the minimal helper**

Delegate to `verifyPassword(candidate, currentHash)`.

- [ ] **Step 4: Verify GREEN**

Run: `npx tsx --test tests/auth/password-policy.test.ts`

Expected: both assertions PASS.

- [ ] **Step 5: Integrate server-side enforcement**

In `resetPasswordAction`, load the user's current `passwordHash`, compare before hashing, and redirect to `/reset-password?error=password_reuse` when equal. Add the matching alert copy: “Your new password must be different from your current password.”

### Task 2: Successful password-change email

**Files:**
- Modify: `lib/email/templates.ts`
- Create: `tests/email/password-reset-success.test.ts`
- Modify: `lib/actions/auth.ts`

**Interfaces:**
- Produces: `passwordResetSuccessEmailContent(params: { memberName: string; changedAt?: Date; supportUrl?: string }): { subject: string; text: string; html: string }`
- Consumes: `sendEmail({ to, subject, text, html })`

- [ ] **Step 1: Write the failing template test**

Assert the subject identifies a successful password change, the HTML includes account-security guidance and support URL, and neither output contains a supplied sentinel password.

- [ ] **Step 2: Verify RED**

Run: `npx tsx --test tests/email/password-reset-success.test.ts`

Expected: FAIL because the template export does not exist.

- [ ] **Step 3: Implement the template**

Use `emailLayout`, include the member greeting, change time, login CTA, and support warning without credentials.

- [ ] **Step 4: Verify GREEN**

Run: `npx tsx --test tests/email/password-reset-success.test.ts`

Expected: PASS.

- [ ] **Step 5: Trigger best-effort notification**

Fetch the reset user email/name with the password hash. After the password update and audit event, call `sendEmail`; log thrown or returned delivery errors and continue to the success redirect.

### Task 3: Verification

**Files:**
- Verify all modified files.

- [ ] **Step 1: Run focused tests**

Run: `npx tsx --test tests/auth/password-policy.test.ts tests/email/password-reset-success.test.ts`

Expected: all tests PASS.

- [ ] **Step 2: Check diagnostics**

Run IDE lint diagnostics for all modified TypeScript/TSX files.

Expected: no new diagnostics.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: Next.js build completes successfully.
