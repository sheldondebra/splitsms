# Admin Email Marketing — Design

**Date:** 2026-08-01  
**Status:** Approved for implementation (user: build full feature)

## Goal

Dedicated admin Email Marketing hub at `/admin/email-marketing` for campaign-style promotional email. Existing `/admin/outreach` remains for quick SMS/email one-offs.

## Scope (v1)

- Overview with stats + send charts + recent campaigns
- Compose: template → edit fields → audience → preview → send
- Templates library: seeded feature promos + editable structured fields
- History with per-campaign delivery results
- Audiences: all members with email, inactive (default 30d), role filter, manual emails
- Cap: 200 recipients/send; schema supports future queueing
- Auth: `members.write` (same as outreach)

## Out of scope (v1)

- Open/click pixel tracking
- Scheduled sends / drip sequences
- Full HTML WYSIWYG
- Unsubscribe preference center (footer note only)

## Architecture

- Prisma: `EmailMarketingTemplate`, `EmailMarketingCampaign`, `EmailMarketingDelivery`
- Render via enhanced `emailLayout` (logo header, body, CTA, footer/contact)
- Send via existing `sendEmail` (Resend/Mailjet/SMTP)
- UI: App Router + shadcn + Recharts, matching admin shell patterns

## Seeded templates

SmartForms, Reseller, Bulk SMS, WordPress plugin, Inactive re-engagement, Custom blank.
