# SplitSMS — NEXT FEATURE BATCH
# Batch 6: Pricing, Billing, Wallet Funding & Revenue System

Version: 1.1 · **Status snapshot: May 2026**

---

# ✅ Batch completion (current codebase)

| Deliverable (§40) | Status | Notes |
|-------------------|--------|-------|
| Country pricing | ✅ | `SmsPricing` + cost/sell/profit; admin edit UI |
| Wallet funding | ✅ | Paystack + manual; `/api/payments/initialize` & `verify` |
| Paystack integration | ✅ | Webhook signature verify + transaction verify |
| Transaction records | ✅ | `balanceBefore`/`After`, reference, metadata |
| SMS cost calculator | ✅ | `/api/billing/estimate` + live send preview |
| Wallet deduction | ✅ | Credits from wallet via purchase; SMS debit with provider cost metadata |
| Refund logic | ✅ | Existing auto-refund on failed SMS |
| Admin pricing | ✅ | `/admin/pricing` — edit rates, custom user pricing |
| Revenue analytics | ✅ | `/admin/billing` — deposits, revenue, profit, by country |
| Invoice starter | ✅ | `Invoice` model + auto on wallet top-up |
| Promo codes | ✅ | `PromoCode` + apply on wallet page |

### Key paths

- `lib/billing/pricing.ts`, `calculator.ts`, `invoices.ts`, `promo.ts`
- `lib/analytics/revenue.ts`
- `lib/payments/paystack-verify.ts`, `wallet.ts`
- `/dashboard/wallet`, `/dashboard/pricing`, `/dashboard/invoices`
- `/admin/pricing`, `/admin/billing`

### Env

```env
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
```

### Run

```bash
npm run worker:webhooks   # optional
npm run db:seed          # refresh cost/sell prices
```

---

# 1. Batch Goal

This batch focuses on building the financial engine of SplitSMS.

After building the API platform, the next important feature is the pricing and billing system.

SplitSMS must accurately handle:

- SMS pricing
- Country-based rates
- Wallet funding
- Payment processing
- SMS deductions
- Refunds
- Invoices
- Profit tracking
- Reseller pricing later

This batch makes SplitSMS financially ready for real users.

---

# 2. Main Objectives

Build:

- Country pricing system
- Wallet funding
- Payment integration
- Transaction system
- SMS cost calculator
- Invoice system
- Admin pricing controls
- Profit analytics
- Refund system
- Promo code system

---

# 3. Why This Batch Comes Next

Batch 5 created the API platform.

Now SplitSMS needs a strong billing system so both dashboard users and API users can:

- Add funds
- Send SMS using wallet balance
- See exact SMS cost
- Track spending
- Receive invoices
- Understand their usage

Without strong billing, the platform cannot safely scale.

---

# 4. Pricing System Overview

## Pricing Must Support

- Country-based pricing
- Provider-based cost price
- User sell price
- Profit margin
- Reseller pricing later
- Promotional discounts
- Enterprise custom pricing

---

# 5. Country Pricing

## Example

| Country | Provider | Cost Price | Sell Price | Profit |
|---|---|---:|---:|---:|
| Ghana | mNotify | 0.035 | 0.050 | 0.015 |
| Nigeria | Termii | 0.025 | 0.045 | 0.020 |
| USA | Telnyx | 0.008 | 0.015 | 0.007 |

---

# 6. Pricing Database Model

```prisma
model SmsPricing {
  id          String   @id @default(cuid())
  country     String
  countryCode String
  dialCode    String
  provider    String
  costPrice   Decimal
  sellPrice   Decimal
  currency    String   @default("GHS")
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

# 7. User Custom Pricing

Some users may need special rates.

## Use Cases

- High-volume customer
- Enterprise client
- Reseller
- Partner account
- Promotional account

---

# 8. User Pricing Model

```prisma
model UserSmsPricing {
  id          String   @id @default(cuid())
  userId      String
  countryCode String
  sellPrice   Decimal
  currency    String   @default("GHS")
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

# 9. SMS Cost Calculator

## Calculator Must Consider

- Recipient country
- Number of recipients
- SMS segment count
- Unicode or GSM message
- User pricing
- Default country pricing
- Available wallet balance

---

# 10. SMS Segment Rules

## GSM SMS

- 160 characters = 1 SMS
- 153 characters per segment after first segment

## Unicode SMS

- 70 characters = 1 SMS
- 67 characters per segment after first segment

---

# 11. Cost Calculation Flow

```txt
User enters message
↓
System counts characters
↓
System detects GSM or Unicode
↓
System calculates SMS segments
↓
System detects recipient countries
↓
System applies pricing
↓
System shows total cost
↓
User confirms send
```

---

# 12. Wallet Funding

## Wallet Funding Options

### Ghana / Africa

- Paystack
- Flutterwave
- Mobile Money
- Bank transfer later

### Global

- Stripe
- PayPal later

---

# 13. Wallet Funding Flow

```txt
User selects amount
↓
Payment provider checkout opens
↓
Payment succeeds
↓
Webhook confirms payment
↓
Wallet balance updates
↓
Transaction is recorded
↓
User receives receipt
```

---

# 14. Wallet Model

```prisma
model Wallet {
  id          String   @id @default(cuid())
  userId      String   @unique
  balance     Decimal  @default(0)
  currency    String   @default("GHS")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

# 15. Transaction Model

```prisma
model Transaction {
  id             String   @id @default(cuid())
  userId         String
  walletId       String
  type           String
  amount         Decimal
  balanceBefore  Decimal
  balanceAfter   Decimal
  currency       String   @default("GHS")
  reference      String?
  status         String   @default("pending")
  metadata       Json?
  createdAt      DateTime @default(now())
}
```

---

# 16. Transaction Types

## Supported Types

- deposit
- sms_debit
- refund
- bonus
- promo_credit
- admin_adjustment
- reseller_commission

---

# 17. Payment Integration

## First Payment Provider Recommendation

Start with:

```txt
Paystack
```

Why:

- Good for Ghana and Africa
- Supports cards
- Supports mobile money in supported countries
- Good webhook system
- Easy API integration

---

# 18. Paystack Environment Variables

```env
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_CALLBACK_URL=https://splitsms.com/dashboard/wallet/callback
```

---

# 19. Payment API Routes

```txt
/api/payments/initialize
/api/payments/verify
/api/webhooks/paystack
```

---

# 20. Payment Statuses

## Status List

- pending
- successful
- failed
- abandoned
- refunded

---

# 21. Wallet Safety Rules

## Important Rules

- Never update wallet without confirmed payment webhook.
- Never allow negative wallet balance.
- Always create transaction records.
- Use database transactions for balance updates.
- Prevent duplicate webhook processing.
- Lock wallet before SMS deduction.

---

# 22. SMS Deduction Flow

```txt
User sends SMS
↓
System calculates total cost
↓
Wallet balance is checked
↓
Amount is deducted
↓
SMS campaign is queued
↓
Transaction is recorded
↓
Failed SMS can trigger refund
```

---

# 23. Refund System

## Refund Cases

- Provider failed
- Message rejected
- Campaign cancelled
- Admin-approved refund

---

# 24. Refund Flow

```txt
Failed message detected
↓
Refund eligibility checked
↓
Wallet balance updated
↓
Refund transaction created
↓
Campaign cost updated
```

---

# 25. Invoice System

## Invoice Features

- Automatic invoices
- Download PDF later
- Transaction receipts
- Monthly billing summary
- VAT/tax support later

---

# 26. Invoice Model

```prisma
model Invoice {
  id          String   @id @default(cuid())
  userId      String
  invoiceNo   String   @unique
  amount      Decimal
  currency    String   @default("GHS")
  status      String
  items       Json
  createdAt   DateTime @default(now())
}
```

---

# 27. Promo Code System

## Promo Code Features

- Percentage discount
- Fixed credit bonus
- Expiration date
- Usage limit
- User-specific promo

---

# 28. Promo Code Model

```prisma
model PromoCode {
  id          String   @id @default(cuid())
  code        String   @unique
  type        String
  value       Decimal
  maxUses     Int?
  usedCount   Int      @default(0)
  expiresAt   DateTime?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

---

# 29. Admin Pricing Dashboard

## Admin Can

- Add country pricing
- Edit SMS price
- Disable country route
- Set provider cost
- Set profit margin
- Assign custom user pricing
- View pricing history

---

# 30. Admin Billing Dashboard

## Admin Can View

- Total deposits
- Total SMS revenue
- Total refunds
- Total profit
- User balances
- Pending payments
- Failed payments

---

# 31. Revenue Analytics

## Metrics

- Gross revenue
- Provider cost
- Net profit
- Refund amount
- Average SMS margin
- Revenue by country
- Revenue by user
- Revenue by provider

---

# 32. Profit Calculation

## Formula

```txt
Profit = User Sell Price - Provider Cost Price
```

For campaigns:

```txt
Total Profit = Total User Charge - Total Provider Cost
```

---

# 33. Billing Dashboard Pages

## Member Pages

```txt
/dashboard/wallet
/dashboard/transactions
/dashboard/invoices
/dashboard/pricing
```

## Admin Pages

```txt
/admin/pricing
/admin/billing
/admin/transactions
/admin/invoices
/admin/revenue
```

---

# 34. Pricing Page for Users

## User Should See

- Country
- SMS price
- Currency
- Minimum wallet balance
- Sender ID note
- Delivery note

---

# 35. Low Balance System

## Notify User When

- Balance is below threshold
- Campaign cost is higher than balance
- API request fails because of low balance

---

# 36. Low Balance Notification

```txt
Your SplitSMS wallet balance is low. Please top up to continue sending messages.
```

---

# 37. API Billing Rules

API users must follow the same wallet logic:

```txt
API Request
↓
Validate API key
↓
Calculate SMS cost
↓
Check wallet
↓
Deduct balance
↓
Queue SMS
```

---

# 38. Billing Security

## Must Protect

- Payment webhooks
- Wallet updates
- Refunds
- Admin adjustments
- Transaction logs

---

# 39. Audit Logs

## Log These Actions

- Wallet funding
- Wallet deduction
- Refunds
- Admin balance adjustment
- Price changes
- Promo code creation

---

# 40. MVP Deliverables

By the end of this batch:

✅ Country pricing system  
✅ Wallet funding  
✅ Paystack integration  
✅ Transaction records  
✅ SMS cost calculator  
✅ Wallet deduction  
✅ Refund logic  
✅ Admin pricing dashboard  
✅ Revenue analytics starter  
✅ Invoice starter  

---

# 41. Testing Checklist

## Test These

- Add wallet funds
- Verify payment webhook
- Send SMS and deduct balance
- Block SMS when balance is low
- Refund failed SMS
- Apply country pricing
- Apply custom user pricing
- Generate transaction history

---

# 42. Final Goal

After this batch, SplitSMS should be financially ready.

Users should be able to:

- Add money
- See wallet balance
- Send SMS safely
- Track spending
- View invoices
- Understand pricing

Admins should be able to:

- Set prices
- Track revenue
- View profit
- Manage refunds
- Control billing safely
