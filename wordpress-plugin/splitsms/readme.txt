=== SplitSMS ===
Contributors: splitsms
Tags: sms, woocommerce, notifications, api, transactional
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.4.5
License: GPLv2 or later

Send transactional SMS from WordPress and WooCommerce using your SplitSMS API key.

== Description ==

* WooCommerce: order placed, payment complete, status changes (processing, completed, cancelled)
* WordPress: new user welcome SMS, optional password reset via SMS
* Contact Form 7, WPForms, and Elementor Pro: auto-reply SMS after form submit
* Paystack / Flutterwave / Stripe: SMS when WooCommerce marks orders paid (via WooCommerce hooks)
* Crocoblock: JetEngine, JetFormBuilder, JetBooking, JetAppointment
* Per-feature toggles and editable message templates with placeholders

== Installation ==

1. If upgrading, deactivate SplitSMS and delete every `splitsms` / `splitsms-1` folder under `wp-content/plugins/` first.
2. Install via Plugins → Add New → Upload `splitsms.zip` from splitsms.com (do not rename the zip file).
3. Activate the plugin.
3. Go to Settings → SplitSMS.
4. Enter API base URL https://www.splitsms.com (pre-filled) and your API key from the SplitSMS dashboard.
5. Enable the notifications you want and save.

== Frequently Asked Questions ==

= Where do I get an API key? =

Sign in to SplitSMS → Developers → API Keys.

= Which phone number is used for WooCommerce? =

The billing phone on the order.

== Changelog ==

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
