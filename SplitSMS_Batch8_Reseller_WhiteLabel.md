# SplitSMS — NEXT FEATURE BATCH
# Batch 8: Reseller System + White-Label Infrastructure

Version: 1.1 · **Status snapshot: May 2026**

---

# ✅ Batch completion (current codebase)

| Deliverable (§40) | Status | Notes |
|-------------------|--------|-------|
| Reseller accounts | ✅ | `Reseller` model + apply / admin approve |
| Sub-user management | ✅ | Create, suspend, fund |
| Reseller wallet | ✅ | Fund sub-user wallet or SMS credits |
| Commission tracking | ✅ | `ResellerCommission` on SMS usage |
| Custom pricing | ✅ | `ResellerCountryPricing` per country |
| Reseller dashboard | ✅ | `/reseller/*` portal |
| Analytics starter | ✅ | Overview + reports |
| White-label foundation | ✅ | `WhiteLabelBrand` + themed sidebar |

### Routes

| Reseller | Admin |
|----------|-------|
| `/reseller` | `/admin/resellers` |
| `/reseller/users` | Approve / suspend / promote |
| `/reseller/wallet` | |
| `/reseller/pricing` | |
| `/reseller/settings` | |

### Key files

- `lib/reseller/context.ts`, `pricing.ts`, `fund.ts`, `commission.ts`, `analytics.ts`
- `lib/actions/reseller.ts`, `admin-resellers.ts`
- Pricing chain integrated in `lib/sms/billing.ts`

### Deferred

- Custom domain routing, branded login, reseller API keys
- Automated commission payout

---

# 1. Batch Goal

This batch focuses on transforming SplitSMS into a scalable reseller ecosystem.

After Batch 7, SplitSMS becomes a stable messaging infrastructure.

Now the platform must support:

- SMS resellers
- Sub-accounts
- White-label branding
- Custom pricing
- Commission systems
- Partner infrastructure
- Multi-tenant architecture

This batch allows agencies, businesses, telecom partners, and entrepreneurs to build their own SMS businesses using SplitSMS infrastructure.

---

# 2. Main Objectives

Build:

- Reseller accounts
- Sub-user system
- Reseller wallet
- Custom pricing
- White-label system
- Branding engine
- Commission tracking
- Multi-tenant infrastructure
- Reseller analytics
- Partner management

---

# 3. Reseller System Overview

## Reseller Features

A reseller should be able to:

- Create sub-users
- Fund sub-user wallets
- Set custom SMS pricing
- Track sub-user campaigns
- Earn commissions
- View analytics
- Manage clients
- Brand their own portal later

---

# 4. Multi-Tenant Architecture

## Goal

Each reseller should operate like an independent SMS business.

---

# 5. Tenant Structure

```txt
SplitSMS Platform
↓
Reseller Account
↓
Sub-Users
↓
Campaigns + Wallets + Transactions
```

---

# 6. Reseller Account Model

```prisma
model Reseller {
  id            String   @id @default(cuid())
  userId        String   @unique
  businessName  String
  brandName     String?
  domain        String?
  commissionRate Decimal?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
}
```

---

# 7. Sub-User Model

```prisma
model ResellerUser {
  id            String   @id @default(cuid())
  resellerId    String
  userId        String
  createdAt     DateTime @default(now())
}
```

---

# 8. Reseller Wallet System

## Features

- Main reseller wallet
- Fund sub-users
- Deduct sub-user usage
- Commission earnings
- Revenue tracking

---

# 9. Wallet Hierarchy

```txt
Platform Wallet
↓
Reseller Wallet
↓
Sub-User Wallet
```

---

# 10. Reseller Pricing System

## Reseller Can

- Set custom SMS prices
- Add profit margins
- Create promotional pricing
- Control country pricing

---

# 11. Pricing Flow

```txt
Platform Cost Price
↓
Reseller Price
↓
Sub-User Final Price
```

---

# 12. Commission System

## Commission Sources

- SMS usage
- Wallet funding
- Premium services later

---

# 13. Commission Model

```prisma
model ResellerCommission {
  id            String   @id @default(cuid())
  resellerId    String
  amount        Decimal
  source        String
  referenceId   String?
  createdAt     DateTime @default(now())
}
```

---

# 14. White-Label System

## Future White-Label Features

- Custom logo
- Custom domain
- Custom colors
- Branded emails
- Custom login page

---

# 15. White-Label Branding Model

```prisma
model WhiteLabelBrand {
  id            String   @id @default(cuid())
  resellerId    String
  logoUrl       String?
  primaryColor  String?
  secondaryColor String?
  domain        String?
  createdAt     DateTime @default(now())
}
```

---

# 16. Custom Domains

## Examples

```txt
sms.company.com
portal.agency.com
messages.partner.com
```

---

# 17. Reseller Dashboard

## Main Pages

```txt
/reseller
/reseller/users
/reseller/wallet
/reseller/transactions
/reseller/pricing
/reseller/reports
/reseller/settings
```

---

# 18. Reseller Dashboard Features

## Dashboard Cards

- Wallet balance
- Total users
- Total SMS sent
- Total commissions
- Revenue analytics

---

# 19. Sub-User Management

## Reseller Can

- Create users
- Suspend users
- Fund wallets
- View campaigns
- Reset passwords

---

# 20. Sub-User Analytics

## Track

- SMS volume
- Spending
- Delivery rate
- Wallet usage
- Active campaigns

---

# 21. Reseller Funding Flow

```txt
Reseller Adds Funds
↓
Reseller Wallet Updates
↓
Reseller Funds Sub-User
↓
Sub-User Wallet Updates
```

---

# 22. Transaction Tracking

## Track

- Reseller deposits
- User funding
- SMS deductions
- Commissions
- Refunds

---

# 23. Reseller Notifications

## Notify Reseller When

- User balance is low
- User exceeds limits
- Failed campaigns
- Wallet funding succeeds

---

# 24. User Limits

## Reseller Can Set

- Daily SMS limit
- Wallet limit
- API limit
- Allowed countries

---

# 25. API Support for Resellers

## Reseller APIs

- Create users
- Fund wallets
- View reports
- Manage campaigns

---

# 26. White-Label Email System

## Future Features

- Custom support email
- Custom sender name
- Branded invoices
- Branded notifications

---

# 27. Branded Login Experience

## Future Features

- Custom login page
- Custom dashboard branding
- Separate support portal

---

# 28. Reseller Analytics

## Metrics

- Total revenue
- Profit margin
- SMS volume
- Active clients
- Country performance

---

# 29. Revenue Sharing

## Revenue Flow

```txt
User SMS Payment
↓
Reseller Profit
↓
Platform Profit
```

---

# 30. Fraud Prevention

## Protect Against

- Fake reseller accounts
- Wallet abuse
- SMS spam
- Commission fraud

---

# 31. Reseller Approval System

## Admin Can

- Approve reseller
- Reject reseller
- Suspend reseller
- Limit reseller access

---

# 32. Admin Reseller Dashboard

## Features

- View resellers
- Track commissions
- View reseller revenue
- Manage reseller permissions

---

# 33. White-Label Security

## Must Protect

- Tenant isolation
- Cross-account access
- API separation
- Branding abuse

---

# 34. Multi-Tenant Security

## Important

Each reseller's users and data must remain isolated.

---

# 35. Branding Engine

## Future Support

- Dynamic themes
- Custom dashboard colors
- White-label templates

---

# 36. Reseller API Keys

## Features

- Separate API keys
- Usage limits
- Activity logs

---

# 37. Partner Infrastructure

## Future Partner Types

- Agencies
- Telecom providers
- SaaS platforms
- Enterprises

---

# 38. Billing Integration

## Reseller Billing

- Commission payout
- Profit reports
- Revenue summaries
- Tax support later

---

# 39. White-Label Deployment

## Future Architecture

```txt
Main Platform
↓
Custom Domains
↓
Reseller Branding Layer
```

---

# 40. MVP Deliverables

By end of this batch:

✅ Reseller accounts  
✅ Sub-user management  
✅ Reseller wallet  
✅ Commission tracking  
✅ Custom pricing  
✅ Reseller dashboard  
✅ Analytics starter  
✅ White-label foundation  

---

# 41. Testing Checklist

## Test

- Create reseller
- Create sub-user
- Fund sub-user
- Track commissions
- Apply reseller pricing
- Isolate reseller data
- Restrict unauthorized access

---

# 42. Final Goal

After this batch, SplitSMS becomes a scalable SMS business ecosystem.

The platform should support:

- Independent resellers
- White-label businesses
- Multi-tenant operations
- Commission-based growth
- Partner expansion

Users should be able to build their own messaging businesses on top of SplitSMS infrastructure.
