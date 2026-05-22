# SplitSMS — NEXT BATCH
# Batch 4: Contact Management + Campaign Automation

Version: 1.1 · **Status snapshot: May 2026**

---

# ✅ Batch completion (current codebase)

| Deliverable (§39) | Status | Notes |
|-------------------|--------|-------|
| Contact manager | ✅ | `/dashboard/contacts` — table, search, edit, delete, pagination |
| CSV imports | ✅ | Papa Parse + libphonenumber-js, preview API, duplicate/invalid stats |
| Contact groups | ✅ | Create, rename, delete, add/remove members |
| Campaign scheduling | ✅ | `scheduledAt`, timezone; pause/resume/cancel |
| Personalized SMS | ✅ | `{name}`, `{phone}`, `{country}`, `{email}` in `lib/sms/personalize.ts` |
| Templates system | ✅ | `/dashboard/templates` — favorite, CRUD |
| Recurring campaigns | ✅ | DAILY/WEEKLY/MONTHLY/CUSTOM_DAYS + scheduler clones next run |
| Automation engine starter | ✅ | `/dashboard/automation` — `AutomationWorkflow` model + triggers UI |

### Key files

- `lib/contacts/csv-import.ts`, `segment.ts`, `queries.ts`, `country-from-phone.ts`
- `lib/sms/personalize.ts`, `message-preview.ts`
- `lib/campaigns/dispatch.ts`, `recurrence.ts`
- `lib/actions/contacts.ts`, `templates.ts`, `automation.ts`, `campaigns.ts`
- `app/api/dashboard/contacts/export`, `contacts/preview`
- `workers/campaign-scheduler.ts` — uses shared dispatch + credits + notifications

### Deferred

- Full multi-step workflows (wait 1 day, branches)
- Auto-trigger execution on SIGNUP/BIRTHDAY (models + UI only)
- Bulk resend SMS
- Campaign activity / delivery-status segmentation
- Separate `ScheduledCampaign` table (uses `Campaign.scheduledAt`)

### Run

```bash
npm run build
npm run worker:campaigns   # scheduled + recurring dispatch
```

---

# 1. Batch Goal

This batch focuses on building the contact management infrastructure and campaign automation engine for SplitSMS.

This transforms SplitSMS from a simple SMS sender into a complete messaging platform capable of handling:

- Large contact lists
- Group messaging
- Smart segmentation
- Campaign automation
- Scheduling
- Bulk operations

---

# 2. Main Objectives

Build:

- Contact management system
- CSV import/export
- Contact groups
- Smart segmentation
- Campaign scheduling
- Recurring campaigns
- Message personalization
- Automation workflows

---

# 3. Contact Management System

## Core Features

- Add contacts manually
- Import CSV
- Export contacts
- Edit contacts
- Delete contacts
- Search contacts
- Contact tags
- Country detection

---

# 4. Contact Database Model

```prisma
model Contact {
  id          String   @id @default(cuid())
  userId      String
  name        String?
  phone       String
  email       String?
  country     String?
  tags        String[]
  groupId     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

# 5. Contact Groups

## Features

- Create groups
- Rename groups
- Delete groups
- Add/remove contacts
- View group analytics

---

# 6. Group Model

```prisma
model ContactGroup {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  createdAt   DateTime @default(now())
}
```

---

# 7. CSV Import System

## Features

- Drag and drop upload
- CSV parsing
- Duplicate filtering
- Invalid number filtering
- Import preview
- Country auto-detection

---

# 8. CSV Import Flow

```txt
Upload CSV
↓
Parse CSV
↓
Validate Numbers
↓
Remove Duplicates
↓
Preview Contacts
↓
Save Contacts
```

---

# 9. CSV Supported Fields

## Recommended Columns

- name
- phone
- email
- country
- tags

---

# 10. CSV Validation

## Validate

- Empty rows
- Invalid numbers
- Duplicate numbers
- Invalid formatting
- Unsupported country codes

---

# 11. Recommended Libraries

Use:

- papaparse
- csv-parser
- libphonenumber-js

---

# 12. Contact Search

## Search Features

- Search by name
- Search by phone
- Search by country
- Search by tag
- Search by group

---

# 13. Smart Segmentation

## Segmentation Rules

Users can filter contacts by:

- Country
- Tags
- Groups
- Campaign activity
- Delivery status
- Signup date

---

# 14. Tags System

## Features

- Add tags
- Remove tags
- Search by tags
- Campaign targeting

---

# 15. Campaign Scheduling

## Features

- Schedule SMS
- Timezone support
- Future campaigns
- Delayed sending
- Pause scheduled campaigns
- Resume campaigns

---

# 16. Scheduling Model

```prisma
model ScheduledCampaign {
  id            String   @id @default(cuid())
  campaignId    String
  scheduledAt   DateTime
  status        String
  createdAt     DateTime @default(now())
}
```

---

# 17. Recurring Campaigns

## Features

- Daily campaigns
- Weekly campaigns
- Monthly campaigns
- Custom intervals

---

# 18. Recurring Rules

## Examples

- Every Monday
- Every first day of month
- Every 24 hours
- Every 7 days

---

# 19. Personalization System

## Variables

Users should personalize messages using:

```txt
{name}
{phone}
{country}
```

---

# 20. Example Personalized SMS

```txt
Hello {name}, your order has been confirmed.
```

---

# 21. Message Preview System

## Features

- Live preview
- Character count
- SMS segment count
- Estimated cost
- Unicode detection

---

# 22. SMS Segment Calculator

## Calculate

- GSM characters
- Unicode characters
- Segment count
- Cost estimation

---

# 23. Campaign Templates

## Features

- Save templates
- Reuse templates
- Edit templates
- Favorite templates

---

# 24. Template Model

```prisma
model SmsTemplate {
  id          String   @id @default(cuid())
  userId      String
  name        String
  content     String
  createdAt   DateTime @default(now())
}
```

---

# 25. Automation Engine

## Features

- Auto birthday SMS
- Reminder campaigns
- Scheduled OTP
- Event notifications
- Auto follow-ups

---

# 26. Workflow System

## Workflow Examples

### Welcome Workflow

```txt
User Signup
↓
Send Welcome SMS
↓
Wait 1 Day
↓
Send Follow-up SMS
```

---

# 27. Campaign Status Tracking

## Statuses

- draft
- scheduled
- processing
- sent
- delivered
- failed
- paused
- cancelled

---

# 28. Campaign Filtering

## Filter By

- Status
- Date
- Country
- Group
- Provider

---

# 29. Bulk Operations

## Features

- Bulk delete contacts
- Bulk add tags
- Bulk move groups
- Bulk resend SMS

---

# 30. Import Analytics

## Show

- Imported contacts
- Failed imports
- Duplicate contacts
- Country breakdown

---

# 31. Campaign Analytics

## Metrics

- Open rate later
- Delivery rate
- Failed count
- Cost spent
- Country performance

---

# 32. Notification System

## Notify Users About

- Campaign completed
- Scheduled campaign started
- Failed campaigns
- Low balance

---

# 33. Queue Integration

## Queue Scheduled Jobs

Use:

- BullMQ
- Redis

---

# 34. Automation Workers

## Workers

- scheduler-worker
- recurring-worker
- template-worker

---

# 35. Campaign Performance Dashboard

## Show

- Top campaigns
- Delivery success
- Most active countries
- Top contact groups

---

# 36. UI Requirements

## Contact UI Must Be

- Fast
- Searchable
- Mobile-friendly
- Clean
- Spreadsheet-like

---

# 37. UI Inspirations

Use inspiration from:

- Airtable
- Notion
- HubSpot
- Mailchimp

---

# 38. Security Rules

## Protect Against

- Spam lists
- Invalid uploads
- Duplicate abuse
- CSV injection attacks

---

# 39. MVP Deliverables

By end of this batch:

✅ Contact manager  
✅ CSV imports  
✅ Contact groups  
✅ Campaign scheduling  
✅ Personalized SMS  
✅ Templates system  
✅ Recurring campaigns  
✅ Automation engine starter  

---

# 40. Final Goal

After this batch, SplitSMS becomes a true communication platform.

Users should be able to:

- Organize contacts
- Segment audiences
- Automate campaigns
- Schedule messaging
- Personalize SMS
- Manage large-scale campaigns efficiently
