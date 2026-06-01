=== SplitSMS ===
Contributors: splitsms
Tags: sms, woocommerce, notifications, api, transactional
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.7.0
License: GPLv2 or later

Send transactional SMS from WordPress and WooCommerce using your SplitSMS API key.

== Description ==

* **Dashboard** — balance, send test SMS, activity stats, and cloud log sync
* **Forms** — one page for all form plugins: toggle SMS per form, pick phone field, edit message — no custom code
* **WooCommerce** — order placed, payment complete, processing, completed, cancelled, failed, refunded, shipped (tracking), HPOS compatible, block checkout
* **WordPress core** — welcome SMS on registration, optional password reset via SMS
* **Forms** — Contact Form 7, WPForms, Elementor Pro Forms, JetFormBuilder **Send SMS**, JetEngine **Send SMS**
* **Crocoblock** — JetEngine CPTs, JetFormBuilder, JetBooking, JetAppointment with reminders and admin alerts
* **Payments** — Paystack / Flutterwave / Stripe via WooCommerce payment hooks (no direct gateway API)
* Per-feature toggles, editable templates with placeholders, skip reasons in logs

== External services ==

SplitSMS connects to the SplitSMS API to send SMS and synchronize status/log data.

Service endpoints used:
* `https://www.splitsms.com/api/v1/sms/send` — send SMS
* `https://www.splitsms.com/api/v1/account/status` and `https://www.splitsms.com/api/v1/balance` — account/balance checks
* `https://www.splitsms.com/api/v1/sender-ids` — sender ID lookup
* `https://www.splitsms.com/api/v1/messages/{id}` — delivery status sync
* `https://www.splitsms.com/api/v1/wordpress/connect` — optional site connection metadata sync
* `https://www.splitsms.com/api/v1/wordpress/logs` — optional cloud log sync

Data sent to SplitSMS can include:
* Recipient phone numbers
* SMS message text and sender ID
* Event/source labels (for example order status event)
* Delivery status identifiers (for synced messages)
* Site metadata when connection sync is enabled (site URL, site name, WordPress version, plugin version, PHP version)

Data stored locally by this plugin:
* SplitSMS settings/options
* SMS activity logs in plugin tables (`splitsms_logs`, `splitsms_reminders`)

Cloud sync behavior:
* If an API key is configured, SplitSMS can sync selected logs and connection metadata to your SplitSMS account dashboard.
* Site owners are responsible for consent, lawful basis, and retention settings for phone number processing.

== Installation ==

1. Install from the WordPress plugin directory or upload the plugin zip.
2. Activate SplitSMS.
3. Open **SplitSMS** in wp-admin and click **Create free account** to sign up on splitsms.com (free starter SMS credits).
4. Copy your API key from splitsms.com → Developers → API Keys.
5. Paste the key under **SplitSMS → Settings** and save.
6. Enable integrations or configure form actions.

== How it works ==

SplitSMS is a cloud SMS platform at splitsms.com. This plugin connects your WordPress site to your SplitSMS account using an API key.

1. An event happens on your site (order placed, form submitted, user registered).
2. The plugin builds a message from your template and sends it through the SplitSMS API.
3. Your SplitSMS wallet is debited; delivery status syncs back to SplitSMS → Logs and your splitsms.com dashboard.

You configure everything in wp-admin — no custom PHP or theme edits required.

== User guide ==

= SplitSMS admin menu =

* **Dashboard** — balance, test SMS, stats, connection and update status
* **Settings** — API key, Sender ID, admin phone, replace-from-cloud reinstall
* **Forms** — auto-detected forms; toggle SMS, phone field, message per form
* **Integrations** — WooCommerce, WordPress core, CF7/WPForms/Elementor toggles
* **Crocoblock** — JetEngine, JetBooking, JetAppointment templates
* **Logs** — every send, skip, failure; Sent → Delivered when carrier confirms
* **Help** — quick start and full in-plugin documentation

= Forms — two ways to enable SMS =

**Forms manager (easiest):** SplitSMS → Forms → Refresh list → toggle Send SMS → pick phone field → edit message → Save.

**Native form actions (per-form in builder):**

* JetFormBuilder — Post Submit Actions → **Send SMS**
* JetEngine legacy forms — Notifications → type **Send SMS**
* Elementor Pro — Actions After Submit → **SplitSMS Notification**

When a native action is configured, duplicate global hooks are skipped for that submission. Macros: %phone%, %post_id%, %user_id%.

= WooCommerce =

Enable events under SplitSMS → Integrations. SMS goes to billing phone (then shipping, custom meta, or user meta). Placeholders: {customer_name}, {order_id}, {order_total}, {order_status}, {payment_method}, {paystack_reference}, {tracking_number}, {refund_amount}, {site_name}.

= Create account from WordPress =

WordPress.org installs show **Create free account** links in the plugin sidebar, Settings, Dashboard banner, and Plugins list. Sign up on splitsms.com, then paste your API key under Settings.

Deleting SplitSMS under **Plugins → Delete** removes the entire plugin folder and all SplitSMS data from your database.

== Frequently Asked Questions ==

= Where do I get an API key? =

Sign up at splitsms.com → log in → Developers → API Keys → Create key with **sms.send** permission. Copy the **full** secret (~56 characters) at creation — the dashboard only shows a prefix afterward.

= Which phone number is used for WooCommerce? =

The billing phone on the order (or shipping phone, custom meta key, or user meta as fallback). Check SplitSMS → Logs for skip reasons if no SMS is sent.

= How do I add SMS to a form without code? =

Open **SplitSMS → Forms**, click Refresh list, toggle Send SMS for your form, select the phone field, and save. Or add **Send SMS** / **SplitSMS Notification** in JetFormBuilder, JetEngine, or Elementor Pro form builder.

= How do delivery statuses work? =

Messages start as Sent in Logs. When the carrier confirms delivery (DLR), status updates to Delivered in wp-admin and on splitsms.com Dashboard → Integrations → WordPress.

= How do I update the plugin? =

Use Dashboard → Updates or Plugins → Check for updates. Manual fallback: download the latest zip from splitsms.com/integrations/wordpress. Settings → Replace from splitsms.com reinstalls in place when upload fails.

= Full documentation =

https://www.splitsms.com/docs and https://www.splitsms.com/integrations/wordpress — also under SplitSMS → Help in wp-admin.

== Privacy ==

This plugin integrates with WordPress privacy tools.

* It registers privacy policy helper content via `wp_add_privacy_policy_content()`.
* You should describe why phone numbers and message content are processed, your retention period, and any third-party transfer obligations in your site privacy policy.
* Removing the plugin via Plugins → Delete removes SplitSMS plugin data from your database.

== Changelog ==

= 1.7.0 =
* Fix: Safer bootstrap — integrations load only when WooCommerce, Elementor Pro, CF7, WPForms, or JetEngine are active.
* Fix: Elementor loads on elementor_pro/init (no more early fatal errors).
* Fix: Fewer admin API calls — cloud sync only on Dashboard, not every admin page.
* Improve: Simpler update UI (one Update button), update notices only on SplitSMS screens.
* Improve: Try/catch around plugin update AJAX and JetFormBuilder macro parsing.

= 1.6.9 =
* Fix: Critical error when Elementor/JetFormBuilder action files load before their parent classes exist.
* Fix: Safer plugin update (load WordPress upgrader APIs correctly, guard filesystem cache clear).
* Fix: Correct settings merge hook after plugin update.
* Improve: Plugin zip always includes VERSION file and SplitSMS-v{version}.zip (+ splitsms-plugin-v{version}.zip alias).

= 1.6.8 =
* New: Create free account — signup CTAs in plugin admin, Settings, sidebar, and Plugins list for WordPress.org users
* New: Elementor Pro **SplitSMS Notification** under Actions After Submit (phone, message, sender ID, admin copy)
* New: JetFormBuilder & JetEngine legacy **Send SMS** action with %phone%, %post_id%, %user_id% macros
* Improve: In-plugin Help documentation — admin menu guide, Forms manager, native actions, troubleshooting
* Improve: Delivery status sync — Sent → Delivered in Logs and splitsms.com dashboard
* Improve: WordPress.org packaging — privacy policy hook, translation-ready, dev files excluded from release zip
* Change: Versioned download filename SplitSMS-v{version}.zip on splitsms.com

= 1.6.7 =
* New: Plugin version check vs splitsms.com when API is connected — update banner, admin notice, and Site details (WordPress + PHP versions)
* New: SplitSMS dashboard shows when connected sites run an outdated plugin, with WP and PHP versions
* Improve: Cleaner admin shell — connection status, environment details, and update alerts on every page
* Improve: Help page — quick start without custom code; point to Forms manager for form SMS

= 1.6.6 =
* New: **Forms** page — auto-detects Elementor Pro, JetFormBuilder, JetEngine Forms, Contact Form 7, and WPForms
* New: Per-form toggle switches, custom SMS message, phone field, and optional admin copy
* New: **Refresh list** rescans your site when new forms are added
* Improve: Delivery status sync for dashboard and WordPress logs (Sent → Delivered)

= 1.6.5 =
* New: JetEngine legacy forms (JetEngine → Forms) — **SplitSMS Notification** in Notifications Settings Type dropdown with phone field, message, admin copy, country code, sender ID
* Improve: Shared SMS helper for JetFormBuilder + JetEngine legacy forms

= 1.6.4 =
* New: JetFormBuilder **SplitSMS Notification** action in Post-submit Actions / Notification Settings — pick phone field, custom To, message macros, admin copy, country code field, sender ID override
* Fix: Action appears in the form builder even before API key is saved (shows connect notice until configured)
* Improve: Native form editor UI with field dropdowns (matches Send Email layout)

= 1.6.3 =
* Fix: Delete removes all splitsms* plugin folders from disk — fixes plugin reappearing after uninstall on some hosts
* Fix: Clears auto-update and active-plugin entries on uninstall so WordPress does not restore SplitSMS from cache

= 1.6.2 =
* Improve: Integrations page — overview dashboard, section navigation, cleaner WooCommerce / Paystack / forms layout
* New: Sender ID picker — select from your SplitSMS account (search dropdown, status lights); no manual typing
* Improve: Settings — API key shows “Connected” with masked key; sender_ids.read scope documented
* Improve: Paystack panel two-column checklist + webhook layout

= 1.6.1 =
* Fix: Plugin zip uses standard WordPress layout (splitsms/splitsms.php) so uploads and updates replace the folder correctly
* New: uninstall.php — deleting the plugin removes all SplitSMS data; WordPress removes the full plugin folder
* New: “Replace from splitsms.com” on Settings — reinstall without manual FTP when upload says folder exists
* Fix: Removes leftover splitsms-1 folders and nested splitsms/splitsms/ installs on activation

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
