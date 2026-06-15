# SplitSMS Smart Forms Implementation Guide

## Purpose

This document explains how to implement **Smart Forms** inside the existing SplitSMS application.

Smart Forms will let users create fully customizable forms, generate short links and QR codes, embed forms on websites and WordPress, collect responses, save respondents into contact groups, trigger instant SMS replies, view analytics, and export form data.

This is an added feature inside the existing SplitSMS app, not a separate application.

---

# Feature Name

**SplitSMS Smart Forms**

Alternative names:

- SplitSMS Forms
- SMS Forms
- Lead Capture Forms
- Campaign Forms
- Smart Lead Forms

Recommended name:

> **Smart Forms**

Recommended tagline:

> Create forms, collect contacts, and send instant SMS replies automatically.

---

# Main Goals

Smart Forms should help SplitSMS users:

1. Create custom public forms.
2. Share forms using short links.
3. Generate QR codes for offline sharing.
4. Embed forms on websites and WordPress.
5. Collect leads, registrations, surveys, feedback, and inquiries.
6. Automatically save respondents into contact groups.
7. Send instant SMS confirmations after submission.
8. Send admin notifications for new submissions.
9. Track views, opens, clicks, shares, QR scans, submissions, and conversions.
10. Export responses to CSV, Excel, and PDF.
11. Use collected contacts for future bulk SMS campaigns.

---

# Core User Flow

```txt
User opens dashboard
    ↓
Clicks Smart Forms
    ↓
Creates a new form
    ↓
Adds and customizes fields
    ↓
Configures contact group saving
    ↓
Configures auto SMS reply
    ↓
Publishes form
    ↓
Gets short link, QR code, iframe embed, and WordPress embed code
    ↓
Shares or embeds form
    ↓
Visitors submit form
    ↓
SplitSMS saves response
    ↓
SplitSMS saves contact to group
    ↓
SplitSMS sends instant SMS if enabled
    ↓
SplitSMS tracks analytics
    ↓
User views responses and analytics
    ↓
User exports data or sends bulk SMS to collected group
```

---

# Dashboard Routes

Add these routes to the existing dashboard.

```txt
/dashboard/forms
/dashboard/forms/create
/dashboard/forms/[formId]
/dashboard/forms/[formId]/builder
/dashboard/forms/[formId]/responses
/dashboard/forms/[formId]/analytics
/dashboard/forms/[formId]/automation
/dashboard/forms/[formId]/share
/dashboard/forms/[formId]/settings
```

Public routes:

```txt
/f/[shortCode]
/forms/[slug]
/embed/forms/[shortCode]
/api/public/forms/[shortCode]/submit
```

Recommended public URL format:

```txt
https://splitsms.com/f/abc123
```

Optional branded forms subdomain:

```txt
https://forms.splitsms.com/abc123
```

---

# Sidebar Navigation

Add a sidebar item in the dashboard:

```txt
Smart Forms
```

Suggested submenu:

```txt
All Forms
Create Form
Templates
Responses
Analytics
```

---

# Main Pages To Build

## 1. Forms Overview Page

Path:

```txt
/dashboard/forms
```

Purpose:

- Show all forms created by the current user.
- Show status and key performance metrics.
- Allow quick actions.

Page elements:

- Page title: `Smart Forms`
- Description: `Create forms, collect contacts, and automate SMS follow-ups.`
- Primary button: `Create Form`
- Search input
- Status filter
- Date filter
- Form cards or table

Table/card data:

- Form name
- Status: Draft, Published, Closed
- Views
- Submissions
- Conversion rate
- Contacts collected
- SMS sent
- QR scans
- Last submission
- Created date
- Actions

Actions:

- Edit
- View public form
- Copy short link
- Download QR code
- View responses
- View analytics
- Share/embed
- Duplicate
- Close form
- Delete

---

## 2. Create Form Page

Path:

```txt
/dashboard/forms/create
```

Purpose:

- Start a new form from blank or template.

Options:

- Blank form
- Event registration
- Contact collection
- Customer feedback
- Training registration
- Church registration
- School inquiry
- Product order
- Appointment request
- Survey form

Initial fields:

- Form name
- Description
- Template selection
- Contact group option

After creation, redirect to:

```txt
/dashboard/forms/[formId]/builder
```

---

## 3. Form Builder Page

Path:

```txt
/dashboard/forms/[formId]/builder
```

Purpose:

- Let users build and customize forms.

Recommended layout:

```txt
Left panel: field blocks
Center: live form canvas
Right panel: selected field settings and form design settings
Top bar: save, preview, publish
```

Builder features:

- Add fields
- Edit field label
- Edit placeholder
- Edit helper text
- Mark field as required
- Set validation rules
- Reorder fields
- Duplicate fields
- Delete fields
- Preview form
- Save draft
- Publish form

MVP field types:

- Short text
- Long text
- Phone number
- Email
- Number
- Dropdown
- Radio buttons
- Checkboxes
- Date
- Time
- Consent checkbox
- Section title
- Divider

Advanced field types:

- File upload
- Rating
- NPS score
- Hidden field
- Address
- Website URL
- Currency amount
- Product quantity
- Payment amount

---

# Form Customization

Smart Forms must be fully customizable while keeping the UI clean.

## Branding Settings

Allow the user to customize:

- Form title
- Form description
- Logo
- Banner image
- Theme color
- Button text
- Button color
- Button radius
- Background color
- Background image
- Form card style
- Footer text
- Show or hide SplitSMS branding based on plan

## Layout Settings

Options:

- Default layout
- Compact layout
- Spacious layout
- Centered card layout
- Full-width layout
- Single-column layout
- Multi-section layout

## Success Page Settings

Allow customization of:

- Success title
- Success message
- Redirect URL
- Redirect delay
- Custom button text
- Custom button URL

Example success message:

```txt
Thank you, {{first_name}}. Your submission has been received. We have sent you a confirmation SMS.
```

---

# Phone Number Field

The phone field is the most important field because SplitSMS depends on valid SMS numbers.

Requirements:

- Country selector
- Default country setting
- Ghana number support
- International number normalization
- Duplicate phone number detection
- Invalid number warning
- Required phone number setting
- Store normalized phone numbers

Example:

```txt
User enters: 0244123456
System stores: 233244123456
```

Recommended validation behavior:

- Remove spaces
- Remove hyphens
- Remove leading zero when country code is added
- Store in international format
- Reject clearly invalid numbers

---

# Form Settings

Each form should include settings for publishing, collection, automation, and security.

## General Settings

- Form name
- Slug
- Description
- Status: Draft, Published, Closed
- Start date
- End date
- Submission limit
- Custom success message
- Redirect after submission
- Enable or disable form

## Submission Settings

- Allow multiple submissions
- Prevent duplicate phone numbers
- Prevent duplicate emails
- Require phone number
- Require email
- Enable CAPTCHA
- Enable honeypot field
- Limit by IP/device
- Close form after expiry date
- Close form after submission limit

## Contact Settings

- Save respondents as contacts
- Select existing contact group
- Create new contact group
- Update existing contact if phone number exists
- Skip duplicate contacts
- Add tags to contacts
- Map form fields to contact fields

## SMS Settings

- Send instant SMS to respondent
- Send SMS notification to admin
- Select sender ID
- Select SMS template
- Create custom SMS message
- Use merge tags
- Estimate SMS credit usage
- Deduct SMS credits on send
- Queue failed messages if needed
- Show failed reason if SMS fails

## Email Settings

- Send email notification to admin
- Send email confirmation to respondent
- Add multiple notification emails
- Customize email subject
- Customize email body

---

# SMS Automation

## Respondent Auto SMS

When a visitor submits a form, the system can send them an instant SMS.

Example:

```txt
Hi {{first_name}}, thank you for registering for {{form_name}}. We will contact you soon.
```

## Admin Notification SMS

The form owner can receive an SMS when someone submits the form.

Example:

```txt
New submission on {{form_name}} from {{name}} - {{phone}}.
```

## Merge Tags

Support these merge tags:

```txt
{{name}}
{{first_name}}
{{last_name}}
{{phone}}
{{email}}
{{form_name}}
{{submission_date}}
{{submission_time}}
{{custom_field}}
```

## SMS Credit Rules

- Respondent auto SMS deducts from user SMS balance.
- Admin notification SMS deducts from user SMS balance.
- If balance is insufficient, response should still be saved.
- Failed SMS should be logged.
- User should see failed reason.
- Optional: allow retry after top-up.

---

# Contact Group Integration

When creating or editing a form, user should choose how contacts are saved.

Options:

```txt
Do not save contacts
Save to existing contact group
Create new contact group
```

Advanced option:

```txt
Save to multiple contact groups
```

Contact mapping:

- Name
- Phone number
- Email
- Location
- Tags
- Notes
- Custom fields

Duplicate handling:

- Skip duplicate phone number
- Update existing contact
- Save response only
- Add tag to existing contact

---

# Responses Page

Path:

```txt
/dashboard/forms/[formId]/responses
```

Purpose:

- View, search, filter, export, and manage submissions.

Response table columns:

- Submitted date
- Name
- Phone number
- Email
- Source
- Device
- Contact status
- SMS status
- Reviewed status
- Actions

Actions:

- View details
- Add note
- Save as contact
- Add to group
- Send SMS
- Delete response
- Export response

Bulk actions:

- Export selected
- Delete selected
- Add selected to contact group
- Send SMS to selected
- Mark as reviewed

Filters:

- Date range
- Source
- SMS status
- Contact status
- Reviewed/unreviewed
- Field value

---

# Analytics Dashboard

Path:

```txt
/dashboard/forms/[formId]/analytics
```

The analytics dashboard must track form performance deeply.

## Metrics Cards

Show these cards:

- Total views
- Unique views
- Short link clicks
- Opens
- Shares
- QR code scans
- Submissions
- Conversion rate
- Contacts collected
- SMS sent
- SMS failed
- Exports
- Last submission date

## Definitions

### View

A form page load.

### Unique View

Estimated unique visitor based on session, IP hash, or device fingerprint.

### Click

A click on the generated short link.

### Open

A form open from a tracked source such as SMS, WhatsApp, QR code, email, website, iframe, or direct link.

### Share

A click on a built-in share action such as WhatsApp, copy link, Facebook, SMS share, email share, or embed copy.

### QR Scan

A form open using the QR code tracking URL.

### Submission

A completed form response.

### Conversion Rate

```txt
Submissions / Views * 100
```

---

# Charts And Graphs

Add charts for:

1. Views over time
2. Submissions over time
3. Conversion rate over time
4. QR scans over time
5. Shares by platform
6. Traffic source breakdown
7. Device breakdown
8. Contact growth over time
9. SMS automation status
10. Response status distribution

Recommended source breakdown:

- Direct
- Short link
- QR code
- WhatsApp
- SMS
- Facebook
- Instagram
- Website iframe
- WordPress embed
- Email
- Unknown

Recommended device breakdown:

- Mobile
- Desktop
- Tablet

Recommended SMS status breakdown:

- Sent
- Delivered
- Failed
- Pending
- Insufficient balance

Analytics filters:

- Today
- Yesterday
- Last 7 days
- Last 30 days
- This month
- Last month
- Custom date range
- Source
- Device type
- Form status
- Contact group

---

# Share Page

Path:

```txt
/dashboard/forms/[formId]/share
```

Purpose:

Give the user everything needed to share or embed the form.

Sections:

1. Public short link
2. QR code
3. Social share buttons
4. Website iframe embed
5. WordPress embed instructions
6. JavaScript embed code
7. Tracking options

---

# Short Link

Every published form should generate a short link.

Example:

```txt
https://splitsms.com/f/a8K29d
```

Features:

- Auto-generated short code
- Optional custom slug
- Copy button
- Click tracking
- Source tracking
- UTM support
- Link expiry
- Disable link when form closes

Custom slug example:

```txt
https://splitsms.com/f/church-registration
```

---

# QR Code

Each published form should generate a QR code.

Features:

- Generate after publish
- Download PNG
- Download SVG
- Print-friendly quality
- Track QR scans
- Optional branded QR code
- Optional logo inside QR code

QR code should point to a tracking URL like:

```txt
https://splitsms.com/f/a8K29d?source=qr
```

---

# Advanced Feature: Website Iframe Embed

Users should be able to embed a form on any website using iframe.

## Iframe Embed Code

Show this code in the Share page:

```html
<iframe
  src="https://splitsms.com/embed/forms/a8K29d?source=iframe"
  width="100%"
  height="720"
  frameborder="0"
  style="border:0; width:100%; max-width:100%; min-height:720px;"
  title="SplitSMS Smart Form"
></iframe>
```

## Iframe Route

Create a special embed route:

```txt
/embed/forms/[shortCode]
```

This page should render only the form without the full SplitSMS header, dashboard, or marketing layout.

Embed page should include:

- Form title
- Form description
- Form fields
- Submit button
- Success message
- Minimal footer branding

Embed page should not include:

- Dashboard navigation
- Homepage header
- Homepage footer
- Unnecessary scripts

## Iframe Tracking

When form loads inside iframe, track:

```txt
event_type: open
source: iframe
```

If source is WordPress:

```txt
event_type: open
source: wordpress
```

## Auto Height Option

Basic iframe requires a fixed height. For a better experience, add JavaScript auto-resize later.

---

# Advanced Feature: JavaScript Embed

In addition to iframe, provide a JavaScript embed snippet.

## Script Embed Code

```html
<div data-splitsms-form="a8K29d"></div>
<script src="https://splitsms.com/embed.js" async></script>
```

The script should:

1. Find all elements with `data-splitsms-form`.
2. Create an iframe inside each element.
3. Set the iframe source to `/embed/forms/[shortCode]?source=script`.
4. Listen for height messages from iframe.
5. Resize iframe automatically.

## Example embed.js Behavior

```js
(function () {
  function initSplitSMSForms() {
    var containers = document.querySelectorAll('[data-splitsms-form]');

    containers.forEach(function (container) {
      var code = container.getAttribute('data-splitsms-form');
      if (!code) return;

      var iframe = document.createElement('iframe');
      iframe.src = 'https://splitsms.com/embed/forms/' + encodeURIComponent(code) + '?source=script';
      iframe.width = '100%';
      iframe.height = '720';
      iframe.frameBorder = '0';
      iframe.style.border = '0';
      iframe.style.width = '100%';
      iframe.style.maxWidth = '100%';
      iframe.title = 'SplitSMS Smart Form';

      container.innerHTML = '';
      container.appendChild(iframe);
    });
  }

  window.addEventListener('message', function (event) {
    if (!event.data || event.data.type !== 'splitsms-form-height') return;

    var iframes = document.querySelectorAll('iframe[src*="/embed/forms/"]');
    iframes.forEach(function (iframe) {
      if (iframe.contentWindow === event.source) {
        iframe.style.height = event.data.height + 'px';
      }
    });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSplitSMSForms);
  } else {
    initSplitSMSForms();
  }
})();
```

## Embed Page Height Messaging

Inside the embed form page, post height to parent:

```js
function sendHeight() {
  window.parent.postMessage({
    type: 'splitsms-form-height',
    height: document.documentElement.scrollHeight
  }, '*');
}

window.addEventListener('load', sendHeight);
window.addEventListener('resize', sendHeight);
setTimeout(sendHeight, 500);
```

For production, restrict allowed origins where possible.

---

# Advanced Feature: WordPress Embed

Users should be able to embed Smart Forms in WordPress.

## Option 1: Iframe Embed For WordPress

The simplest method is to paste iframe code into a WordPress Custom HTML block.

WordPress instructions to show inside SplitSMS:

```txt
1. Open your WordPress admin dashboard.
2. Open the page or post where you want to show the form.
3. Add a Custom HTML block.
4. Paste the SplitSMS iframe code.
5. Update or publish the page.
```

WordPress iframe code:

```html
<iframe
  src="https://splitsms.com/embed/forms/a8K29d?source=wordpress"
  width="100%"
  height="720"
  frameborder="0"
  style="border:0; width:100%; max-width:100%; min-height:720px;"
  title="SplitSMS Smart Form"
></iframe>
```

## Option 2: WordPress Shortcode Plugin Later

Build a small WordPress plugin later with this shortcode:

```txt
[splitsms_form id="a8K29d"]
```

Plugin output:

```html
<iframe
  src="https://splitsms.com/embed/forms/a8K29d?source=wordpress_shortcode"
  width="100%"
  height="720"
  frameborder="0"
  style="border:0; width:100%; max-width:100%; min-height:720px;"
  title="SplitSMS Smart Form"
></iframe>
```

## WordPress Plugin File Example

Create a file named:

```txt
splitsms-forms.php
```

Content:

```php
<?php
/**
 * Plugin Name: SplitSMS Smart Forms
 * Description: Embed SplitSMS Smart Forms using a shortcode.
 * Version: 1.0.0
 * Author: SplitSMS
 */

if (!defined('ABSPATH')) {
    exit;
}

function splitsms_form_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => '',
        'height' => '720',
    ), $atts, 'splitsms_form');

    $id = sanitize_text_field($atts['id']);
    $height = intval($atts['height']);

    if (empty($id)) {
        return '<p>SplitSMS form ID is missing.</p>';
    }

    $src = 'https://splitsms.com/embed/forms/' . rawurlencode($id) . '?source=wordpress_shortcode';

    return '<iframe src="' . esc_url($src) . '" width="100%" height="' . esc_attr($height) . '" frameborder="0" style="border:0;width:100%;max-width:100%;min-height:' . esc_attr($height) . 'px;" title="SplitSMS Smart Form"></iframe>';
}

add_shortcode('splitsms_form', 'splitsms_form_shortcode');
```

## Option 3: WordPress Block Later

Later, build a Gutenberg block where users paste their form short code and the block renders the form preview.

Block fields:

- Form ID / short code
- Height
- Source tracking label
- Show border yes/no

---

# Advanced Feature: Website Popup Embed

Later, allow users to show a form as a popup on their website.

Example code:

```html
<script
  src="https://splitsms.com/embed-popup.js"
  data-form="a8K29d"
  data-trigger="delay"
  data-delay="5000"
  async>
</script>
```

Triggers:

- Button click
- Page load delay
- Exit intent
- Scroll percentage

This can be a premium feature.

---

# Public Form Page

Public form route:

```txt
/f/[shortCode]
```

The public page should be:

- Fast
- Mobile-first
- Clean
- Responsive
- Branded based on form settings
- Easy to submit

Public form should include:

- Logo
- Banner
- Title
- Description
- Fields
- Consent checkbox
- Submit button
- Error states
- Success message

Do not require the visitor to log in.

---

# Homepage Update Section

Add a new homepage section to announce Smart Forms.

## Section Copy

```txt
New Feature

Introducing SplitSMS Smart Forms

Create beautiful forms, collect contacts, and send instant SMS replies automatically.

Build custom forms for registrations, feedback, surveys, events, orders, and lead capture. Share your form with a short link, QR code, or website embed. Every submission can be saved into a contact group and followed up with instant SMS automation.

[Create Your First Form] [Learn More]
```

## Feature Cards

```txt
Custom Form Builder
Design clean forms with phone numbers, emails, dropdowns, checkboxes, dates, and more.

Short Links & QR Codes
Share forms anywhere with generated links and downloadable QR codes.

Website & WordPress Embed
Embed forms on websites, landing pages, and WordPress using iframe or shortcode.

SMS Automation
Send instant confirmation messages when someone submits a form.

Contact Group Sync
Automatically save respondents into contact groups for future SMS campaigns.

Advanced Analytics
Track views, clicks, opens, shares, QR scans, submissions, and conversions.
```

---

# Changelog Entry

Add this to the app changelog or release notes.

## Title

```txt
New: SplitSMS Smart Forms
```

## Body

```txt
SplitSMS now includes Smart Forms, a powerful way to collect leads, registrations, feedback, and customer details directly inside your SMS platform.

You can create custom forms, publish them with short links, generate QR codes, embed forms on websites and WordPress, collect responses, save contacts into groups, send instant SMS replies, and track performance with analytics.
```

## Bullet Points

```txt
- Added customizable form builder.
- Added public form pages.
- Added generated short links.
- Added QR code generation and download.
- Added iframe embed for websites.
- Added WordPress embed support.
- Added response collection dashboard.
- Added contact group auto-save from form submissions.
- Added instant SMS auto-reply.
- Added admin SMS notification option.
- Added analytics for views, opens, clicks, shares, QR scans, submissions, and conversion rate.
- Added response export to CSV, Excel, and PDF.
```

---

# Database Tables

Use the existing database style in the app. The structure below can be adapted to your current ORM.

## forms

```txt
id
user_id
name
slug
short_code
description
status
logo_url
banner_url
theme_settings
layout_settings
success_settings
contact_group_id
save_to_contacts
prevent_duplicate_phone
prevent_duplicate_email
captcha_enabled
starts_at
ends_at
submission_limit
published_at
closed_at
created_at
updated_at
```

## form_fields

```txt
id
form_id
label
field_key
field_type
placeholder
helper_text
default_value
is_required
options
validation_rules
sort_order
created_at
updated_at
```

## form_responses

```txt
id
form_id
user_id
contact_id
source
device_type
ip_hash
user_agent
referrer
submitted_at
contact_save_status
sms_status
reviewed_at
created_at
updated_at
```

## form_response_answers

```txt
id
response_id
field_id
field_key
field_label
value
created_at
```

## form_analytics_events

```txt
id
form_id
user_id
event_type
source
device_type
referrer
ip_hash
user_agent
metadata
created_at
```

Event types:

```txt
view
unique_view
shortlink_click
open
share
qr_scan
submit
export
embed_load
wordpress_load
sms_sent
sms_failed
contact_saved
```

## form_sms_automations

```txt
id
form_id
send_to_respondent
send_to_admin
admin_phone
sender_id
respondent_message_template
admin_message_template
created_at
updated_at
```

## form_exports

```txt
id
form_id
user_id
export_type
file_url
row_count
created_at
```

---

# API Endpoints

Adapt endpoint names to the existing backend style.

## Forms

```txt
GET /api/forms
POST /api/forms
GET /api/forms/:id
PUT /api/forms/:id
DELETE /api/forms/:id
POST /api/forms/:id/publish
POST /api/forms/:id/close
POST /api/forms/:id/duplicate
```

## Fields

```txt
GET /api/forms/:id/fields
POST /api/forms/:id/fields
PUT /api/forms/:id/fields/:fieldId
DELETE /api/forms/:id/fields/:fieldId
POST /api/forms/:id/fields/reorder
```

## Public Forms

```txt
GET /api/public/forms/:shortCode
POST /api/public/forms/:shortCode/submit
```

## Responses

```txt
GET /api/forms/:id/responses
GET /api/forms/:id/responses/:responseId
DELETE /api/forms/:id/responses/:responseId
POST /api/forms/:id/responses/bulk-delete
POST /api/forms/:id/responses/export
```

## Analytics

```txt
GET /api/forms/:id/analytics
GET /api/forms/:id/analytics/events
GET /api/forms/:id/analytics/sources
GET /api/forms/:id/analytics/devices
GET /api/forms/:id/analytics/timeseries
POST /api/forms/:id/analytics/track
```

## Share And Embed

```txt
GET /api/forms/:id/share
POST /api/forms/:id/shortlink
PUT /api/forms/:id/shortlink
GET /api/forms/:id/qrcode
GET /api/forms/:id/qrcode/download
GET /embed.js
GET /embed/forms/:shortCode
```

## Automation

```txt
GET /api/forms/:id/automation
PUT /api/forms/:id/automation
POST /api/forms/:id/test-sms
```

---

# Submission Handling Logic

When a form is submitted:

```txt
1. Load form by short code.
2. Confirm form exists.
3. Confirm form is published.
4. Check expiry date.
5. Check submission limit.
6. Validate fields.
7. Validate phone number.
8. Check duplicate rules.
9. Save response.
10. Save answers.
11. Save or update contact if enabled.
12. Add contact to selected contact group.
13. Track submit analytics event.
14. Send respondent SMS if enabled.
15. Send admin SMS if enabled.
16. Log SMS result.
17. Return success response.
```

Important: even if SMS fails, the form response should still be saved.

---

# Security Requirements

## Public Forms

- Sanitize all inputs.
- Validate all field types.
- Use CAPTCHA if enabled.
- Add honeypot spam field.
- Rate limit submissions.
- Prevent script injection.
- Do not expose private user data.

## Dashboard

- Only form owner can edit form.
- Only form owner can view responses.
- Only form owner can export data.
- Only form owner can view analytics.
- Team permissions should be respected if the app supports teams.

## Embed Security

- Use proper iframe headers.
- Allow embedding only for public form embed pages.
- Do not allow dashboard pages to be embedded.
- Consider domain allowlist later for premium users.

Recommended headers:

```txt
Content-Security-Policy: frame-ancestors *;
```

For stricter security later, allow user-configured domains instead of `*`.

---

# Plan Limits And Monetization

## Free Plan

- 3 forms
- 100 submissions per month
- Basic analytics
- SplitSMS branding
- Basic export

## Paid Plan

- Unlimited forms or higher limits
- More monthly submissions
- Remove SplitSMS branding
- Auto SMS replies
- Admin SMS notifications
- Advanced analytics
- QR code download
- Website embed
- WordPress embed
- Excel export

## Premium Add-ons

- Custom domain
- White-label forms
- Webhooks
- Google Sheets sync
- File upload fields
- Popup embeds
- Advanced analytics
- Team permissions

---

# Webhooks And Integrations Later

Add webhooks so users can send new submissions to other systems.

Webhook event:

```txt
form.submitted
```

Payload:

```json
{
  "event": "form.submitted",
  "form_id": "form_123",
  "form_name": "Training Registration",
  "response_id": "response_123",
  "submitted_at": "2026-06-15T10:30:00Z",
  "answers": {
    "name": "Ama Mensah",
    "phone": "233244123456",
    "email": "ama@example.com"
  }
}
```

Future integrations:

- Google Sheets
- Zapier
- Make
- Webhooks
- CRM systems
- Email marketing tools

---

# UI Design Notes

The UI should match the existing SplitSMS dashboard.

Design principles:

- Clean
- Modern
- Simple
- Mobile-first
- Fast
- Minimal clutter
- Clear call-to-actions
- Good empty states
- Good loading states

Recommended empty state:

```txt
No forms yet

Create your first Smart Form to collect contacts, registrations, feedback, or leads. Every form comes with a short link, QR code, website embed, response dashboard, and SMS automation.

[Create Form]
```

Recommended success toasts:

```txt
Form created successfully.
Form published successfully.
Short link copied.
QR code downloaded.
Embed code copied.
WordPress code copied.
SMS automation saved.
Responses exported successfully.
```

---

# MVP Scope

## Must Have

- Form CRUD
- Form builder
- Custom fields
- Public form page
- Embed form page
- Short link
- QR code
- Response collection
- Response dashboard
- Export CSV/Excel
- Save respondents to contact group
- Instant SMS auto-reply
- Basic analytics cards
- Charts for views and submissions
- Website iframe embed
- WordPress iframe embed instructions

## Should Have

- QR scan tracking
- Share tracking
- Open tracking
- Click tracking
- Source analytics
- Device analytics
- Duplicate phone prevention
- Admin SMS notification
- Email notification
- Custom success message
- Templates
- JavaScript auto-height embed

## Later

- Conditional logic
- Multi-page forms
- File uploads
- Payment collection
- Google Sheets sync
- Webhooks
- Custom domains
- White-label branding
- WordPress shortcode plugin
- WordPress Gutenberg block
- Popup embeds
- Field drop-off analytics

---

# Implementation Order

## Phase 1: Foundation

- Add database tables.
- Add backend models/controllers/services.
- Add dashboard Forms menu.
- Build Forms Overview page.
- Build Create Form page.

## Phase 2: Builder And Public Forms

- Build form builder UI.
- Build field management.
- Build public form renderer.
- Build form submission endpoint.
- Add validation.

## Phase 3: Sharing

- Add short link generation.
- Add QR code generation.
- Add Share page.
- Add iframe embed.
- Add WordPress embed instructions.

## Phase 4: Responses And Contacts

- Build responses dashboard.
- Add response details view.
- Add export.
- Integrate contact group saving.
- Add duplicate handling.

## Phase 5: SMS Automation

- Add automation settings.
- Add merge tags.
- Trigger SMS on form submission.
- Deduct SMS credits.
- Log SMS status.

## Phase 6: Analytics

- Track analytics events.
- Build analytics cards.
- Build charts and graphs.
- Add source and device breakdown.
- Add filters.

## Phase 7: Polish

- Improve mobile UI.
- Add templates.
- Add loading states.
- Add empty states.
- Add security protections.
- Add plan limits.

---

# Acceptance Criteria

## Forms

- User can create, edit, duplicate, close, and delete forms.
- User can add, edit, reorder, and delete fields.
- User can save draft and publish form.
- Published forms generate short links and QR codes.

## Public Submission

- Public visitors can open forms.
- Public visitors can submit forms.
- Required fields validate correctly.
- Phone numbers validate correctly.
- Responses are saved.
- Success message displays.

## Contact Sync

- Respondents can be saved into selected contact groups.
- Duplicate phone handling works.
- Contact save status is visible.

## SMS Automation

- Auto SMS can be enabled or disabled.
- Merge tags work.
- SMS sends after submission if credits are available.
- SMS failures are logged.

## Analytics

- Views are tracked.
- Opens are tracked.
- Clicks are tracked.
- Shares are tracked.
- QR scans are tracked.
- Submissions are tracked.
- Conversion rate is calculated.
- Charts display correctly.

## Embed

- Iframe embed works on normal websites.
- Iframe embed works in WordPress Custom HTML block.
- Embed loads without dashboard UI.
- Embed submissions work.
- Embed source is tracked.

## Export

- User can export all responses.
- User can export selected responses.
- Export includes field answers and submission metadata.

---

# Final Product Message

SplitSMS Smart Forms should turn SplitSMS into more than a bulk SMS platform.

It should become a tool for:

- Lead capture
- Event registration
- Customer feedback
- Contact list growth
- SMS automation
- Campaign tracking
- Website and WordPress form embedding

Final marketing message:

> Create forms, share them anywhere, embed them on your website, collect contacts automatically, and send instant SMS replies from one SplitSMS dashboard.
