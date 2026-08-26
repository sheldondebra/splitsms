# Admin + Member Reports Hub Design

**Date:** 2026-08-17  
**Status:** Approved  
**Audience:** Admins + members (option B)  
**v1 priority:** Full hub shell first (option B)  
**Delivery format:** On-screen + email with PDF attachment (option B)  
**Architecture approach:** Expand Analytics / reuse existing data (approach 1)

## Goals

- Add a **Reports** section to the admin sidebar with Overview, Delivery, Transactions, Logins, Members, and Send report.
- Add **My reports** for members (scoped to their account) with on-screen views and PDF download.
- Admins can email a member an account PDF report; members get an in-app notification.

## Admin pages

| Route | Purpose |
|-------|---------|
| `/admin/reports` | Platform overview KPIs + line/bar/area charts |
| `/admin/reports/delivery` | Sent/failed/pending, failure reasons, country/provider |
| `/admin/reports/transactions` | Wallet / credits / adjustments |
| `/admin/reports/logins` | Auth audit (login success/fail, OTP, lockouts) |
| `/admin/reports/members` | Signups, verified, suspended, balances |
| `/admin/reports/send` | Pick member + period → preview → email PDF |

## Member pages

| Route | Purpose |
|-------|---------|
| `/dashboard/account-reports` | Member overview of their account (avoids clash with `/dashboard/reports` message results) |
| `/dashboard/account-reports/delivery` | Own delivery breakdown |
| `/dashboard/account-reports/transactions` | Own transactions |
| `/dashboard/account-reports/logins` | Own login activity |

Period scales: 7d / 30d / 90d (custom later).

## Charts (v1)

- Line / Area: SMS volume over time  
- Bar: failure reasons, countries  
- Pie/donut: delivery status mix (reuse existing)

## Send report

1. Admin selects member + period  
2. Server builds account report payload + PDF  
3. Email with PDF attachment  
4. `createNotification` on member account linking to My reports  

## Out of scope (v1)

Scheduled recurring emails, Slack delivery, advanced custom date pickers, extra chart types beyond line/bar/area/pie.

## Permissions

Admin reports: `activity.read` (same as Analytics). Send report also requires ability to email members (`members.write` preferred for send action).
