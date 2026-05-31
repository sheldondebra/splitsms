# SplitSMS WordPress Plugin

Official plugin for [www.splitsms.com](https://www.splitsms.com). **Current release: 1.6.0**

## Download

- **Live site:** [https://www.splitsms.com/integrations/wordpress](https://www.splitsms.com/integrations/wordpress)
- **Latest zip:** [https://www.splitsms.com/wordpress-plugin/splitsms.zip](https://www.splitsms.com/wordpress-plugin/splitsms.zip)
- **Versioned zip:** `https://www.splitsms.com/wordpress-plugin/splitsms-{version}.zip` (e.g. splitsms-1.6.0.zip)

## Updates

WordPress checks `https://www.splitsms.com/api/plugin/update` for new versions. When you bump the version in `config/site.json` and run `npm run sync:site-config`, connected sites see the update in **Plugins → Updates**.

## Versioning

See **[VERSIONING.md](./VERSIONING.md)**. Summary:

- **Patch** (1.6.0 → 1.6.1): bug fixes only
- **Minor** (1.6.0 → 1.7.0): new features / UI / option keys
- Bump `config/site.json` → `npm run sync:site-config`

Builds produce **`splitsms-{version}.zip`** (canonical) and **`splitsms.zip`** (latest alias).

## Developer sync

Canonical URLs live in **`config/site.json`**. Run:

```bash
npm run sync:site-config
```

This regenerates:

- `wordpress-plugin/splitsms/includes/splitsms-config.php`
- `public/wordpress-plugin/version.json`
- `public/wordpress-plugin/splitsms-{version}.zip` and `splitsms.zip`
- Postman collection `baseUrl`

## Install / upgrade troubleshooting

**Error: “Plugin file does not exist”** (URL like `splitsms-1/splitsms/splitsms.php`):

1. Deactivate any SplitSMS entries under **Plugins**.
2. Delete **all** of these folders if present: `wp-content/plugins/splitsms`, `splitsms-1`, `splitsms-2`.
3. Download a fresh [splitsms.zip](https://www.splitsms.com/wordpress-plugin/splitsms.zip) — keep the filename `splitsms.zip`.
4. **Plugins → Add New → Upload** and activate.

**Error: “Plugin could not be activated because it triggered a fatal error”**

1. Delete all `splitsms`, `splitsms-1`, `splitsms-2` folders under `wp-content/plugins/`.
2. Download fresh [splitsms.zip](https://www.splitsms.com/wordpress-plugin/splitsms.zip) (v1.3.1+).
3. Upload and activate. If it still fails, enable `WP_DEBUG` in `wp-config.php` and check `wp-content/debug.log`.
4. Requires **PHP 7.4+** and **WordPress 6.0+**.

## Integrations (v1.6.0)

| Integration | How SplitSMS hooks in |
|-------------|------------------------|
| **WooCommerce** | Order placed, payment, processing, completed, cancelled, failed, refunded, shipped. HPOS + block checkout. |
| **Paystack / Flutterwave / Stripe** | WooCommerce payment hooks — enable **Paid → processing** and **Payment complete**. Paystack webhook checklist on Integrations. |
| **WordPress core** | User registration welcome SMS; optional password reset via SMS (`billing_phone` / `splitsms_phone` meta). |
| **Contact Form 7** | `wpcf7_submit` — per-form IDs, skip logs, optional mail_failed fallback. |
| **WPForms** | Dedicated `SplitSMS_WPForms` — `wpforms_process_complete`, per-form IDs, skip logs. |
| **Elementor Pro** | `elementor_pro/forms/new_record` + `mail_sent` fallback — Tel Field ID, skip logs. |
| **JetFormBuilder** | Native **Send SMS (SplitSMS)** Post Submit Action + optional global auto-SMS under Crocoblock. |
| **Crocoblock** | JetEngine, JetBooking, JetAppointment — **SplitSMS → Crocoblock** with full template editor. |

**Local dev:** API base URL may be `http://127.0.0.1:3000` on Local WP sites.

## Configure in WordPress

1. Install plugin (upload zip).
2. Open **SplitSMS** menu → **Settings**
3. API base URL: `https://www.splitsms.com` (pre-filled on new installs)
4. API key from your SplitSMS dashboard (full ~56-character secret)
5. Enable integrations under **SplitSMS → Integrations** and **Crocoblock**

## Changelog

Public release notes: [splitsms.com/changelog](https://www.splitsms.com/changelog). Plugin `readme.txt` mirrors version history for WordPress.org-style distribution.
