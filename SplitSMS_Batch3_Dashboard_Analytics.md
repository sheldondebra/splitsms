# SplitSMS — NEXT BATCH
# Batch 3: Dashboard System + Analytics Infrastructure

Version: 1.1 · **Status snapshot: May 2026**

---

# ✅ Batch completion (current codebase)

| Deliverable (§39) | Status | Notes |
|-------------------|--------|-------|
| User dashboard | ✅ | `/dashboard` — stat cards, wallet/SMS/delivery/campaigns/API widgets |
| Admin dashboard | ✅ | `/admin` — platform metrics + volume chart (`lib/analytics/admin-dashboard.ts`) |
| Analytics cards | ✅ | `lib/analytics/dashboard.ts` |
| Campaign tracking | ✅ | `/dashboard/campaigns` — search + per-campaign delivery stats |
| Wallet tracking | ✅ | `/dashboard/wallet` (existing) |
| Charts working | ✅ | Recharts — 14-day SMS, spend, delivery pie, countries (`components/dashboard/charts.tsx`) |
| Real-time updates | ⚠️ Partial | 60s `router.refresh()` polling (`dashboard-refresh.tsx`); no Pusher/Socket yet |
| Notifications system | ⚠️ Partial | `Notification` model + bell panel; low-balance alert wired in layout |

### Pages & routes

| Doc path | Actual path | Status |
|----------|-------------|--------|
| `/dashboard` | `/dashboard` | ✅ |
| `/dashboard/send-sms` | `/dashboard/send` | ✅ (alias not added) |
| `/dashboard/campaigns` | `/dashboard/campaigns` | ✅ |
| `/dashboard/contacts` | `/dashboard/contacts` | ✅ |
| `/dashboard/wallet` | `/dashboard/wallet` | ✅ |
| `/dashboard/transactions` | `/dashboard/transactions` | ✅ **new** |
| `/dashboard/api-keys` | `/dashboard/api-keys` | ✅ |
| `/dashboard/settings` | `/dashboard/settings` | ✅ |
| `/dashboard/sender-ids` | `/dashboard/sender-ids` | ✅ |
| SMS logs / reports | `/dashboard/reports` | ✅ filters, pagination, CSV export |
| Admin sub-routes (§28) | `/admin/members`, `/admin/mnotify`, etc. | ✅ existing structure (not `/admin/users`) |

### Key files added/updated

- `lib/analytics/dashboard.ts` — overview metrics + chart series
- `lib/analytics/admin-dashboard.ts` — admin aggregates
- `lib/notifications.ts`, `lib/actions/notifications.ts`
- `components/dashboard/` — `charts.tsx`, `stat-card.tsx`, `notification-panel.tsx`, `dashboard-topbar.tsx`, `dashboard-refresh.tsx`, `reports-filters.tsx`, `admin-volume-chart.tsx`
- `app/api/dashboard/reports/export/route.ts` — CSV export
- Prisma: `Notification` + `NotificationType` enum

### Not in scope / deferred

- Pusher, Socket.io, or Supabase Realtime (§5)
- Zustand / TanStack Query (§36)
- Dedicated `CampaignAnalytics` / `SmsLog` tables (uses `Campaign` + `Message`)
- Event-driven notifications for campaign complete / wallet funded (only `LOW_BALANCE` today)
- Dark/light theme toggle (§34) — app uses dark dashboard theme
- Retry failed campaigns from UI (§10)

### Run / verify

```bash
npm run build          # ✅ passes
npm run dev
npm run worker:sms
npm run worker:campaigns
```

---

# 1. Batch Goal

This batch focuses on building the complete dashboard experience for both members and administrators.

The goal is to make SplitSMS feel:

- Modern
- Fast
- Real-time
- Premium
- Enterprise-ready

This batch transforms SplitSMS from a backend SMS engine into a real platform users can interact with daily.

---

# 2. Main Objectives

Build:

- User dashboard
- Admin dashboard
- Analytics system
- Campaign tracking
- SMS reporting
- Wallet tracking
- Real-time updates
- Dashboard charts
- Notification system

---

# 3. User Dashboard Structure

## Main Pages

```txt
/dashboard
/dashboard/send-sms
/dashboard/campaigns
/dashboard/contacts
/dashboard/wallet
/dashboard/transactions
/dashboard/api-keys
/dashboard/settings
/dashboard/sender-ids
```

---

# 4. Dashboard Home

## Main Widgets

### Wallet Card
Shows:
- Current balance
- SMS estimate
- Recent spending

### SMS Sent Card
Shows:
- SMS count
- Daily trend

### Delivery Rate Card
Shows:
- Delivered percentage
- Failed percentage

### Campaigns Card
Shows:
- Active campaigns
- Scheduled campaigns

### API Usage Card
Shows:
- API requests
- Rate limits
- Last request

---

# 5. Real-Time Dashboard

## Real-Time Features

- Live delivery updates
- Wallet refresh
- Campaign progress
- Notification updates

## Recommended Tools

### Option 1
- Pusher

### Option 2
- Socket.io

### Option 3
- Supabase Realtime

---

# 6. Analytics System

## User Analytics

### Metrics

- Total SMS sent
- Total delivered
- Failed SMS
- Pending SMS
- Wallet spending
- Country performance

---

# 7. Campaign Analytics

## Campaign Metrics

- Total recipients
- Delivered count
- Failed count
- Pending count
- Delivery percentage
- Cost spent
- Time sent

---

# 8. Dashboard Charts

## Build Charts

### Daily SMS Chart
Track SMS volume.

### Revenue Chart
Track spending trends.

### Delivery Rate Chart
Track SMS performance.

### Country Performance Chart
Track top countries.

---

# 9. Recommended Chart Libraries

Use:

- Recharts
- Tremor
- Chart.js

---

# 10. Campaign Page

## Features

- Search campaigns
- Filter campaigns
- Retry failed campaigns
- Export reports
- View delivery logs

---

# 11. Campaign Statuses

## Status List

- pending
- processing
- sent
- delivered
- failed
- cancelled

---

# 12. SMS Logs Page

## Features

- Search by phone
- Search by campaign
- Filter by country
- Filter by status
- View provider response
- Export CSV

---

# 13. Wallet Dashboard

## Features

- Current balance
- Transaction history
- Funding history
- SMS deductions
- Refund history

---

# 14. Transaction Types

## Types

- deposit
- sms_debit
- refund
- bonus
- commission

---

# 15. Notifications System

## Notification Types

- Low balance
- Campaign completed
- SMS failed
- OTP sent
- Wallet funded

---

# 16. Notification Infrastructure

## Build

```txt
notifications
- id
- user_id
- type
- title
- message
- read_at
- created_at
```

---

# 17. API Key Dashboard

## Features

- Generate API key
- Revoke API key
- View usage
- View last request
- View webhook logs

---

# 18. Settings Page

## Features

- Profile update
- Password update
- Notification settings
- API settings
- Sender ID preferences

---

# 19. Sender ID Dashboard

## Features

- Request sender ID
- View approval status
- View rejection reason
- Default sender selection

---

# 20. Admin Dashboard

## Main Admin Pages

```txt
/admin
/admin/users
/admin/campaigns
/admin/messages
/admin/providers
/admin/pricing
/admin/wallets
/admin/transactions
/admin/reports
/admin/settings
```

---

# 21. Admin Overview

## Main Cards

- Total users
- Total SMS
- Total revenue
- Provider health
- Queue health
- Failed SMS
- Active campaigns

---

# 22. User Management

## Features

- Search users
- Suspend users
- Reset passwords
- Adjust wallets
- View campaigns
- View API usage

---

# 23. Provider Monitoring

## Features

- Provider uptime
- SMS success rate
- Error logs
- API latency
- Current route status

---

# 24. Pricing Management

## Features

- Country pricing
- Provider pricing
- Margin adjustment
- Promo pricing

---

# 25. Fraud Monitoring

## Detect

- Spam campaigns
- Excessive OTP requests
- API abuse
- Fraud wallets
- Suspicious traffic

---

# 26. Queue Monitoring

## Dashboard

Track:

- Pending jobs
- Failed jobs
- Retried jobs
- Queue latency

---

# 27. Analytics Database Models

## Campaign Analytics

```prisma
model CampaignAnalytics {
  id            String   @id @default(cuid())
  campaignId    String
  delivered     Int
  failed        Int
  pending       Int
  totalCost     Decimal
  createdAt     DateTime @default(now())
}
```

---

# 28. SMS Logs Model

```prisma
model SmsLog {
  id            String   @id @default(cuid())
  userId        String
  campaignId    String?
  provider      String
  status        String
  phone         String
  message       String
  response      Json?
  createdAt     DateTime @default(now())
}
```

---

# 29. Dashboard UI Direction

## Style Rules

The dashboard must feel:

- Fast
- Minimal
- Premium
- Modern
- Professional

---

# 30. UI Inspirations

Use inspiration from:

- Stripe
- Linear
- Resend
- Clerk

---

# 31. Dashboard Layout

## Recommended Layout

```txt
Sidebar
↓
Top Navbar
↓
Dashboard Content
↓
Cards + Charts + Tables
```

---

# 32. Sidebar Items

## Member Sidebar

- Overview
- Send SMS
- Campaigns
- Contacts
- Wallet
- Transactions
- API Keys
- Sender IDs
- Settings

## Admin Sidebar

- Overview
- Users
- Campaigns
- Providers
- Pricing
- Wallets
- Reports
- Fraud

---

# 33. Mobile Responsiveness

## Requirements

Dashboard must work perfectly on:

- Mobile
- Tablet
- Desktop

---

# 34. Dark Mode

## Must Include

- Dark theme
- Light theme
- System theme detection

---

# 35. Performance Targets

## Dashboard Targets

- Fast load times
- Real-time updates
- Optimized charts
- Smooth transitions

---

# 36. State Management

## Recommended

Use:

- Zustand
- TanStack Query

---

# 37. API Optimization

## Use

- Pagination
- Infinite scrolling
- Lazy loading
- Optimistic updates

---

# 38. Dashboard Security

## Protect

- Admin routes
- API keys
- Wallet actions
- Sensitive analytics

---

# 39. MVP Deliverables

By end of this batch:

✅ User dashboard  
✅ Admin dashboard  
✅ Analytics cards  
✅ Campaign tracking  
✅ Wallet tracking  
✅ Charts working  
✅ Real-time updates  
✅ Notifications system  

---

# 40. Final Goal

After this batch, SplitSMS should feel like a real modern platform.

Users should be able to:

- Send SMS
- Track campaigns
- Monitor delivery
- View analytics
- Manage wallets
- Use APIs

All through a clean premium dashboard experience.
