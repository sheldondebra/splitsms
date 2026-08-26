# Ads funnel landing page (`/go`)

## Goal

A dedicated, noindex landing page for paid ads. One offer: SplitSMS as a pay-as-you-go SMS platform with 5 free credits. Primary CTA goes to `/signup`. Mixed audience (bulk, WordPress, API) appears as proof below the fold, not as competing offers.

## Route and SEO

- URL: `/go`
- Metadata: `noindex, nofollow` via `buildPageMetadata({ noIndex: true })`
- Disallow `/go` in `robots.ts`
- Do not add `/go` to the sitemap
- Ads may still scrape Open Graph; keep a real title and description

## Chrome

- Logo + one CTA in a thin bar. No marketing nav, no blog, no sitemap footer.
- Footer: Terms and Privacy only.
- Logged-out CTA label: `Start free`
- Logged-in CTA: `Open dashboard` → `/dashboard`

## Conversion

- Logged out: `/signup?from=go` plus allowlisted tracking params (`utm_*`, `gclid`, `fbclid`, reseller `r`)
- No on-page lead form
- No ad pixels in this build

## Page sections

1. Hero on `/images/hero-background.png` (image-as-canvas, copy in a readable safe area)
2. Three proof lanes using `/images/splitsms-selling.png`, `/images/smart-forms-hero.png`, `/images/rest-api-developer.png` (asymmetric, not three equal cards)
3. How it works: Create account, Register Sender ID, Top up, Send SMS
4. Price teaser: live Ghana rate when available, fallback `GHS 0.029`. Secondary link to `/pricing`
5. FAQ with `/images/faq-sms.png`
6. Close with `/images/smart-forms-scenarios.png` plus mobile sticky CTA

## Brand

Reuse SplitSMS orange, `font-marketing` (Bricolage Grotesque), existing photography, lucide icons, marketing pill CTAs. Do not generate new images.

## Out of scope

Meta/Google pixels, SEO public twin, on-page signup form, WhatsApp close.
