# Admin + Member Reports Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Ship admin Reports hub + member My reports with charts, tables, and PDF email to members.

**Architecture:** Reuse Prisma queries and Recharts components; shared period helpers; pdf-lib for PDF; extend email providers for attachments.

**Tech Stack:** Next.js App Router, Prisma, Recharts, pdf-lib, existing AdminPage / AppPage shells.

## Global Constraints

- Do not break `/dashboard/reports` (message results) — member hub is `/dashboard/account-reports`.
- Prefer reusing `lib/admin/analytics.ts` patterns and existing chart components.
- PDF email must work for SMTP, Mailjet, and Resend when configured.

---

### Task 1: Data layer + PDF

- [ ] Add `lib/reports/period.ts`, `admin-reports.ts`, `member-account-report.ts`, `pdf.ts`
- [ ] Install `pdf-lib`

### Task 2: Email attachments

- [ ] Extend `sendEmail` + SMTP/Mailjet/Resend for PDF attachments

### Task 3: Admin hub UI

- [ ] Nav section + route access
- [ ] Pages under `/admin/reports/*`
- [ ] Send report action

### Task 4: Member hub UI

- [ ] Dashboard nav + pages under `/dashboard/account-reports/*`
