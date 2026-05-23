# SplitSMS — WordPress Plugin Mega Upgrade + SplitSMS App Updates
## Free Plugin, SplitSMS-Only Connection, Clean UI, Logs, Integrations & Website Sync

Version: 1.0  
Website: https://www.splitsms.com  
Plugin Name: SplitSMS for WordPress  
Plugin Type: Free WordPress Plugin  
Connection Rule: Plugin must only work with SplitSMS API keys from www.splitsms.com

---

# 1. Main Goal

Build a powerful but simple WordPress plugin that allows WordPress website owners to connect their site to SplitSMS and send automated SMS messages from common WordPress actions.

The plugin should be free to install and free to use as a plugin, but all SMS sending must happen through a valid SplitSMS account and API key from:

```txt
https://www.splitsms.com
```

The plugin must feel:

- Clean
- Fast
- Beginner-friendly
- Modern
- WordPress.org compliant
- Non-technical
- Easy to connect
- Easy to monitor

---

# 2. Important Business Rule

## Plugin Is Free

The WordPress plugin should be free.

Users can install it without paying.

## SMS Requires SplitSMS

The plugin must only send messages through SplitSMS.

Users must connect:

```txt
SplitSMS API Key
```

The plugin should not allow other SMS gateways.

---

# 3. Core Plugin Promise

The plugin should help WordPress users send SMS automatically for:

- WooCommerce orders
- Paystack payments
- GiveWP donations
- Membership subscriptions
- LearnPress course updates
- Contact form submissions
- User registration
- OTP login
- Bulk SMS
- Admin alerts
- Customer notifications

---

# 4. User Experience Standard

A non-technical WordPress user should be able to:

1. Install plugin.
2. Connect API key.
3. See SMS balance.
4. Enable SMS notifications.
5. Send test SMS.
6. View logs.

within 3 minutes.

---

# 5. WordPress Plugin Main Menu

Add a clean admin menu:

```txt
SplitSMS
├── Dashboard
├── Send SMS
├── Automations
├── Integrations
├── Logs
├── Settings
└── Help
```

---

# 6. WordPress Dashboard Header

The plugin should show a compact SplitSMS status header inside plugin pages.

## Header Items

```txt
SplitSMS Connected
SMS Balance: 12,450 SMS
Wallet Funds: GHS 620.00
API Status: Active
[ Add Funds ]
[ Send Test SMS ]
```

---

# 7. SMS Balance Display

Show SMS balance in multiple places:

## WordPress Admin Plugin Dashboard

```txt
SMS Balance
12,450 SMS available
```

## WordPress Admin Header Widget

```txt
SplitSMS: 12,450 SMS
```

## Plugin Settings Page

```txt
Connected API Key: sk_live_************9xQ
Balance: 12,450 SMS
Wallet Funds: GHS 620.00
Status: Active
```

---

# 8. Wallet Funds Display

Show wallet funds separately from SMS balance.

## Example

```txt
SMS Balance: 12,450 messages
Wallet Funds: GHS 620.00
```

This helps non-technical users understand both:

- how many SMS they can send
- how much money is left

---

# 9. API Connection Settings

## Settings Page Fields

```txt
API Key
Default Sender ID
Admin Phone Number
Low Balance Alert Number
Enable Debug Logs
```

---

# 10. Mask API Key

Never show the full API key after saving.

## Example

```txt
sk_live_***************8Kp
```

Buttons:

```txt
[ Test Connection ]
[ Reconnect ]
[ Remove API Key ]
```

---

# 11. API Status Card

Show connection status clearly.

## States

### Connected

```txt
✅ Connected to SplitSMS
```

### Failed

```txt
❌ Connection failed. Please check your API key.
```

### Loading

```txt
Checking SplitSMS connection...
```

### Low Balance

```txt
⚠ Your SMS balance is low.
```

---

# 12. Loading Experience

When user connects API key, show a polished loading experience.

## Loading Text Examples

```txt
Connecting to SplitSMS...
Checking your API key...
Loading your SMS balance...
Almost ready...
```

Use:

- spinner
- progress steps
- success animation
- friendly messages

---

# 13. Connection Flow

```txt
User enters API Key
↓
Plugin validates key with SplitSMS
↓
Plugin fetches account profile
↓
Plugin fetches SMS balance
↓
Plugin stores masked key securely
↓
Plugin shows connected dashboard
```

---

# 14. Secure API Storage

Store API key securely using WordPress options.

## Requirements

- Sanitize input
- Use capability checks
- Use nonces
- Never expose key in frontend
- Mask key in UI
- Use HTTPS for API calls

---

# 15. SplitSMS API Endpoints Needed

The SplitSMS app must expose these endpoints for the plugin.

```txt
GET /api/v1/account/status
GET /api/v1/wallet/balance
GET /api/v1/messages/logs
POST /api/v1/messages/send
POST /api/v1/wordpress/connect
POST /api/v1/wordpress/logs
POST /api/v1/wordpress/events
GET /api/v1/wordpress/site-status
```

---

# 16. WordPress Site Connection Tracking

When a WordPress site connects, SplitSMS dashboard should record it.

## Store

- Site URL
- WordPress version
- Plugin version
- PHP version
- Connection date
- Last sync time
- API key used
- Status

---

# 17. SplitSMS Dashboard WordPress Section

Add this page to SplitSMS web app:

```txt
/dashboard/integrations/wordpress
```

## Show

- Connected WordPress sites
- SMS logs from WordPress
- Plugin health
- Last API sync
- Failed messages
- Active automations
- Plugin version

---

# 18. SplitSMS App Logs for WordPress

When user logs into SplitSMS, they should see:

```txt
WordPress Logs
├── SMS sent
├── Failed SMS
├── WooCommerce events
├── Paystack events
├── GiveWP events
├── Membership events
├── OTP events
└── API errors
```

---

# 19. Plugin Logs Page

Create a beautiful logs page in WordPress.

## Log Columns

```txt
Date
Event
Recipient
Message Type
Status
Source Plugin
Cost
Action
```

---

# 20. Log Status Badges

Use color badges.

```txt
Delivered  = Green
Pending    = Yellow
Failed     = Red
Queued     = Blue
```

---

# 21. Logs Filters

## Filter By

- Date
- Status
- Integration
- Recipient
- Message type
- Campaign
- Failed only

---

# 22. Logs Search

Users should search by:

- Phone number
- Order ID
- Donation ID
- User name
- Campaign name

---

# 23. Logs Sync With SplitSMS

Every plugin log should also sync to SplitSMS.

## Sync Flow

```txt
WordPress Event Happens
↓
Plugin Sends SMS Through SplitSMS API
↓
WordPress Saves Local Log
↓
SplitSMS Saves Cloud Log
↓
User Can View Logs In Both Places
```

---

# 24. Dashboard Cards in WordPress Plugin

Create modern cards:

## Cards

```txt
SMS Balance
Wallet Funds
Messages Sent Today
Failed Messages
Active Automations
API Status
```

---

# 25. Charts in WordPress Plugin

Add simple charts.

## Charts

```txt
Messages Sent This Week
Delivery Status Breakdown
Top Integration Sources
Wallet Usage
```

Use simple chart library or lightweight SVG charts.

Avoid heavy dependencies.

---

# 26. Icons

Use clean icons for:

```txt
✉ SMS
💳 Wallet
🔌 API
📊 Reports
🛒 WooCommerce
💝 GiveWP
💰 Paystack
🎓 LearnPress
👥 Membership
```

In actual development, use Dashicons or bundled SVG icons.

---

# 27. Quick Actions

Show quick buttons on plugin dashboard:

```txt
[ Send Test SMS ]
[ Add Funds ]
[ View Logs ]
[ Enable Automations ]
[ Check API Status ]
```

---

# 28. Clean UI Rules

## The Plugin UI Should Be

- Card based
- White background
- Soft shadows
- Rounded corners
- Clean icons
- Short labels
- Friendly messages

---

# 29. Non-Technical Language

Use simple words.

## Replace

```txt
API Authentication Failed
```

With:

```txt
We could not connect to SplitSMS. Please check your API key.
```

## Replace

```txt
Webhook Event Processed
```

With:

```txt
Payment alert sent successfully.
```

---

# 30. Integrations Page

Create one page with integration cards.

## Integration Cards

```txt
WooCommerce
Paystack
GiveWP
MemberPress
Paid Memberships Pro
LearnPress
Tutor LMS
Contact Form 7
WPForms
Gravity Forms
Elementor Forms
```

Each card should show:

```txt
Status
Enable Button
Settings Button
Last Event
```

---

# 31. WooCommerce Features

## Send SMS When

- New order placed
- Payment received
- Order processing
- Order completed
- Order cancelled
- Order refunded
- Order shipped
- Failed payment

## Customer SMS Example

```txt
Hi {first_name}, your order #{order_id} has been received. Thank you for shopping with us.
```

## Admin SMS Example

```txt
New WooCommerce order #{order_id} received. Amount: {total}.
```

---

# 32. WooCommerce Abandoned Cart

Optional future feature.

## Send SMS When

- Customer abandons cart
- Cart value is high
- Checkout not completed

---

# 33. Paystack Plugin Integration

Support WordPress Paystack-related payment flows.

## Send SMS When

- Payment successful
- Payment failed
- Refund issued
- Subscription renewed
- Subscription failed

## Use Cases

- WooCommerce Paystack payments
- GiveWP Paystack donations
- Membership Paystack payments
- Custom Paystack forms

---

# 34. Paystack SMS Examples

## Successful Payment

```txt
Hi {name}, your payment of {amount} was successful. Ref: {reference}.
```

## Failed Payment

```txt
Hi {name}, your payment could not be completed. Please try again.
```

## Admin Alert

```txt
Payment received: {amount} from {name}. Ref: {reference}.
```

---

# 35. GiveWP Integration

Support GiveWP donation and fundraising SMS.

## Send SMS When

- Donation successful
- Donation failed
- Recurring donation renewed
- Donation receipt issued
- Campaign goal reached
- Donor registered

## Donor SMS Example

```txt
Thank you {first_name}, your donation of {amount} to {campaign_name} was received.
```

## Admin SMS Example

```txt
New donation received: {amount} from {donor_name} for {campaign_name}.
```

---

# 36. GiveWP Campaign Goal Alerts

Send SMS when campaign reaches:

```txt
25%
50%
75%
100%
```

---

# 37. Membership Plugin Integrations

Support:

- MemberPress
- Paid Memberships Pro
- Ultimate Member
- Restrict Content Pro

## Send SMS When

- User registers
- Membership activated
- Subscription renewed
- Subscription expired
- Payment failed
- Account approved

---

# 38. LearnPress Integration

Support LearnPress LMS events.

## Send SMS When

- Student enrolls
- Course completed
- Lesson reminder
- Quiz result released
- Certificate issued
- Instructor announcement

## Example

```txt
Hi {student_name}, you have successfully enrolled in {course_name}.
```

---

# 39. Tutor LMS Integration

Support Tutor LMS events.

## Send SMS When

- Enrollment completed
- Course completed
- Quiz submitted
- Assignment graded
- Instructor sends notice

---

# 40. Contact Form Integrations

Support:

- Contact Form 7
- WPForms
- Gravity Forms
- Fluent Forms
- Elementor Forms

## Send SMS When

- New form submitted
- Quote request received
- Booking request received
- Support request received

---

# 41. OTP Login Feature

Allow WordPress users to log in using phone OTP.

## Features

- Login with phone number
- Register with phone number
- Verify phone before checkout
- Two-factor authentication

---

# 42. OTP Use Cases

## Use For

- Customer login
- WooCommerce checkout
- Membership login
- Donation confirmation
- Account verification

---

# 43. Bulk SMS From WordPress

Allow admin to send SMS directly from WordPress.

## Send To

- WordPress users
- WooCommerce customers
- GiveWP donors
- LearnPress students
- Membership users
- Manual numbers
- CSV contacts

---

# 44. Bulk SMS UI

Keep it simple.

```txt
Choose Audience
↓
Write Message
↓
Preview Cost
↓
Send
```

---

# 45. Message Templates

Add templates for common use cases.

## Template Categories

- Orders
- Payments
- Donations
- Membership
- Courses
- Forms
- Announcements

---

# 46. Template Variables

Support variables like:

```txt
{name}
{first_name}
{amount}
{order_id}
{course_name}
{campaign_name}
{site_name}
{payment_reference}
```

---

# 47. Automation Builder

Simple automation builder.

## Example

```txt
When WooCommerce order is completed
Send SMS to customer
Send SMS to admin
```

Do not make it too complex.

---

# 48. Automation UI

Use a simple rule builder.

```txt
When [Event]
Send [Template]
To [Customer/Admin/Both]
```

---

# 49. SMS Preview

Before saving automation, show preview.

```txt
Preview:
Hi Ama, your order #1024 has been completed.
```

---

# 50. Cost Preview

Before sending bulk SMS, show:

```txt
Recipients: 250
Estimated SMS: 250
Estimated Cost: GHS 12.50
Current Balance: GHS 620.00
```

---

# 51. Low Balance Alerts

Notify admin when SMS balance is low.

## Alert Locations

- Plugin dashboard
- WordPress admin notice
- Email notification
- SMS notification if enabled

---

# 52. WordPress Admin Notices

Use clean notices.

```txt
SplitSMS connected successfully.
```

```txt
Your SplitSMS balance is low. Add funds to continue sending SMS.
```

---

# 53. Help Page

Add helpful resources.

## Include

- Connect guide
- Send test SMS guide
- Integration setup
- Common issues
- Support link
- SplitSMS dashboard link

---

# 54. Update System

## Best Option For WordPress.org

If the plugin is hosted on WordPress.org, updates should happen through the WordPress.org plugin directory.

Users can update in one click from WordPress admin.

## Alternative: SplitSMS Hosted Updates

If the plugin is not hosted on WordPress.org, add an Update URI in the plugin header and use a custom update endpoint from SplitSMS.

Example plugin header:

```php
/**
 * Plugin Name: SplitSMS
 * Plugin URI: https://www.splitsms.com/wordpress
 * Description: Connect WordPress to SplitSMS for SMS alerts, OTP, payments, donations, WooCommerce, and automations.
 * Version: 1.0.0
 * Author: SplitSMS
 * Author URI: https://www.splitsms.com
 * Text Domain: splitsms
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Update URI: https://www.splitsms.com/wordpress/plugin-updates
 */
```

---

# 55. SplitSMS Website Update Endpoint

Create on SplitSMS app:

```txt
GET /api/wordpress/plugin-version
GET /api/wordpress/plugin-download
```

## Version Response Example

```json
{
  "version": "1.0.2",
  "download_url": "https://www.splitsms.com/downloads/splitsms-wordpress.zip",
  "requires": "6.0",
  "tested": "6.7",
  "requires_php": "7.4"
}
```

---

# 56. WordPress.org Requirements Checklist

To meet WordPress.org standards, the plugin must:

- Use a valid plugin header.
- Include a proper `readme.txt`.
- Sanitize all user input.
- Escape all output.
- Use nonces for forms.
- Check user capabilities.
- Avoid remote code execution.
- Avoid tracking users without consent.
- Use WordPress HTTP API for requests.
- Use proper uninstall cleanup.
- Follow GPL-compatible licensing.
- Avoid obfuscated code.
- Pass Plugin Check.

---

# 57. Security Requirements

## Must Use

- `sanitize_text_field()`
- `sanitize_email()`
- `esc_html()`
- `esc_attr()`
- `esc_url()`
- `wp_nonce_field()`
- `check_admin_referer()`
- `current_user_can()`
- `wp_remote_post()`
- `wp_remote_get()`

---

# 58. Plugin Check

Before submission, test with:

```txt
Plugin Check
```

Fix:

- unescaped output
- unsanitized input
- missing nonces
- missing capability checks

---

# 59. Readme.txt Structure

Create:

```txt
readme.txt
```

Include:

- Plugin name
- Contributors
- Tags
- Requires at least
- Tested up to
- Requires PHP
- Stable tag
- License
- Description
- Installation
- FAQ
- Screenshots
- Changelog

---

# 60. Plugin File Structure

```txt
splitsms/
├── splitsms.php
├── readme.txt
├── uninstall.php
├── includes/
│   ├── class-splitsms-api.php
│   ├── class-splitsms-admin.php
│   ├── class-splitsms-logger.php
│   ├── class-splitsms-settings.php
│   ├── class-splitsms-automations.php
│   └── class-splitsms-integrations.php
├── integrations/
│   ├── class-splitsms-woocommerce.php
│   ├── class-splitsms-paystack.php
│   ├── class-splitsms-givewp.php
│   ├── class-splitsms-memberpress.php
│   ├── class-splitsms-learnpress.php
│   ├── class-splitsms-tutor-lms.php
│   └── class-splitsms-forms.php
├── assets/
│   ├── css/admin.css
│   ├── js/admin.js
│   └── icons/
└── templates/
    ├── dashboard.php
    ├── settings.php
    ├── logs.php
    ├── integrations.php
    └── automations.php
```

---

# 61. SplitSMS App Website Feature Section

Add to SplitSMS website features page.

## Feature Title

```txt
WordPress SMS Plugin
```

## Description

```txt
Connect your WordPress website to SplitSMS and automate SMS alerts for WooCommerce, Paystack, GiveWP, memberships, LearnPress, forms, and more.
```

## CTA

```txt
[ Download WordPress Plugin ]
[ View Setup Guide ]
```

---

# 62. Website Integration Page

Create:

```txt
/integrations/wordpress
```

## Page Sections

```txt
Hero
Supported Plugins
How It Works
Screenshots
Setup Guide
SMS Balance Sync
Logs & Reports
FAQ
Download CTA
```

---

# 63. Website Feature Cards

## Cards

```txt
WooCommerce SMS Alerts
Paystack Payment SMS
GiveWP Donation SMS
Membership SMS
LearnPress SMS
OTP Login
Bulk SMS
SMS Logs
```

---

# 64. SplitSMS Dashboard Connected WordPress Card

Add to SplitSMS dashboard home:

```txt
Connected WordPress Sites
2 active sites

Messages From WordPress
1,240 this month

Failed WordPress Messages
8 failed

[ View WordPress Logs ]
```

---

# 65. SplitSMS Dashboard WordPress Logs

Add filters:

- Site
- Plugin version
- Integration
- Status
- Date
- Recipient

---

# 66. SplitSMS Dashboard Integration Health

Show:

```txt
Site: example.com
Status: Connected
Plugin Version: 1.0.2
Last Sync: 3 minutes ago
SMS Sent Today: 45
Failed Today: 1
```

---

# 67. Data Sync Between WordPress and SplitSMS

## Sync These

- Site status
- Plugin version
- SMS logs
- Automation status
- API errors
- Balance checks
- Test SMS results

---

# 68. Privacy Requirements

## Important

Only sync data required for SMS logs and debugging.

Do not collect unnecessary private website data.

---

# 69. User Consent

In plugin settings, add a consent notice:

```txt
SplitSMS stores SMS logs and integration activity to help you track message delivery and troubleshoot issues.
```

---

# 70. Plugin Free Feature Set

Everything in plugin should be free.

## Free Features

- API connection
- Balance display
- Logs
- WooCommerce SMS
- Paystack SMS
- GiveWP SMS
- Membership SMS
- LearnPress SMS
- Bulk SMS
- OTP login
- Basic automations

Revenue comes from SMS usage inside SplitSMS.

---

# 71. Recommended Build Priority

## Phase 1

- API connection
- Balance display
- Send test SMS
- Logs
- WooCommerce integration

## Phase 2

- Paystack
- GiveWP
- Membership plugins
- LearnPress
- Bulk SMS

## Phase 3

- OTP login
- Charts
- Automation builder
- SplitSMS dashboard sync

## Phase 4

- Custom update system
- Plugin submission
- More integrations

---

# 72. Testing Checklist

## Test

- Connect API key
- Mask API key
- Fetch SMS balance
- Show wallet funds
- Send test SMS
- Log successful SMS
- Log failed SMS
- WooCommerce events
- Paystack events
- GiveWP events
- Membership events
- LearnPress events
- Low balance alerts
- Update system
- WordPress multisite basics

---

# 73. Final Product Vision

The SplitSMS WordPress plugin should become:

```txt
The easiest SMS automation plugin for WordPress.
```

It should work for:

- shops
- churches
- NGOs
- schools
- course creators
- membership sites
- agencies
- small businesses

The plugin must be:

- free
- clean
- beginner-friendly
- powerful
- secure
- connected only to SplitSMS
- ready for WordPress.org standards

---

# 74. Official References for Developers

Use these official WordPress resources while implementing:

- WordPress Plugin Developer Handbook
- WordPress Plugin Directory Guidelines
- WordPress Plugin Header Requirements
- WordPress Security APIs
- WordPress Sanitizing Data
- WordPress Escaping Data
- WordPress Nonces
- WordPress Plugin Check
