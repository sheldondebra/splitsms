=== SplitSMS ===
Contributors: splitsms
Tags: sms, woocommerce, notifications, api, transactional
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.6.0
License: GPLv2 or later

Send transactional SMS from WordPress and WooCommerce using your SplitSMS API key.

== Description ==

* **Dashboard** — balance, send test SMS, activity stats, and cloud log sync
* **WooCommerce** — order placed, payment complete, processing, completed, cancelled, failed, refunded, shipped (tracking), HPOS compatible, block checkout
* **WordPress core** — welcome SMS on registration, optional password reset via SMS
* **Forms** — Contact Form 7, WPForms, Elementor Pro Forms, JetFormBuilder native “Send SMS” action
* **Crocoblock** — JetEngine CPTs, JetFormBuilder, JetBooking, JetAppointment with reminders and admin alerts
* **Payments** — Paystack / Flutterwave / Stripe via WooCommerce payment hooks (no direct gateway API)
* Per-feature toggles, editable templates with placeholders, skip reasons in logs

== Installation ==

1. If upgrading, deactivate SplitSMS and delete every `splitsms` / `splitsms-1` folder under `wp-content/plugins/` first.
2. Install via Plugins → Add New → Upload `splitsms.zip` from splitsms.com (do not rename the zip file).
3. Activate the plugin.
4. Open the **SplitSMS** menu in wp-admin.
5. Enter your API key from the SplitSMS dashboard (Settings → SplitSMS).
6. Enable integrations and save.

== Frequently Asked Questions ==

= Where do I get an API key? =

Sign in to SplitSMS → Developers → API Keys.

= Which phone number is used for WooCommerce? =

The billing phone on the order (or shipping phone, custom meta key, or user meta as fallback).

= How do I add SMS to a JetFormBuilder form? =

Connect SplitSMS, then in the form editor go to JetForm → Post Submit Actions → New Action → **Send SMS (SplitSMS)**.

== Changelog ==

= 1.6.0 =
* New: WordPress core SMS settings UI — registration and password reset templates
* New: Dedicated WPForms integration with skip logs and per-form ID filter
* Improve: Complete Crocoblock admin — all JetEngine, JetBooking, and JetAppointment templates and toggles
* Improve: JetFormBuilder admin template and provider phone field controls
* Fix: Removed unused otp_login setting
* Improve: readme and installation steps aligned with SplitSMS admin menu

= 1.5.1 =
* New: JetFormBuilder native “Send SMS (SplitSMS)” post-submit form action
* Improve: Per-form SMS via JetFormBuilder actions; global auto-SMS skipped when the action runs
* Improve: Crocoblock JetFormBuilder panel documents Post Submit Actions setup

= 1.5.0 =
* New: Full Elementor Pro Forms integration aligned with official form hooks
* Improve: elementor_pro/forms/new_record + mail_sent fallback with dedupe
* Improve: Tel field detection via field type, Field ID, and auto-scan
* Improve: Per-form name filter, template vars, skip logs synced to dashboard
* New: Elementor setup panel on Integrations with Field ID instructions

= 1.4.9 =
* New: Dedicated Contact Form 7 integration (class-splitsms-cf7.php)
* New: CF7 setup panel — lists forms, field tips, link to CF7 docs
* Improve: wpcf7_submit hook (mail_sent + optional mail_failed when SMTP fails)
* Improve: Phone detection — tel fields, array values, auto-scan field names
* Improve: Template vars — form_title, form_id, subject, message, field_* placeholders
* Improve: Per-form ID filter and skip logs synced to SplitSMS dashboard
* Fix: CF7 hooks register even when SplitSMS loads before Contact Form 7

= 1.4.8 =
* New: WooCommerce failed, refunded, and shipped (tracking) SMS events + templates
* New: HPOS (custom order tables) compatibility declaration for WooCommerce
* Improve: Skip logs (no phone, offline COD/BACS, dedupe) sync to SplitSMS dashboard
* Improve: Order template vars — shipping, tracking, refund, order date, item count
* Improve: COD/BACS payment SMS only when order is marked paid
* Fix: WooCommerce integration boots even when plugin loads before WooCommerce

= 1.4.7 =
* New: Paystack setup checklist on Integrations (webhook URL copy, test/live tips)
* Improve: Payment SMS for Paystack on-hold→completed and subscription renewals
* Improve: Template variables {transaction_id} and {paystack_reference}
* Improve: Detect Paystack gateway even when disabled in checkout settings

= 1.4.6 =
* Fix: WordPress log sync uses sms.send permission (no longer requires sms.read)
* Fix: Cloud logs sync after send with final status (sent/failed), not stale pending
* Fix: Parse message_ids and campaign_id from SplitSMS send API response
* Fix: Send SMS admin page form handler and submit button
* Fix: Password reset keeps default email when user has no phone on file
* New: WooCommerce templates for order placed, processing, completed, and cancelled
* New: Low balance SMS alert (once per day when account status reports low balance)
* Improve: Crocoblock knowledge base link on Help page

= 1.4.5 =
* Fix: Find customer phone from billing, shipping, user meta, and common order meta keys
* New: Optional custom phone meta key on Integrations
* Improve: Logs show Details column with skip reason (e.g. no phone on order)

= 1.4.4 =
* Fix: WooCommerce hooks now register on woocommerce_init (plugin load order bug — no SMS on new orders)
* Fix: Block checkout support (woocommerce_store_api_checkout_order_processed)
* Fix: Payment SMS on processing no longer blocked by is_paid() on some gateways
* Improve: Skip reasons logged (no phone, not configured) under SplitSMS → Logs

= 1.4.3 =
* Fix: Reject key prefix-only paste (sk_test_99a064) — require full ~56-character secret
* Fix: Show reveals complete saved key; test connection uses saved key when field is empty
* Improve: Warning when saved key is incomplete

= 1.4.2 =
* New: Show / Hide API key on Settings
* New: API base URL always visible; auto-suggests http://127.0.0.1:3000 on Local (.local) sites
* Fix: Local API hosts (::1, host.docker.internal) and clearer HTTP error messages

= 1.4.1 =
* Fix: Saving Settings no longer disables the plugin (not_configured on Test connection)
* Fix: Each admin page only updates its own toggles — integrations are preserved when saving Settings
* Fix: Test connection uses the API key from the form before you save
* Improve: Clearer error messages when API key or connection is missing

= 1.4.0 =
* New: Redesigned admin UI with sidebar navigation and dashboard stats
* New: Versioned plugin zip (splitsms-x.y.z.zip) for downloads and updates
* Improve: Settings merge on upgrade — API keys and templates are preserved
* New: API base URL field when WP_DEBUG is enabled (local dev)
* New: Country code setting on Settings page

= 1.3.1 =
* Fix: Plugin activation fatal error — safer bootstrap, no risky class_exists autoload
* Fix: Cron schedule registered before scheduling events
* Fix: Guard WooCommerce payment checks on older WC versions

= 1.3.0 =
* Fix: Crocoblock modules (JetFormBuilder, JetBooking, etc.) work without master Crocoblock toggle
* New: Elementor Pro forms integration
* New: WooCommerce "Paid → processing" hook for Paystack / Flutterwave gateways
* Fix: WPForms phone field detection (field ID, type, and label)
* Fix: CF7 phone field fallbacks
* New: Integrations page shows detected plugins and gateway notes
* Fix: Allow localhost API URL for local development
* Improve: Payment SMS deduplication per order

= 1.2.1 =
* Fix plugin zip layout so installs and updates do not create `splitsms-1/splitsms/` (plugin file not found).

= 1.0.0 =
* Initial release with WooCommerce, WordPress, CF7, and WPForms support.
