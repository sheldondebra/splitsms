=== SplitSMS ===
Contributors: splitsms
Tags: sms, woocommerce, notifications, api, transactional
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later

Send transactional SMS from WordPress and WooCommerce using your SplitSMS API key.

== Description ==

* WooCommerce: order placed, payment complete, status changes (processing, completed, cancelled)
* WordPress: new user welcome SMS, optional password reset via SMS
* Contact Form 7 and WPForms: auto-reply SMS after form submit
* Per-feature toggles and editable message templates with placeholders

== Installation ==

1. Upload the `splitsms` folder to `/wp-content/plugins/` or zip and install via Plugins → Add New.
2. Activate the plugin.
3. Go to Settings → SplitSMS.
4. Enter API base URL https://www.splitsms.com (pre-filled) and your API key from the SplitSMS dashboard.
5. Enable the notifications you want and save.

== Frequently Asked Questions ==

= Where do I get an API key? =

Sign in to SplitSMS → Developers → API Keys.

= Which phone number is used for WooCommerce? =

The billing phone on the order.

== Changelog ==

= 1.0.0 =
* Initial release with WooCommerce, WordPress, CF7, and WPForms support.
