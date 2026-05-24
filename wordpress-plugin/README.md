# SplitSMS WordPress Plugin

Official plugin for [www.splitsms.com](https://www.splitsms.com).

## Download

- **Live site:** [https://www.splitsms.com/integrations](https://www.splitsms.com/integrations)
- **Latest zip:** [https://www.splitsms.com/wordpress-plugin/splitsms.zip](https://www.splitsms.com/wordpress-plugin/splitsms.zip)
- **Versioned zip:** `https://www.splitsms.com/wordpress-plugin/splitsms-{version}.zip` (e.g. splitsms-1.4.0.zip)

## Updates

WordPress checks `https://www.splitsms.com/api/plugin/update` for new versions. When you bump the version in `config/site.json` and run `npm run sync:site-config`, all connected sites see the update in **Plugins → Updates**.

## Versioning

See **[VERSIONING.md](./VERSIONING.md)**. Summary:

- **Patch** (1.4.0 → 1.4.1): bug fixes only
- **Minor** (1.4.0 → 1.5.0): new features / UI / option keys
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

This happens when an older zip (with a nested `splitsms/` folder) was uploaded while a previous copy already existed. v1.3.1+ ships a flat zip to avoid that.

**Error: “Plugin could not be activated because it triggered a fatal error”**

1. Delete all `splitsms`, `splitsms-1`, `splitsms-2` folders under `wp-content/plugins/`.
2. Download fresh [splitsms.zip](https://www.splitsms.com/wordpress-plugin/splitsms.zip) (v1.3.1+).
3. Upload and activate. If it still fails, enable `WP_DEBUG` in `wp-config.php` and check `wp-content/debug.log` for the exact PHP error line.
4. Requires **PHP 7.4+** and **WordPress 6.0+**.

## Integrations (v1.3.0)

| Integration | How SplitSMS hooks in |
|-------------|------------------------|
| **Paystack / Flutterwave / Stripe** | WooCommerce order events — enable **Paid → processing** and **Payment complete** under Integrations. Configure gateway webhooks in WooCommerce so orders reach `processing` or `completed`. |
| **WPForms** | `wpforms_process_complete` — set phone field name (e.g. `phone`) in Integrations. |
| **Contact Form 7** | `wpcf7_mail_sent` — default phone field `your-phone`. |
| **Elementor Pro** | `elementor_pro/forms/new_record` — enable under Integrations. |
| **Crocoblock** | JetEngine, JetFormBuilder, JetBooking, JetAppointment — **SplitSMS → Crocoblock**. Per-module toggle works without the master Crocoblock switch. |

**Local dev:** API base URL may be `http://127.0.0.1:3000` when `WP_DEBUG` is on (allowed hosts filter).

## Configure in WordPress

1. Install plugin (upload zip).
2. **Settings → SplitSMS**
3. API base URL: `https://www.splitsms.com` (pre-filled on new installs)
4. API key from your SplitSMS dashboard
5. Enable WooCommerce / WordPress / form events as needed
