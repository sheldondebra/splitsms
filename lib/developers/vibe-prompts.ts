export type VibePrompt = {
  id: string;
  title: string;
  category: string;
  tags: string[];
  description: string;
  prompt: string;
};

export const vibePromptCategories = [
  "All",
  "OTP & Auth",
  "SMS",
  "Next.js",
  "WordPress",
  "Connect",
  "Webhooks",
] as const;

export function buildVibePrompts(baseUrl: string, apiV1: string): VibePrompt[] {
  return [
    {
      id: "otp-nextjs",
      title: "Add phone OTP login to Next.js",
      category: "OTP & Auth",
      tags: ["Next.js", "App Router", "sandbox"],
      description: "Full OTP send/verify flow with sandbox key and UI form.",
      prompt: `Add phone OTP login to this Next.js App Router project using SplitSMS.

Requirements:
- Use sandbox API key from env SPLITSMS_API_KEY (sk_test_)
- Base URL: ${baseUrl} (env SPLITSMS_BASE_URL)
- API endpoints: POST ${apiV1}/otp/send and POST ${apiV1}/otp/verify
- Authorization: Bearer token header
- Sandbox verify code is always 123456
- Create API routes under app/api/otp/send and app/api/otp/verify
- Add a simple login page: phone input → send code → verify code → set session cookie
- Ghana numbers: accept 233... or local 0... format
- Show clear errors from API JSON responses
- Do NOT use npm install @splitsms/sdk (not on npm) — use fetch or install from ${baseUrl}/sdk/javascript/splitsms-sdk.tgz

Reference OpenAPI: ${baseUrl}/openapi.json`,
    },
    {
      id: "send-sms-api-route",
      title: "Next.js API route to send SMS",
      category: "Next.js",
      tags: ["SMS", "route handler"],
      description: "Protected POST endpoint that sends one SMS.",
      prompt: `Create a Next.js App Router API route POST /api/sms/send that sends SMS via SplitSMS.

- Env: SPLITSMS_API_KEY, SPLITSMS_BASE_URL=${baseUrl}
- Call POST ${apiV1}/sms/send with JSON body: sender, recipients[], message, countryCode
- Validate phone and message server-side
- Return API response as JSON with matching status code
- Add rate limiting comment for production
- Use fetch, not axios

OpenAPI spec: ${baseUrl}/openapi.json`,
    },
    {
      id: "express-otp-microservice",
      title: "Express OTP microservice",
      category: "OTP & Auth",
      tags: ["Express", "Node"],
      description: "Standalone Express server for OTP send/verify.",
      prompt: `Build a minimal Express.js server with SplitSMS OTP endpoints.

Endpoints:
- POST /otp/send { phone, countryCode? }
- POST /otp/verify { phone, code }

SplitSMS API base: ${apiV1}
Auth: Authorization: Bearer process.env.SPLITSMS_API_KEY
Use native fetch. Sandbox key sk_test_ — verify with code 123456.
Include .env.example and package.json with "type": "module".
Port 3001.`,
    },
    {
      id: "woocommerce-sms-plugin",
      title: "Configure WooCommerce SMS with SplitSMS plugin",
      category: "WordPress",
      tags: ["WooCommerce", "no-code"],
      description: "WordPress admin setup for order SMS.",
      prompt: `Guide me to set up WooCommerce SMS with the official SplitSMS WordPress plugin.

Context:
- Plugin download: ${baseUrl}/wordpress-plugin/splitsms.zip
- API base URL in plugin settings: ${baseUrl}
- I need SMS on: order placed, payment complete (Paystack), processing, completed, shipped
- Template placeholders: {customer_name}, {order_id}, {order_total}, {paystack_reference}, {tracking_number}
- Test with a sandbox or live API key from ${baseUrl}/developers/api-keys
- Verify sends in SplitSMS → Logs in wp-admin

Do not write custom PHP — use plugin Integrations UI only.`,
    },
    {
      id: "jetformbuilder-sms",
      title: "JetFormBuilder Send SMS action",
      category: "WordPress",
      tags: ["JetFormBuilder", "Crocoblock"],
      description: "Native Post Submit Action setup.",
      prompt: `Add SplitSMS to my JetFormBuilder form using the native "Send SMS (SplitSMS)" Post Submit Action.

Steps needed:
1. SplitSMS plugin v1.6+ installed and API key connected
2. Map phone field in the Send SMS action
3. Write confirmation SMS template with JetFormBuilder field macros
4. Avoid duplicate SMS (action vs global auto-SMS)
5. Test submission and check wp-admin SplitSMS → Logs

Plugin docs: ${baseUrl}/integrations/wordpress`,
    },
    {
      id: "connect-embed-customers",
      title: "Embed SplitSMS Connect in my SaaS",
      category: "Connect",
      tags: ["B2B", "multi-tenant"],
      description: "Provision customers under a partner account.",
      prompt: `Integrate SplitSMS Connect so my SaaS can provision SMS customers.

API:
- POST ${apiV1}/connect/customers
- GET ${apiV1}/connect/customers?external_ref=
- Auth: Bearer partner API key with connect.customers permission

Body example:
{ full_name, phone, country_code: "GH", external_ref: "my-user-id", initial_sms_credits: 10 }

When provisioning, store returned customer id. Use customer_id on sender-ids and send endpoints for that tenant.

OpenAPI: ${baseUrl}/openapi.json
Dashboard: ${baseUrl}/dashboard/connect`,
    },
    {
      id: "webhook-delivery-handler",
      title: "Handle SplitSMS delivery webhooks",
      category: "Webhooks",
      tags: ["HMAC", "Next.js"],
      description: "Verify signature and process delivery events.",
      prompt: `Add a SplitSMS webhook handler to this project.

Events: message.sent, message.delivered, message.failed, campaign.completed, wallet.low_balance
Header: X-SplitSMS-Signature = HMAC-SHA256 of raw body with webhook secret
Env: SPLITSMS_WEBHOOK_SECRET

Create POST /api/webhooks/splitsms that:
1. Reads raw body (not parsed JSON first — needed for signature)
2. Verifies signature with timing-safe compare
3. Parses JSON and switches on event.event
4. Returns 200 quickly

Configure webhook URL in ${baseUrl}/developers/webhooks`,
    },
    {
      id: "cursor-full-stack-sms",
      title: "Full-stack SMS feature (Cursor one-shot)",
      category: "SMS",
      tags: ["Cursor", "full-stack"],
      description: "End-to-end SMS from UI to API in one prompt.",
      prompt: `Ship a minimal "Send SMS" feature in this codebase using SplitSMS.

Stack: use what's already in the repo (Next.js/React if present).
Backend: call SplitSMS REST API at ${apiV1}/sms/send
Env vars: SPLITSMS_API_KEY (sandbox sk_test_ first), SPLITSMS_BASE_URL=${baseUrl}
UI: form with phone, message, sender ID default MYBRAND
Show success/error from API
Add README section with setup steps
Optional: install SDK from ${baseUrl}/sdk/javascript/splitsms-sdk.tgz

Machine-readable API docs: ${baseUrl}/openapi.json and ${baseUrl}/llms.txt
Integration snippets: ${baseUrl}/developers/generate`,
    },
    {
      id: "bulk-campaign-script",
      title: "Node script for bulk SMS campaign",
      category: "SMS",
      tags: ["Node", "bulk"],
      description: "Send to a CSV list via API.",
      prompt: `Write a Node.js script that reads phones from contacts.csv and sends bulk SMS via SplitSMS API.

- POST ${apiV1}/sms/send
- recipients array per request (batch max 100)
- sender: MYBRAND, countryCode GH
- Read SPLITSMS_API_KEY from env
- Log message_ids and errors
- Use sandbox key first for dry run

Check balance first: GET ${apiV1}/balance`,
    },
    {
      id: "debug-api-errors",
      title: "Debug SplitSMS API integration",
      category: "SMS",
      tags: ["debugging", "errors"],
      description: "Fix common 401/402/404 integration issues.",
      prompt: `Help me debug my SplitSMS API integration.

Checklist:
1. API key format sk_live_ or sk_test_ (~56 chars), header Authorization: Bearer KEY
2. Base URL ${baseUrl} — paths under /api/v1/
3. Sandbox: OTP verify uses 123456; SMS send returns success without live delivery
4. 402 = insufficient credits — check GET ${apiV1}/balance
5. Invalid sender = use approved Sender ID from dashboard
6. @splitsms/sdk NOT on npm — install from ${baseUrl}/sdk/javascript/splitsms-sdk.tgz

Show me how to test with curl and read logs at ${baseUrl}/developers/logs`,
    },
  ];
}

export function getVibePromptCategories() {
  return vibePromptCategories;
}
