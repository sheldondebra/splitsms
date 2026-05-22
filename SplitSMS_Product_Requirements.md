# SplitSMS — Product Requirements Document

## 1. Product Overview

**SplitSMS** is a modern full-stack Bulk SMS platform built with **Next.js**. It allows individuals, businesses, organizations, and resellers to sign up using their phone number, buy SMS credits, manage contacts, create campaigns, send bulk SMS globally, and track delivery reports from a clean and easy-to-use dashboard.

SplitSMS is **not positioned as a SaaS tool**. It is a public SMS platform where members can create accounts and use SMS services directly.

## 2. Product Goal

The goal of SplitSMS is to make global bulk SMS sending simple, fast, and affordable for users who need reliable communication with customers, members, students, employees, or communities.

## 3. Target Users

- Small businesses
- Churches and religious groups
- Schools and institutions
- NGOs and associations
- Event organizers
- Marketing teams
- Developers
- Resellers
- Enterprises
- Government and public service organizations

## 4. Core Positioning

SplitSMS should feel:

- Simple to use
- Fast and reliable
- Clean and modern
- Professional
- Mobile-friendly
- Trustworthy
- Affordable
- Global-ready

## 5. Platform Type

SplitSMS is a **member-based bulk SMS platform**.

Members can:

- Sign up
- Verify their phone number
- Add funds or buy SMS credits
- Upload contacts
- Send bulk SMS
- Track message delivery
- Manage sender IDs
- Access API keys
- View transaction history

## 6. Technology Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Shadcn UI
- Framer Motion
- Lucide Icons

### Backend

- Next.js API Routes or Server Actions
- Node.js
- Prisma ORM

### Database

- PostgreSQL

### Authentication

- Phone number signup
- OTP verification
- Optional email login
- Optional password login
- Optional Google login later

### Payments

- Paystack
- Flutterwave
- Stripe for global payments
- Manual bank transfer option

### SMS Gateway Integration

Possible providers:

- Telnyx
- Vonage
- Infobip
- Afilnet
- Africa’s Talking
- Termii

The platform should support multiple SMS gateway providers for route failover and better delivery.

## 7. Main Features

## 7.1 Member Signup

Members should be able to create an account using a phone number.

### Signup Fields

- Full name
- Phone number
- Country
- Password
- Confirm password
- Referral code, optional

### Verification

- OTP sent to phone number
- OTP expiry time
- Resend OTP option
- Phone number must be unique

## 7.2 Login

Members can log in using:

- Phone number and password
- Phone number and OTP

## 7.3 Member Dashboard

The dashboard should show:

- SMS balance
- Wallet balance
- Total SMS sent
- Successful messages
- Failed messages
- Pending messages
- Recent campaigns
- Recent transactions
- Quick send button
- Buy SMS credits button

## 7.4 Wallet and SMS Credit System

Members should be able to fund their account and purchase SMS credits.

### Wallet Features

- Add funds
- View balance
- View payment history
- View credit purchases
- Admin approval for manual payments

### SMS Credit Features

- Credit balance
- Country-based SMS pricing
- Automatic deduction after sending
- Failed SMS refund option, if supported

## 7.5 Bulk SMS Sending

Members should be able to send SMS to many recipients at once.

### SMS Form

- Sender ID
- Message body
- Recipient numbers
- Contact group selection
- Country selection
- Schedule option
- Character counter
- SMS unit counter
- Estimated cost
- Send now button

### SMS Rules

- Show SMS length
- Show number of SMS pages
- Warn users about special characters
- Validate phone numbers
- Remove duplicate numbers
- Detect invalid numbers

## 7.6 Contact Management

Members should be able to manage their contacts.

### Features

- Add single contact
- Upload contacts by CSV or Excel
- Create contact groups
- Edit contacts
- Delete contacts
- Search contacts
- Export contacts

## 7.7 Campaign Management

Members should be able to manage campaigns.

### Features

- Create campaign
- Save draft
- Send campaign
- Schedule campaign
- Duplicate campaign
- View campaign report
- Delete campaign

## 7.8 Delivery Reports

Members should be able to track message delivery.

### Report Statuses

- Sent
- Delivered
- Failed
- Pending
- Rejected
- Expired

### Report Details

- Recipient number
- Message
- Country
- Cost
- Gateway used
- Delivery status
- Sent date
- Delivery date

## 7.9 Sender ID Management

Members should be able to request and manage sender IDs.

### Features

- Request sender ID
- View approval status
- Admin approval
- Country-specific sender ID rules
- Default sender ID option

### Sender ID Statuses

- Pending
- Approved
- Rejected

## 7.10 API Access

Members should be able to generate API keys and send SMS through the SplitSMS API.

### API Features

- Generate API key
- Regenerate API key
- Disable API key
- View API documentation
- Send SMS endpoint
- Check balance endpoint
- Delivery report webhook

### Example API Endpoints

```http
POST /api/v1/sms/send
GET /api/v1/balance
GET /api/v1/reports
POST /api/v1/webhooks/delivery
```

## 7.11 Admin Dashboard

Admins should be able to manage the entire platform.

### Admin Features

- View all members
- Manage user balances
- Approve manual payments
- Manage SMS pricing
- Manage countries
- Manage routes
- Manage providers
- Approve sender IDs
- View all campaigns
- View delivery reports
- Manage platform settings
- Manage support tickets

## 7.12 Reseller Support

Although SplitSMS is not positioned as a SaaS product, it can support reseller-style users.

### Reseller Features

- Special reseller pricing
- Higher SMS volume discounts
- Client account management, optional
- API access
- Custom sender ID support
- Commission or margin tracking, optional

## 8. User Roles

### Member

Can use the platform to send SMS, buy credits, manage contacts, and access API tools.

### Reseller

Can send high-volume SMS, receive special pricing, and optionally manage sub-clients.

### Admin

Can manage members, pricing, payments, sender IDs, routes, gateways, and reports.

### Super Admin

Has full platform control including system settings and admin user management.

## 9. Pages Required

## Public Pages

- Home
- Pricing
- Features
- API Documentation
- Contact
- Login
- Signup
- Forgot Password
- OTP Verification

## Member Pages

- Dashboard
- Send SMS
- Campaigns
- Contacts
- Contact Groups
- Sender IDs
- Wallet
- Buy Credits
- Transactions
- Reports
- API Keys
- Settings
- Support

## Admin Pages

- Admin Dashboard
- Members
- Resellers
- Payments
- SMS Pricing
- Countries
- Providers
- Routes
- Sender ID Requests
- Campaigns
- Delivery Reports
- API Logs
- Support Tickets
- Settings

## 10. UI/UX Direction

The UI should be clean, modern, and easy to understand.

### Design Style

- Modern dashboard layout
- Light and dark mode
- Rounded cards
- Clean typography
- Clear icons
- Mobile responsive
- Minimal clutter
- Fast navigation
- Simple forms
- Clear success and error messages

### Suggested Colors

- Primary: Blue or Indigo
- Secondary: Slate or Gray
- Success: Green
- Warning: Amber
- Error: Red

## 11. Homepage Sections

The homepage should include:

1. Hero section
2. Trust badges
3. How it works
4. Features
5. Global SMS coverage
6. Pricing preview
7. API section
8. Use cases
9. Testimonials
10. FAQ
11. Final call-to-action

## 12. Homepage Hero Copy

### Headline

**Send Bulk SMS Globally With SplitSMS**

### Subheadline

A simple and reliable SMS platform for businesses, organizations, developers, and resellers. Sign up with your phone number, buy credits, and start sending messages worldwide.

### CTA Buttons

- Get Started
- View Pricing

## 13. Important System Logic

## 13.1 SMS Cost Calculation

The system should calculate SMS cost based on:

- Destination country
- Number of recipients
- SMS units per message
- Member pricing plan
- Gateway route

## 13.2 Message Queue

Bulk SMS should be processed using a queue system to avoid server overload.

Recommended tools:

- Redis
- BullMQ
- Background workers

## 13.3 Gateway Failover

If one SMS provider fails, the platform should automatically try another provider where possible.

Example:

1. Try Telnyx
2. If failed, try Vonage
3. If failed, try Infobip

## 13.4 Country-Based Routing

Each country should have its own route configuration.

Example:

- Ghana: Termii or Africa’s Talking
- Nigeria: Termii
- USA: Telnyx
- UK: Vonage
- Global fallback: Infobip

## 14. Database Models

Suggested database models:

- User
- Wallet
- Transaction
- SmsCredit
- SmsPricing
- Country
- Contact
- ContactGroup
- Campaign
- Message
- SenderId
- ApiKey
- SmsProvider
- SmsRoute
- Payment
- SupportTicket
- AdminUser
- AuditLog

## 15. Security Requirements

- OTP verification
- Password hashing
- API key hashing
- Rate limiting
- Login attempt protection
- Role-based access control
- Secure payment webhooks
- Admin activity logs
- Input validation
- Protection against duplicate transactions

## 16. Performance Requirements

- Dashboard should load fast
- Bulk sending should run in background jobs
- Reports should be paginated
- Large contact uploads should be processed in batches
- API should support high-volume requests
- Delivery reports should be updated asynchronously

## 17. MVP Features

The first version should include:

- Phone number signup
- OTP verification
- Login
- Member dashboard
- Wallet balance
- Buy credits
- Send SMS
- Contact upload
- Campaign history
- Delivery reports
- Sender ID request
- Admin dashboard
- SMS pricing management
- Payment tracking
- One SMS gateway integration

## 18. Future Features

- WhatsApp messaging
- Email campaigns
- Voice SMS
- USSD integration
- AI campaign writing assistant
- Advanced analytics
- White-label reseller accounts
- Mobile app
- Two-way SMS inbox
- Team members
- Subscription plans, optional

## 19. Success Metrics

SplitSMS should track:

- Total members
- Active members
- SMS sent per day
- Delivery rate
- Failed message rate
- Revenue
- Average wallet top-up
- API usage
- Returning customers
- Reseller signups

## 20. Final Product Statement

SplitSMS is a clean, modern, full-stack Next.js bulk SMS platform where members can sign up using their phone number, buy credits, send SMS globally, manage contacts, track delivery reports, and access powerful API tools from one simple dashboard.
