# SplitSMS — NEXT BATCH
# Batch 5: API Platform + Developer Ecosystem

Version: 1.1 · **Status snapshot: May 2026**

---

# ✅ Batch completion (current codebase)

| Deliverable (§44) | Status | Notes |
|-------------------|--------|-------|
| Public REST API | ✅ | `/api/v1/*` — SMS, OTP, wallet, campaigns, contacts, reports |
| API key system | ✅ | Hashed keys, permissions, rotate/revoke, sandbox `sk_test_` |
| Webhooks | ✅ | Signed delivery + retries + `campaign.completed`, `wallet.low_balance` |
| Developer dashboard | ✅ | `/developers` — keys, webhooks, logs, docs |
| API logs | ✅ | Per-key logging + analytics on `/dashboard/api-logs` |
| Rate limiting | ✅ | Per-key tiers: 10 / 100 / 1000 req/min |
| Documentation starter | ✅ | `/api-docs` + Postman collection |
| SDK starter | ✅ | `sdk/javascript/` (`@splitsms/sdk` 0.1.0) |

### API base (self-hosted)

```txt
https://your-domain.com/api/v1
Authorization: Bearer sk_live_... | sk_test_...
```

### Key files

- `lib/api/with-api.ts`, `auth.ts`, `errors.ts`, `permissions.ts`, `send-message.ts`, `analytics.ts`
- `lib/webhooks/dispatch.ts` (retries), `events.ts`
- `app/api/v1/campaigns/*`, `contacts/*`, `wallet/transactions`, `messages/[id]`
- `app/developers/*`, `public/postman/splitsms.collection.json`

### Workers

```bash
npm run worker:webhooks   # webhook retry queue
```

### Deferred

- Mintlify/Swagger hosted docs, Python/PHP SDKs
- SMPP / enterprise dedicated routes
- Sentry/Grafana integration
- Full integration test suite

---

# 1. Batch Goal

This batch focuses on transforming SplitSMS into a developer-first messaging platform.

The goal is to provide businesses and developers with:

- Public APIs
- API authentication
- SDKs
- Webhooks
- API analytics
- Developer documentation
- Sandbox testing
- Rate limiting
- Secure integrations

After this batch, SplitSMS becomes both:

- A web platform
- A programmable messaging infrastructure

---

# 2. Main Objectives

Build:

- Public REST API
- API key management
- Webhooks
- Developer portal
- API analytics
- SDK support
- API security
- Sandbox environment

---

# 3. API Architecture

## API Base URL

```txt
https://api.splitsms.com/v1
```

---

# 4. API Authentication

## Authentication Method

Use:

```txt
Bearer Token Authentication
```

---

# 5. API Key System

## Features

- Generate API keys
- Revoke API keys
- Rotate API keys
- View usage logs
- Track last usage
- Set permissions

---

# 6. API Key Database Model

```prisma
model ApiKey {
  id            String   @id @default(cuid())
  userId        String
  name          String
  keyHash       String
  permissions   String[]
  status        String   @default("active")
  lastUsedAt    DateTime?
  createdAt     DateTime @default(now())
}
```

---

# 7. API Permissions

## Example Permissions

- sms.send
- sms.read
- wallet.read
- contacts.read
- contacts.write
- campaigns.read

---

# 8. API Key Security

## Requirements

- Store only hashed keys
- Never expose full key again
- Rate limit every key
- Log all requests
- IP monitoring

---

# 9. Send SMS API

## Endpoint

```txt
POST /messages/send
```

---

# 10. Example Request

```json
{
  "sender": "SplitSMS",
  "recipients": ["233XXXXXXXXX"],
  "message": "Hello from SplitSMS"
}
```

---

# 11. Example Response

```json
{
  "success": true,
  "campaign_id": "cmp_123456",
  "queued": true
}
```

---

# 12. OTP API

## Endpoint

```txt
POST /otp/send
```

---

# 13. OTP Request Example

```json
{
  "phone": "233XXXXXXXXX",
  "message": "Your OTP code is 1234"
}
```

---

# 14. Verify OTP API

## Endpoint

```txt
POST /otp/verify
```

---

# 15. Wallet API

## Endpoints

```txt
GET /wallet/balance
GET /wallet/transactions
```

---

# 16. Campaign API

## Endpoints

```txt
GET /campaigns
GET /campaigns/:id
GET /campaigns/:id/messages
```

---

# 17. Contacts API

## Endpoints

```txt
GET /contacts
POST /contacts
PUT /contacts/:id
DELETE /contacts/:id
```

---

# 18. Webhooks System

## Features

- Delivery webhooks
- Wallet alerts
- Campaign completion
- Failed message alerts

---

# 19. Webhook Events

## Events

```txt
message.sent
message.delivered
message.failed
campaign.completed
wallet.low_balance
```

---

# 20. Webhook Database Model

```prisma
model WebhookEndpoint {
  id          String   @id @default(cuid())
  userId      String
  url         String
  secret      String
  status      String
  createdAt   DateTime @default(now())
}
```

---

# 21. Webhook Security

## Security Features

- Signature verification
- Secret keys
- Retry failed webhooks
- IP validation

---

# 22. Webhook Retry Strategy

## Retry Rules

```txt
Retry 1 → 1 minute
Retry 2 → 5 minutes
Retry 3 → 30 minutes
Retry 4 → 2 hours
```

---

# 23. Developer Dashboard

## Features

- API keys
- API logs
- Usage charts
- Error logs
- Webhook logs
- SDK downloads

---

# 24. API Analytics

## Metrics

- Total requests
- Failed requests
- Rate limit hits
- Active API keys
- Top endpoints

---

# 25. API Logs

## Log Fields

- endpoint
- method
- status
- latency
- IP address
- API key
- request size

---

# 26. Rate Limiting

## Rules

### Free Plan
10 requests/minute

### Standard Plan
100 requests/minute

### Enterprise
Custom limits

---

# 27. API Middleware

## Middleware Features

- Auth validation
- Rate limiting
- Logging
- Validation
- Error handling

---

# 28. Validation System

## Use

- Zod
- Yup

---

# 29. Error Responses

## Standard Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid phone number"
  }
}
```

---

# 30. API Documentation

## Build Docs Using

- Mintlify
- Nextra
- Swagger
- Postman Collection

---

# 31. Documentation Sections

## Include

- Authentication
- Endpoints
- Examples
- SDKs
- Error codes
- Rate limits
- Webhooks

---

# 32. SDK Support

## Build SDKs For

- JavaScript
- Node.js
- PHP
- Python
- Laravel
- React Native

---

# 33. SDK Features

## SDK Should Handle

- Authentication
- Request retries
- Error handling
- Validation

---

# 34. Sandbox Environment

## Features

- Test API keys
- Fake SMS responses
- Safe testing
- No billing

---

# 35. Sandbox API Base URL

```txt
https://sandbox-api.splitsms.com
```

---

# 36. API Monitoring

## Recommended Tools

- Sentry
- Better Stack
- Grafana

---

# 37. API Queue Integration

## API Flow

```txt
API Request
↓
Validate Key
↓
Check Wallet
↓
Queue SMS Job
↓
Worker Sends SMS
↓
Webhook Updates
```

---

# 38. API Security Requirements

## Must Have

- HTTPS only
- Request validation
- Key hashing
- Rate limiting
- IP monitoring
- Audit logs

---

# 39. Enterprise API Features

## Future Features

- SMPP API
- Dedicated routes
- Priority queues
- SLA support

---

# 40. Developer Portal UI

## Pages

```txt
/developers
/developers/docs
/developers/api-keys
/developers/webhooks
/developers/logs
```

---

# 41. Developer Experience Goals

SplitSMS APIs should feel:

- Easy
- Fast
- Predictable
- Reliable
- Well documented

---

# 42. Mobile SDK Roadmap

## Build Later

- Flutter SDK
- React Native SDK
- Android SDK
- iOS SDK

---

# 43. Testing Infrastructure

## Add

- Unit tests
- Integration tests
- API tests
- Webhook tests

---

# 44. API MVP Deliverables

By end of this batch:

✅ Public REST API  
✅ API key system  
✅ Webhooks  
✅ Developer dashboard  
✅ API logs  
✅ Rate limiting  
✅ Documentation starter  
✅ SDK starter  

---

# 45. Final Goal

After this batch, SplitSMS becomes a complete messaging infrastructure platform.

Developers should be able to:

- Send SMS
- Send OTP
- Manage campaigns
- Manage contacts
- Receive webhooks
- Monitor delivery
- Build products on top of SplitSMS
