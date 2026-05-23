=== SplitSMS ===
Contributors: splitsms
Tags: sms, woocommerce, notifications, api, transactional
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.3.0
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
