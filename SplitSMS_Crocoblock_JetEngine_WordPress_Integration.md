# SplitSMS — Crocoblock & JetEngine WordPress Integration Add-On
## Booking, Dynamic Forms, Custom Post Types, Listings & Automation Support

Version: 1.0  
Main Plugin: SplitSMS for WordPress  
Website: https://www.splitsms.com  
Integration Target: Crocoblock, JetEngine, JetFormBuilder, JetBooking, JetAppointment

---

# 1. Goal

Add deep Crocoblock and JetEngine support to the SplitSMS WordPress plugin.

This allows WordPress users to build powerful no-code SMS workflows using Crocoblock tools.

The plugin should work with:

- JetEngine
- JetFormBuilder
- JetBooking
- JetAppointment
- JetWooBuilder
- JetSmartFilters
- JetEngine Custom Post Types
- JetEngine Custom Content Types
- JetEngine Dynamic Fields

---

# 2. Why This Integration Matters

Many WordPress users build advanced websites with Crocoblock.

They create:

- booking systems
- appointment systems
- directories
- real estate listings
- school portals
- hospital systems
- church systems
- donation systems
- event systems
- marketplace systems
- custom dashboards

SplitSMS should allow them to send SMS automatically when important actions happen.

---

# 3. Main Use Cases

## Booking System

Send SMS when:

- booking is created
- booking is approved
- booking is cancelled
- booking is rescheduled
- booking reminder is due
- booking payment is received

Example:

```txt
Hi {name}, your booking for {service_name} is confirmed for {booking_date} at {booking_time}.
```

---

# 4. Appointment System

Send SMS when:

- appointment is booked
- appointment is approved
- appointment is rejected
- appointment reminder is due
- appointment is completed

Example:

```txt
Reminder: Your appointment with {provider_name} is tomorrow at {appointment_time}.
```

---

# 5. JetFormBuilder Integration

Send SMS when:

- form is submitted
- quote request is received
- registration form is completed
- support form is submitted
- application form is approved
- custom form condition is met

Example:

```txt
Hi {first_name}, we received your request and will contact you soon.
```

---

# 6. JetEngine Custom Post Types

Allow users to trigger SMS from custom post type actions.

## Example Custom Post Types

- bookings
- appointments
- properties
- vehicles
- applications
- students
- patients
- events
- orders
- donations

## SMS Triggers

- new post created
- post updated
- post status changed
- meta field updated
- post approved
- post rejected

---

# 7. JetEngine Dynamic Fields

Allow template variables from JetEngine meta fields.

## Example Variables

```txt
{name}
{phone}
{booking_date}
{booking_time}
{service_name}
{property_title}
{appointment_status}
{custom_field_name}
```

---

# 8. JetBooking Integration

## SMS Events

- booking created
- booking confirmed
- booking cancelled
- booking payment completed
- booking reminder
- booking status changed

## Admin SMS

```txt
New booking received from {name}. Date: {booking_date}. Phone: {phone}.
```

## Customer SMS

```txt
Hi {name}, your booking for {booking_date} has been confirmed.
```

---

# 9. JetAppointment Integration

## SMS Events

- appointment created
- appointment confirmed
- appointment cancelled
- appointment reminder
- appointment completed
- provider notification

## Provider SMS

```txt
New appointment booked by {client_name} for {appointment_date} at {appointment_time}.
```

---

# 10. Crocoblock Automation Builder

Add Crocoblock actions inside SplitSMS Automations.

## Simple Rule Builder

```txt
When [JetEngine Event]
Send [SMS Template]
To [User/Admin/Custom Phone Field]
```

---

# 11. Supported Trigger Types

## JetEngine

- custom post created
- custom post updated
- post status changed
- meta field changed

## JetFormBuilder

- form submitted
- form action completed
- payment completed
- user registered

## JetBooking

- booking created
- booking confirmed
- booking cancelled
- booking reminder

## JetAppointment

- appointment booked
- appointment approved
- appointment cancelled
- appointment reminder

---

# 12. Phone Field Mapping

Users should select which field contains the phone number.

## Example

```txt
Phone Field: customer_phone
Name Field: customer_name
Date Field: booking_date
```

This is important because every JetEngine website can have different field names.

---

# 13. Field Mapping UI

Create a clean field mapping screen.

## Fields

```txt
Recipient Phone Field
Recipient Name Field
Message Variables
Admin Phone Number
Fallback Phone Number
```

---

# 14. Template Variables UI

Show available variables automatically.

Example:

```txt
Available fields:
{name}
{phone}
{booking_date}
{service}
{status}
{email}
```

Users can click a variable to insert it into the SMS template.

---

# 15. Crocoblock Integration Page

Add a dedicated integration card:

```txt
Crocoblock / JetEngine
```

Status:

```txt
Connected
JetEngine detected
JetFormBuilder detected
JetBooking detected
JetAppointment detected
```

---

# 16. Plugin Detection

The SplitSMS plugin should detect installed Crocoblock plugins.

## Detect

- JetEngine
- JetFormBuilder
- JetBooking
- JetAppointment
- JetWooBuilder

If not installed, show:

```txt
Crocoblock tools not detected.
Install JetEngine or JetFormBuilder to enable this integration.
```

---

# 17. SMS Logs for Crocoblock

Logs should show the source.

## Example Log

```txt
Source: JetBooking
Event: Booking Confirmed
Recipient: 233XXXXXXXXX
Status: Delivered
```

---

# 18. SplitSMS Cloud Dashboard Sync

On the SplitSMS dashboard, WordPress logs should show Crocoblock events.

## Add Filters

- JetEngine
- JetFormBuilder
- JetBooking
- JetAppointment

---

# 19. Booking Reminder System

Add reminders before appointment or booking time.

## Options

```txt
Send reminder:
1 hour before
3 hours before
1 day before
2 days before
Custom time
```

---

# 20. Reminder Worker

Use WordPress cron for reminders.

## Flow

```txt
Booking Created
↓
Reminder Scheduled
↓
WP Cron Runs
↓
SplitSMS Sends Reminder
↓
Log Saved
```

---

# 21. Admin Alerts

Allow admins to receive alerts.

## Examples

```txt
New booking received.
Appointment cancelled.
New application submitted.
Payment completed.
```

---

# 22. Customer Alerts

Allow customers/users to receive alerts.

## Examples

```txt
Your appointment is confirmed.
Your booking has been cancelled.
Your request has been received.
Your application was approved.
```

---

# 23. Conditional SMS Rules

Users should create rules.

## Examples

```txt
Send SMS only if booking status = confirmed.
Send SMS only if payment status = paid.
Send SMS only if service = consultation.
Send SMS only if form field country = Ghana.
```

---

# 24. Conditional Builder

Use simple UI:

```txt
If [Field] [Condition] [Value]
Then send SMS
```

---

# 25. Supported Conditions

```txt
equals
does not equal
contains
is empty
is not empty
greater than
less than
```

---

# 26. JetEngine Listing Actions

Future feature: allow SMS actions from JetEngine listing items.

Example:

```txt
Send SMS to property owner
Send SMS to booking customer
Send SMS to applicant
```

---

# 27. Real Estate Use Case

For property websites built with JetEngine.

## SMS Events

- new inquiry
- viewing booked
- agent assigned
- property approved

Example:

```txt
New property inquiry for {property_title}. Contact: {client_phone}.
```

---

# 28. School Use Case

For school portals.

## SMS Events

- student registration
- fee reminder
- class update
- exam announcement
- parent notification

---

# 29. Hospital / Clinic Use Case

For appointment systems.

## SMS Events

- appointment booked
- appointment reminder
- lab result notification
- doctor reschedule alert

---

# 30. Event Booking Use Case

For churches, conferences, and events.

## SMS Events

- event registration
- ticket confirmation
- event reminder
- venue update

---

# 31. Marketplace Use Case

For custom marketplace websites.

## SMS Events

- vendor approved
- order inquiry
- buyer message
- listing approved

---

# 32. UI Requirements

The Crocoblock integration UI must be:

- simple
- card-based
- beginner-friendly
- no-code
- visual
- clean

---

# 33. Crocoblock Automation Card

Example card:

```txt
JetBooking Reminder

When booking is confirmed
Send SMS to customer
Reminder: 1 day before booking

Status: Active
```

---

# 34. Setup Wizard

Add a setup wizard.

```txt
Step 1: Select Crocoblock Plugin
Step 2: Choose Event
Step 3: Choose Phone Field
Step 4: Write SMS Template
Step 5: Send Test
Step 6: Activate Automation
```

---

# 35. Test SMS Button

Before activating, allow user to send test SMS.

```txt
[ Send Test SMS ]
```

---

# 36. Error Handling

Friendly errors:

```txt
We could not find a phone number field. Please select the correct field.
```

```txt
Your SplitSMS balance is low. Please add funds.
```

---

# 37. WordPress.org Compliance

The Crocoblock integration must follow WordPress.org standards.

## Requirements

- sanitize all settings
- escape all output
- use nonces
- check capabilities
- use WordPress hooks properly
- avoid breaking sites if Crocoblock is missing

---

# 38. Safe Integration Rule

If JetEngine or Crocoblock is not installed, the plugin must not crash.

Show a friendly message instead.

---

# 39. File Structure Addition

Add:

```txt
integrations/
├── class-splitsms-crocoblock.php
├── class-splitsms-jetengine.php
├── class-splitsms-jetformbuilder.php
├── class-splitsms-jetbooking.php
└── class-splitsms-jetappointment.php
```

---

# 40. SplitSMS Website Feature Update

Add Crocoblock to website features.

## Feature Title

```txt
Crocoblock & JetEngine SMS Automation
```

## Description

```txt
Send SMS from JetEngine custom post types, JetFormBuilder forms, JetBooking reservations, and JetAppointment appointments using SplitSMS.
```

---

# 41. Website Integration Card

Add to:

```txt
/integrations/wordpress
```

Card:

```txt
Crocoblock / JetEngine
Build no-code SMS automations for bookings, forms, directories, appointments, and custom websites.
```

---

# 42. Website Use Case Section

Add these use cases:

- booking reminders
- appointment confirmations
- form alerts
- real estate inquiry alerts
- school portal notifications
- event registration SMS
- custom post type SMS automations

---

# 43. SplitSMS Dashboard Updates

When WordPress site is connected, SplitSMS dashboard should show Crocoblock activity.

## Dashboard Cards

```txt
JetEngine SMS Sent
JetBooking Reminders
JetAppointment Alerts
JetFormBuilder Alerts
Failed Crocoblock SMS
```

---

# 44. SplitSMS Logs

Add log source:

```txt
source = wordpress_crocoblock
integration = jetengine | jetbooking | jetappointment | jetformbuilder
```

---

# 45. MVP Deliverables

By end of this feature:

✅ JetEngine support  
✅ JetFormBuilder support  
✅ JetBooking support  
✅ JetAppointment support  
✅ Field mapping UI  
✅ SMS templates  
✅ Booking reminders  
✅ Conditional rules  
✅ Logs  
✅ SplitSMS dashboard sync  
✅ Website feature section  

---

# 46. Final Vision

With Crocoblock support, SplitSMS becomes more than an SMS plugin.

It becomes a no-code SMS automation layer for advanced WordPress websites.

Users can build:

- booking systems
- appointment systems
- school systems
- real estate platforms
- directories
- fundraising systems
- event platforms
- membership portals

and connect all of them to SplitSMS without writing code.
