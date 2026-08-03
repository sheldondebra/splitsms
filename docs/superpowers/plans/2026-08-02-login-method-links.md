# Login Method Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface phone-password and SMS/email-code sign-in links at the top of password login modes.

**Architecture:** Add a shared `LoginMethodLinks` component; render it on email- and phone-password modes below Google; remove duplicate bottom links from forms and password-mode footer.

**Tech Stack:** Next.js App Router, React, existing auth Link / Tailwind patterns.

## Global Constraints

- No auth action / OTP / Google changes
- Preserve `returnTo` on method hrefs
- Email + password remains default `/login`

---

## File map

| File | Responsibility |
|------|----------------|
| `components/auth/login-method-links.tsx` | Top link row |
| `app/(auth)/login/page.tsx` | Wire links; drop password-mode SMS footer link |
| `components/auth/login-password-form.tsx` | Remove bottom SMS link |
| `components/auth/login-phone-password-form.tsx` | Remove bottom email link |

---

### Task 1: LoginMethodLinks + page wiring

- [ ] Create `components/auth/login-method-links.tsx` with `mode: "email" | "phone"` and optional `returnTo`
- [ ] On email mode: “Use phone number” → `?mode=password&phone=1`; “Sign in with SMS / email code” → `?mode=sms`
- [ ] On phone mode: “Use email” → `/login`; same SMS link
- [ ] Append `returnTo` when set
- [ ] Render after Google divider on non-SMS modes; remove SMS footer link when `!smsMode`

### Task 2: Clean password forms

- [ ] Remove bottom SMS paragraph from `login-password-form.tsx`
- [ ] Remove bottom email link from `login-phone-password-form.tsx`

### Task 3: Verify

- [ ] Confirm links and footers match the design (manual / quick page review)
