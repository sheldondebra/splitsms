# SplitSMS — Full Functionality Specification

## First Provider Configuration: mNotify / BMS

Version: 1.0  
Platform Type: Global Bulk SMS Platform  
Tech Stack: Next.js Fullstack  
Primary Initial SMS Provider: mNotify BMS

---

# 1. Product Overview

SplitSMS is a modern online bulk SMS platform where members can sign up, verify their phone number, fund their wallet, send SMS campaigns, manage contacts, access APIs, and track delivery reports.

This is not only a SaaS dashboard.

SplitSMS is a full online messaging platform for businesses, developers, resellers, churches, schools, fintechs, shops, agencies, and organizations.

---

# 2. Main Goal

Build SplitSMS to become one of the best online SMS platforms with:

- Clean modern UI
- Fast phone number signup
- Easy SMS sending
- Wallet-based billing
- mNotify provider integration first
- Future multi-provider routing
- Developer API access
- Admin dashboard
- Reseller-ready structure

---

# 3. First Provider: mNotify BMS

## Why Start With mNotify

mNotify is a strong first choice for Ghana and Africa-focused SMS delivery because it already provides:

- Bulk SMS API
- REST API access
- API key authentication
- JSON API responses
- SMS campaigns
- OTP/token API
- Delivery status / insight API
- Inbox/webhook support
- WhatsApp and SMS messaging options

## mNotify API Base URL

```txt
https://api.mnotify.com
```

## Example API Key Usage

mNotify expects the API key in API requests as a query parameter.

```txt
?key=YOUR_API_KEY
```

Example:

```txt
https://api.mnotify.com/api/template?key=YOUR_API_KEY
```

---

# 4. Environment Variables

Create a `.env` file:

```env
# App
NEXT_PUBLIC_APP_NAME=SplitSMS
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# Auth
AUTH_SECRET=your_auth_secret
JWT_SECRET=your_jwt_secret

# mNotify
MNOTIFY_API_KEY=your_mnotify_api_key
MNOTIFY_BASE_URL=https://api.mnotify.com
MNOTIFY_DEFAULT_SENDER_ID=SplitSMS

# Payments
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key

FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key
FLUTTERWAVE_PUBLIC_KEY=your_flutterwave_public_key

# Redis Queue
REDIS_URL=redis://localhost:6379
```

---

# 5. Recommended Project Structure

```bash
splitsms/
├── app/
│   ├── page.tsx
│   ├── auth/
│   ├── dashboard/
│   ├── admin/
│   ├── api/
│   │   ├── sms/
│   │   ├── auth/
│   │   ├── wallet/
│   │   ├── contacts/
│   │   ├── campaigns/
│   │   ├── webhooks/
│   │   └── mnotify/
│
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── forms/
│   └── layout/
│
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── mnotify.ts
│   ├── wallet.ts
│   ├── sms.ts
│   └── validators.ts
│
├── prisma/
│   └── schema.prisma
│
├── workers/
│   └── sms-worker.ts
│
├── types/
│   └── index.ts
│
└── .env
```

---

# 6. User Roles

## Member

A member can:

- Sign up with phone number
- Verify OTP
- Add wallet funds
- Send bulk SMS
- Manage contacts
- View campaigns
- View delivery reports
- Generate API keys
- Use SplitSMS API

## Admin

An admin can:

- Manage users
- Manage SMS pricing
- Manage wallet transactions
- Configure mNotify
- View provider balance
- Monitor campaigns
- Approve sender IDs
- Suspend abusive accounts
- View platform profit

## Reseller

A reseller can:

- Create sub-users
- Set custom pricing
- Fund sub-accounts
- Track usage
- View commissions
- Manage branded users in the future

---

# 7. Authentication Functionality

## Signup

Required fields:

- Phone number
- Country
- Full name
- Optional email
- Password or OTP-only access

## Signup Flow

1. User enters phone number.
2. SplitSMS sends OTP using mNotify.
3. User enters OTP.
4. Account is created.
5. User is redirected to dashboard.

## Login Options

- Phone number + OTP
- Phone number + password
- Email + password
- Google login later

---

# 8. OTP Verification With mNotify

## OTP Use Cases

- Signup verification
- Login verification
- Password reset
- Payment confirmation
- API key security
- High-risk action approval

## OTP Table

```txt
otp_codes
- id
- user_id
- phone
- code
- purpose
- expires_at
- verified_at
- created_at
```

---

# 9. Wallet System

## Wallet Features

- User balance
- Add funds
- Deduct SMS cost
- Refund failed SMS
- Transaction history
- Admin manual adjustment
- Auto low-balance warning

## Wallet Rules

- User cannot send SMS without enough balance.
- Wallet deduction happens before sending.
- Failed messages can be refunded automatically or manually.
- Every wallet action must create a transaction record.

## Transaction Types

- deposit
- sms_debit
- refund
- bonus
- admin_adjustment
- reseller_commission

---

# 10. SMS Sending Functionality

## SMS Sending Options

Users can send SMS by:

- Typing phone numbers manually
- Uploading CSV
- Selecting contact group
- Using API
- Scheduling campaign

## SMS Fields

- Sender ID
- Message body
- Recipients
- Country
- Campaign name
- Schedule date
- Unicode option
- Route/provider

## Sending Flow

1. User creates campaign.
2. System validates numbers.
3. System calculates cost.
4. Wallet is checked.
5. Wallet is deducted.
6. Campaign enters queue.
7. Worker sends SMS through mNotify.
8. mNotify returns campaign/message ID.
9. SplitSMS stores response.
10. Delivery status is updated.

---

# 11. mNotify Quick SMS Integration

## Endpoint Concept

mNotify Quick SMS endpoint:

```txt
POST https://api.mnotify.com/api/sms/quick?key=YOUR_API_KEY
```

## Suggested Payload Structure

```json
{
  "recipient": ["233XXXXXXXXX"],
  "sender": "SplitSMS",
  "message": "Hello from SplitSMS",
  "is_schedule": false,
  "schedule_date": ""
}
```

## Scheduled SMS Payload

```json
{
  "recipient": ["233XXXXXXXXX"],
  "sender": "SplitSMS",
  "message": "Scheduled message from SplitSMS",
  "is_schedule": true,
  "schedule_date": "2026-06-01 10:30"
}
```

## Important Note

Only include OTP-specific fields when the message is truly an OTP message.

---

# 12. mNotify Service File

Create:

```txt
lib/mnotify.ts
```

Example structure:

```ts
const MNOTIFY_BASE_URL = process.env.MNOTIFY_BASE_URL;
const MNOTIFY_API_KEY = process.env.MNOTIFY_API_KEY;

export async function sendMnotifySms({
  recipients,
  sender,
  message,
  isSchedule = false,
  scheduleDate,
}: {
  recipients: string[];
  sender: string;
  message: string;
  isSchedule?: boolean;
  scheduleDate?: string;
}) {
  const url = `${MNOTIFY_BASE_URL}/api/sms/quick?key=${MNOTIFY_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: recipients,
      sender,
      message,
      is_schedule: isSchedule,
      schedule_date: scheduleDate || "",
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "mNotify SMS sending failed");
  }

  return data;
}
```

---

# 13. SMS Campaign Database Model

```prisma
model SmsCampaign {
  id              String   @id @default(cuid())
  userId          String
  name            String
  senderId        String
  message         String
  recipientCount  Int
  status          String   @default("pending")
  provider        String   @default("mnotify")
  providerRef     String?
  totalCost        Decimal
  sentAt          DateTime?
  scheduledAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id])
  messages        SmsMessage[]
}
```

---

# 14. SMS Message Database Model

```prisma
model SmsMessage {
  id              String   @id @default(cuid())
  campaignId      String
  userId          String
  phone           String
  country         String?
  message         String
  status          String   @default("pending")
  provider        String   @default("mnotify")
  providerMessageId String?
  cost            Decimal
  errorMessage    String?
  deliveredAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  campaign        SmsCampaign @relation(fields: [campaignId], references: [id])
  user            User        @relation(fields: [userId], references: [id])
}
```

---

# 15. Contact Management

## Features

- Add single contact
- Import CSV
- Create groups
- Remove duplicates
- Detect country code
- Search contacts
- Export contacts

## Contact Model

```prisma
model Contact {
  id          String   @id @default(cuid())
  userId      String
  name        String?
  phone       String
  email       String?
  country     String?
  groupId     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

# 16. Sender ID Management

## Features

- User requests sender ID
- Admin approves or rejects
- Sender ID can be country-specific
- Default sender ID can be set
- Approved sender IDs are selectable when sending SMS

## Sender ID Status

- pending
- approved
- rejected
- suspended

---

# 17. API Key System

## Features

- Users can generate API keys
- API keys can be revoked
- API usage is logged
- Rate limits are applied
- Wallet balance is checked before sending

## API Key Model

```prisma
model ApiKey {
  id          String   @id @default(cuid())
  userId      String
  name        String
  keyHash     String
  status      String   @default("active")
  lastUsedAt  DateTime?
  createdAt   DateTime @default(now())
}
```

---

# 18. SplitSMS Public API

## Send SMS

```txt
POST /api/v1/messages/send
```

Headers:

```txt
Authorization: Bearer SPLITSMS_API_KEY
Content-Type: application/json
```

Body:

```json
{
  "sender": "SplitSMS",
  "recipients": ["233XXXXXXXXX"],
  "message": "Hello from SplitSMS"
}
```

## Check Balance

```txt
GET /api/v1/wallet/balance
```

## Campaign Status

```txt
GET /api/v1/campaigns/:id
```

## Delivery Reports

```txt
GET /api/v1/reports/delivery
```

---

# 19. Delivery Reports

## Features

- Delivered
- Failed
- Pending
- Rejected
- Unknown
- Provider response
- Timestamp

## Delivery Status Flow

1. Message submitted
2. Provider accepts
3. Delivery report received
4. Status updated
5. Analytics updated

---

# 20. mNotify Reports / Insight

SplitSMS should later connect mNotify insight/report features to:

- Fetch message status
- Update campaign report
- Display delivery rate
- Track failed contacts
- Improve routing decisions

---

# 21. Webhooks

## Internal Webhooks

SplitSMS should support webhook events for developers:

- message.sent
- message.delivered
- message.failed
- wallet.low_balance
- campaign.completed

## User Webhook Model

```prisma
model WebhookEndpoint {
  id          String   @id @default(cuid())
  userId      String
  url         String
  secret      String
  status      String   @default("active")
  createdAt   DateTime @default(now())
}
```

---

# 22. Admin Dashboard

## Admin Pages

- Overview
- Users
- Campaigns
- Messages
- Wallets
- Transactions
- Sender IDs
- Pricing
- Providers
- mNotify Settings
- Reports
- Fraud Monitoring

## mNotify Admin Settings

Admin should be able to view/configure:

- API key status
- Default sender ID
- Provider enabled/disabled
- Provider priority
- Provider balance if supported
- SMS route status
- Last API error

---

# 23. Pricing System

## Pricing Rules

SplitSMS should support:

- Country-based pricing
- User-based pricing
- Reseller-based pricing
- Provider cost
- Profit margin
- Promotional pricing

## Pricing Model

```prisma
model SmsPricing {
  id          String   @id @default(cuid())
  country     String
  countryCode String
  costPrice   Decimal
  sellPrice   Decimal
  provider    String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

---

# 24. Reseller Functionality

## Reseller Features

- Reseller dashboard
- Sub-user accounts
- Custom pricing
- Wallet funding
- Usage reports
- Commission tracking
- White-label branding later

## Reseller Roadmap

Phase 1:
- Manual reseller accounts

Phase 2:
- Automated reseller pricing

Phase 3:
- White-label reseller portal

---

# 25. Queue System

## Why Queue Is Needed

Bulk SMS must not be sent directly from the frontend request.

Use queue for:

- Better performance
- Retry failed jobs
- Avoid timeout
- Process large campaigns
- Control provider rate limits

## Recommended Queue

- BullMQ
- Redis
- Worker process

---

# 26. SMS Worker Flow

1. Pick pending SMS job.
2. Validate wallet/campaign.
3. Send through mNotify.
4. Save provider response.
5. Update message status.
6. Retry if temporary failure.
7. Mark permanently failed if retry limit is reached.
8. Refund if needed.

---

# 27. Security Requirements

## Must Have

- API key hashing
- Rate limiting
- IP monitoring
- Fraud checks
- Phone verification
- Admin audit logs
- Transaction locking
- Wallet double-spend prevention
- Input validation
- Sender ID moderation

---

# 28. Fraud Prevention

## Block or Flag

- Spam keywords
- Too many failed attempts
- Suspicious countries
- Fake numbers
- Rapid API abuse
- Repeated OTP requests
- Low-quality campaigns

---

# 29. Dashboard UI Pages

## Member Dashboard Pages

- Overview
- Send SMS
- Campaigns
- Contacts
- Groups
- Wallet
- Transactions
- Sender IDs
- API Keys
- Developer Docs
- Settings
- Support

## Admin Dashboard Pages

- Overview
- Users
- Campaigns
- SMS Logs
- Provider Settings
- Pricing
- Payments
- Sender ID Approval
- Resellers
- Reports

---

# 30. MVP Build Order

## Step 1

Setup project:

- Next.js
- Tailwind
- shadcn/ui
- Prisma
- PostgreSQL
- Auth

## Step 2

Build authentication:

- Phone signup
- OTP verification
- Login
- Sessions

## Step 3

Configure mNotify:

- Add env variables
- Create mNotify service
- Test send SMS
- Store provider response

## Step 4

Build wallet:

- Balance
- Transactions
- SMS deductions

## Step 5

Build send SMS page:

- Manual recipients
- Message box
- Sender ID
- Cost preview
- Send button

## Step 6

Build campaign system:

- Campaign records
- Message records
- Status tracking

## Step 7

Build admin dashboard:

- Users
- Campaigns
- Transactions
- Provider settings

## Step 8

Launch private beta.

---

# 31. First MVP Features Only

Do not start with everything.

Build these first:

- Phone signup
- OTP verification
- User dashboard
- Wallet
- Send SMS
- Campaign history
- mNotify integration
- Admin user list
- Admin transaction list
- Basic pricing

---

# 32. Future Providers

After mNotify works, add:

- Telnyx
- Termii
- Vonage
- Africa's Talking
- Infobip

---

# 33. Future Advanced Features

- Multi-provider routing
- Route failover
- AI campaign writer
- WhatsApp messaging
- Email messaging
- Voice messaging
- SMPP gateway
- White-label reseller system
- Mobile app

---

# 34. Launch Checklist

## Technical

- Auth working
- mNotify SMS sending working
- Wallet deduction working
- Campaign status working
- Admin dashboard working
- Payment funding working
- Error logs working

## Business

- Pricing set
- Terms of service
- Privacy policy
- Refund policy
- Support email
- Sender ID rules
- Abuse policy

## Marketing

- Landing page
- Pricing page
- API docs page
- Demo video
- WhatsApp support button

---

# 35. References

- mNotify API Reference: https://readthedocs.mnotify.com/
- mNotify Developer Page: https://bms.africa/developer/
- mNotify BMS App: https://apps.mnotify.net/

---

# 36. Final Direction

SplitSMS should start simple but powerful.

First focus:

1. Phone signup
2. Wallet
3. mNotify SMS sending
4. Delivery reports
5. Clean dashboard
6. Admin controls

Once this foundation is stable, SplitSMS can become a full global SMS platform.
