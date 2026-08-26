# Smart Forms marketing popup

## Goal

A selling-point overlay that promotes Smart Forms on public marketing pages, with image, caption, description, and a CTA to `/smart-forms`.

## Placement

Show on homepage, blog, and other public marketing pages that use the site header.

Never show on:

- `/smart-forms` (and nested paths)
- Ads funnel `/go`
- App surfaces: `/dashboard`, `/admin`, `/reseller`, `/enterprise`, `/developers`, `/onboarding`
- Auth: `/login`, `/signup`, `/verify-otp`, `/forgot-password`, `/complete-phone`, `/complete-profile`, `/reset-password`
- Public form fill `/f/*` and embeds `/embed/*`
- Invite `/join/*` and API `/api/*`

## Trigger and dismiss

- Open after the visitor has scrolled about 25% of the page
- If the page cannot scroll, open once the page is eligible (short legal pages still get the offer)
- Dismiss for the rest of the browser session (close, overlay, Escape, or CTA)
- Storage key: `splitsms.smart-forms-popup.dismissed`

## Creative

- Image: `/images/smart-forms-hero.png`
- Caption: Smart Forms
- Headline: Forms that collect leads and send SMS
- Body: Build a branded form, share a link or QR, and fire a confirmation text the moment someone submits. Leads, RSVPs, and feedback without extra tools.
- CTA: See Smart Forms → `/smart-forms`

## Architecture

- Pure rules in `lib/marketing/smart-forms-popup.ts`
- Client overlay in `components/marketing/smart-forms-promo-popup.tsx`
- Mount next to `SiteHeaderWithAccount` so homepage, pricing, features, and `MarketingPageShell` pages all get it
