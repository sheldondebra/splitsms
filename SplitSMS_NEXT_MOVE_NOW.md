# SplitSMS — NEXT MOVE NOW
## Production Foundation Sprint (Immediate Execution Plan)

Version: 1.1 · **Status snapshot: May 2026**

---

# ✅ Sprint completion (current codebase)

| Stage | Goal | Status |
|-------|------|--------|
| **1** | Initialize project (Next.js, Tailwind, Prisma) | ✅ Done |
| **2** | PostgreSQL + Prisma models | ✅ Done |
| **3** | Authentication (signup, login, OTP, reset) | ✅ Done |
| **4** | mNotify integration | ✅ Done (+ Admin setup UI) |
| **5** | Wallet + payments | ✅ Done |
| **6** | Send SMS + campaigns + contacts | ✅ Done |
| **7** | Queue workers (BullMQ + Redis) | ✅ Done |

### Weekly goal checklist (§21)

| Item | Status |
|------|--------|
| Signup / Login | ✅ |
| OTP verification | ✅ |
| mNotify sending SMS | ✅ (configure in Admin → mNotify Setup) |
| Wallet system | ✅ |
| SMS campaigns | ✅ |
| Queue workers | ✅ `npm run worker:sms` · `worker:campaigns` · `worker:reports` |
| Dashboard UI | ✅ |
| PostgreSQL (Neon) | ✅ |

### API routes (doc §10) — implemented

| Doc path | Actual path |
|----------|-------------|
| `/api/auth/send-otp` | ✅ `POST /api/auth/send-otp` |
| `/api/auth/verify-otp` | ✅ `POST /api/auth/verify-otp` |
| `/api/sms/send` | ✅ `POST /api/v1/sms/send` or `/api/v1/messages/send` |
| `/api/sms/status` | ✅ `GET /api/sms/status?messageId=…` (API key) |

### mNotify functions (doc §8)

| Function | Location |
|----------|----------|
| `sendSms()` | `sendMnotifyQuickSms()` in `lib/mnotify.ts` |
| `sendOtp()` | `sendMnotifyOtp()` |
| `verifyOtp()` | `lib/auth/otp.ts` (app OTP, not mNotify Token API) |
| `fetchDeliveryReport()` | `fetchCampaignDeliveryReport()` + `fetchMessageDeliveryReport()` |

---

# 🎯 What to do next (operations, not more features)

1. **Configure mNotify** — Admin → mNotify Setup → API key → Test SMS  
2. **Set `.env`** — `DATABASE_URL`, `SESSION_SECRET`, `REDIS_URL`, `NEXT_PUBLIC_APP_URL`  
3. **Seed DB** — `npm run db:seed`  
4. **Run app + workers** (4 terminals):

```bash
npm run dev
npm run worker:sms
npm run worker:campaigns
npm run worker:reports
```

5. **Smoke test** — Sign up → OTP → top up wallet → send bulk SMS → check Reports  
6. **Deploy** — Vercel (app) + Neon (DB) + Upstash (Redis) per §22  

---

# 1. Immediate Objective

Your next move is no longer planning.

Your next move is to **operate and harden** the production foundation of SplitSMS.

Main focus:

- Authentication ✅
- mNotify integration ✅
- Wallet infrastructure ✅
- SMS engine ✅
- Queue system ✅
- Dashboard foundation ✅

This sprint transformed SplitSMS from an idea into a **working messaging platform**.

---

# 2. Primary Goal

Build a stable MVP that can:

- Register users ✅
- Verify phone numbers ✅
- Fund wallets ✅
- Send SMS via mNotify ✅
- Track campaigns ✅
- Store transactions ✅
- Display analytics ✅

---

# 3. Sprint Structure

This sprint is divided into 7 build stages. **All stages are implemented.**

---

# STAGE 1 — Initialize Project ✅

## Goal

Setup scalable project architecture.

Stack: Next.js 16, TypeScript, Tailwind, shadcn/ui, Prisma 7, BullMQ.

---

# STAGE 2 — Configure Database ✅

PostgreSQL (Neon) + full Prisma schema (User, Wallet, Campaign, Message, routes, etc.).

---

# STAGE 3 — Build Authentication ✅

Pages: `/signup`, `/login`, `/verify-otp`, `/forgot-password`, `/reset-password`

Features: phone or email signup, country list, rate limiting, account lockout, audit logs.

---

# 7. OTP Flow ✅

1. User enters phone number.  
2. SplitSMS generates OTP.  
3. Regional SMS gateway sends OTP (mNotify / Twilio / Infobip by country).  
4. User enters OTP.  
5. System verifies OTP.  
6. Account activates.

---

# STAGE 4 — Configure mNotify ✅

- `lib/mnotify.ts` — send, OTP, delivery reports  
- Admin: `/admin/mnotify` — no `.env` required for operators  

## Environment Variables (fallback only)

```env
MNOTIFY_API_KEY=YOUR_KEY
MNOTIFY_BASE_URL=https://api.mnotify.com
MNOTIFY_SENDER_ID=SplitSMS
```

---

# STAGE 5 — Build Wallet System ✅

Balance, top-up (Paystack, Flutterwave, Stripe, MTN MoMo, Manual), SMS debit, refunds, invoices.

---

# STAGE 6 — Build Send SMS Module ✅

Sender ID, message, recipients, cost preview, queue, delivery updates.

---

# STAGE 7 — Queue System ✅

| Worker | Command |
|--------|---------|
| SMS send | `npm run worker:sms` |
| Campaign schedule | `npm run worker:campaigns` |
| Delivery report sync | `npm run worker:reports` |

---

# 15–16. Dashboard ✅

Member dashboard + Admin (members, payments, pricing, routes, mNotify, fraud, analytics).

---

# 19. Priority Order — current focus

| Priority | Task | Status |
|----------|------|--------|
| High | Authentication | ✅ |
| High | mNotify | ✅ configure + test |
| High | Wallet | ✅ |
| High | Send SMS | ✅ |
| High | Queue | ✅ run workers in prod |
| Medium | Analytics | ✅ |
| Medium | Admin | ✅ |
| Low | Reseller | Later |

---

# 20. Critical Rule

DO NOT add too many features before production is stable.

Focus on:

- Reliable SMS delivery  
- Fast OTP verification  
- Stable wallet system  
- Beautiful dashboard  

---

# 23. Security Requirements ✅

- Rate limiting  
- Password hashing (bcrypt)  
- OTP expiration  
- API validation (Zod)  
- Audit logs  
- Fraud monitoring (admin)  

---

# 24. Future Expansion

After MVP is live:

- Multi-provider routing (partially done)  
- Reseller accounts  
- WhatsApp / Voice APIs  
- SMPP  
- White-label  

---

# 25. Final Mission

SplitSMS should become:

- A trusted global messaging platform  
- A reliable bulk SMS engine  
- A developer-first API platform  
- A modern alternative to outdated SMS systems  
