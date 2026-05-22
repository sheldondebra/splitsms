# SplitSMS — Execution Roadmap Status

Mapped to [SplitSMS_Execution_Roadmap.md](SplitSMS_Execution_Roadmap.md)

## Phase 1 — Foundation

| Task | Status |
|------|--------|
| UI system (Tailwind + shadcn) | Done |
| Database + Prisma | Done |
| Authentication | Done |
| Dashboard shell | Done |
| Redis + BullMQ | Done (optional Redis) |
| Monorepo | Single Next.js app (simpler than monorepo for MVP) |

## Authentication

| Feature | Status |
|---------|--------|
| Phone signup | Done |
| OTP verification | Done |
| Email login | Done |
| Country auto-detection | Done |
| Device sessions | Done |

## SMS Infrastructure

| Feature | Status |
|---------|--------|
| Providers (Infobip, Twilio, mNotify) | Done |
| Queue + retry failed messages | Done |
| Delivery reports | Done |
| Route failover | Done |
| Country routing | Done |

## Wallet

| Feature | Status |
|---------|--------|
| Balance, top-up, history | Done |
| Paystack, Flutterwave, Stripe, MTN MoMo, Manual | Done |
| Invoices / CSV export | Done |
| Auto deduction on send | Done |

## Dashboard

| Feature | Status |
|---------|--------|
| Send SMS, campaigns, contacts | Done |
| Analytics widgets | Done |
| API keys + logs | Done |
| Sender IDs | Done |
| Scheduling | Done |

## Admin

| Feature | Status |
|---------|--------|
| User management | Done |
| Pricing + routes | Done |
| Fraud monitoring | Done |
| Profit analytics | Done |
| Payments approval | Done |

## API Platform

| Feature | Status |
|---------|--------|
| REST API | Done |
| OTP API | Done |
| Webhooks (inbound + outbound) | Done |
| Rate limiting | Done |

## Landing Page

| Section | Status |
|---------|--------|
| Hero + stats | Done |
| Features | Done |
| API showcase | Done |
| Testimonials | Done |
| CTA footer | Done |
| Pricing page | Done |

## Not yet implemented

- 2FA
- PayPal payments
- Better Auth / Clerk migration
- Telnyx / Termii / Vonage (using Infobip/Twilio/mNotify per product decision)
- WhatsApp / Voice / Email APIs (Phase 3)
- Reseller white-label (Phase 3)
- SMPP
- AI features
