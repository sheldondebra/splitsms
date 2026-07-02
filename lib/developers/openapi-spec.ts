import { wordpressPlugin } from "@/lib/site-config";

export type OpenApiSpec = Record<string, unknown>;

/** OpenAPI 3.1 spec for AI tools, Postman import, and codegen. */
export function buildOpenApiSpec(apiBaseUrl: string): OpenApiSpec {
  const serverUrl = apiBaseUrl.replace(/\/$/, "");

  return {
    openapi: "3.1.0",
    info: {
      title: "SplitSMS API",
      version: "1.0.0",
      description: [
        "REST API for bulk SMS, OTP, wallet, contacts, campaigns, Connect (embedded customers), and sender IDs.",
        "Authenticate with `Authorization: Bearer sk_live_...` or sandbox key `sk_test_...`.",
        "Sandbox keys validate requests without sending live SMS or charging credits.",
        "OTP sandbox: verify with code `123456`.",
        `WordPress plugin v${wordpressPlugin.version} uses these endpoints.`,
        "Docs: https://www.splitsms.com/api-docs · SDK: https://www.splitsms.com/sdk",
      ].join("\n\n"),
      contact: { name: "SplitSMS", url: "https://www.splitsms.com/support" },
      license: { name: "Proprietary" },
    },
    servers: [{ url: serverUrl, description: "Production API v1" }],
    tags: [
      { name: "Wallet", description: "Balance and transactions" },
      { name: "SMS", description: "Send messages and delivery reports" },
      { name: "OTP", description: "One-time password send and verify" },
      { name: "Contacts", description: "Contact list management" },
      { name: "Campaigns", description: "Bulk campaign status" },
      { name: "Connect", description: "Embedded customer provisioning" },
      { name: "Sender IDs", description: "Brand sender registration" },
      { name: "WordPress", description: "Official plugin endpoints" },
    ],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "API key from SplitSMS dashboard → Developers → API Keys",
        },
      },
      schemas: {
        SuccessEnvelope: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
          },
        },
        SendSmsRequest: {
          type: "object",
          required: ["sender", "message", "recipients"],
          properties: {
            sender: { type: "string", example: "MYBRAND", description: "Approved Sender ID" },
            message: { type: "string", example: "Hello from SplitSMS" },
            recipients: {
              type: "array",
              items: { type: "string" },
              example: ["233201234567"],
            },
            countryCode: { type: "string", example: "GH" },
          },
        },
        OtpSendRequest: {
          type: "object",
          required: ["phone"],
          properties: {
            phone: { type: "string", example: "233201234567" },
            countryCode: { type: "string", example: "GH" },
          },
        },
        OtpVerifyRequest: {
          type: "object",
          required: ["phone", "code"],
          properties: {
            phone: { type: "string", example: "233201234567" },
            code: { type: "string", example: "123456" },
          },
        },
        ConnectCustomerRequest: {
          type: "object",
          required: ["full_name", "phone", "country_code"],
          properties: {
            full_name: { type: "string" },
            phone: { type: "string" },
            country_code: { type: "string", example: "GH" },
            email: { type: "string", format: "email" },
            external_ref: { type: "string", description: "Your idempotent customer key" },
            label: { type: "string" },
            initial_sms_credits: { type: "integer", example: 10 },
            initial_wallet_balance: { type: "number", example: 0 },
            currency: { type: "string", example: "GHS" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string" },
            message: { type: "string" },
          },
        },
      },
    },
    paths: {
      "/balance": {
        get: {
          tags: ["Wallet"],
          summary: "Account balance",
          description: "Wallet balance and SMS credits in one call.",
          operationId: "getBalance",
          responses: {
            "200": {
              description: "Balance snapshot",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/SuccessEnvelope" },
                      {
                        type: "object",
                        properties: {
                          wallet: {
                            type: "object",
                            properties: {
                              balance: { type: "number" },
                              currency: { type: "string" },
                            },
                          },
                          sms_credits: { type: "integer" },
                          sandbox: { type: "boolean" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "401": { description: "Invalid API key", content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } } },
          },
        },
      },
      "/wallet/balance": {
        get: {
          tags: ["Wallet"],
          summary: "Wallet balance",
          operationId: "getWalletBalance",
          responses: { "200": { description: "Wallet + credits" } },
        },
      },
      "/wallet/transactions": {
        get: {
          tags: ["Wallet"],
          summary: "List transactions",
          operationId: "listTransactions",
          parameters: [{ name: "limit", in: "query", schema: { type: "integer", maximum: 100 } }],
          responses: { "200": { description: "Transaction list" } },
        },
      },
      "/sms/send": {
        post: {
          tags: ["SMS"],
          summary: "Send SMS",
          description: "Send to one or many recipients. Live keys deduct credits.",
          operationId: "sendSms",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/SendSmsRequest" } } },
          },
          responses: {
            "200": { description: "Queued or sent" },
            "402": { description: "Insufficient credits" },
          },
        },
      },
      "/messages/{id}": {
        get: {
          tags: ["SMS"],
          summary: "Message status",
          operationId: "getMessage",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Delivery status" } },
        },
      },
      "/reports": {
        get: {
          tags: ["SMS"],
          summary: "Message reports",
          operationId: "listReports",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer" } },
            { name: "campaignId", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "Recent messages" } },
        },
      },
      "/otp/send": {
        post: {
          tags: ["OTP"],
          summary: "Send OTP",
          operationId: "sendOtp",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/OtpSendRequest" } } },
          },
          responses: { "200": { description: "OTP dispatched (sandbox: no SMS sent)" } },
        },
      },
      "/otp/verify": {
        post: {
          tags: ["OTP"],
          summary: "Verify OTP",
          operationId: "verifyOtp",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/OtpVerifyRequest" } } },
          },
          responses: { "200": { description: "Verification result" } },
        },
      },
      "/contacts": {
        get: {
          tags: ["Contacts"],
          summary: "List contacts",
          operationId: "listContacts",
          parameters: [
            { name: "limit", in: "query", schema: { type: "integer" } },
            { name: "q", in: "query", schema: { type: "string" } },
          ],
          responses: { "200": { description: "Contact list" } },
        },
        post: {
          tags: ["Contacts"],
          summary: "Create or upsert contact",
          operationId: "createContact",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
          responses: { "200": { description: "Contact saved" } },
        },
      },
      "/contacts/{id}": {
        put: {
          tags: ["Contacts"],
          summary: "Update contact",
          operationId: "updateContact",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Updated" } },
        },
        delete: {
          tags: ["Contacts"],
          summary: "Delete contact",
          operationId: "deleteContact",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Deleted" } },
        },
      },
      "/campaigns": {
        get: {
          tags: ["Campaigns"],
          summary: "List campaigns",
          operationId: "listCampaigns",
          parameters: [{ name: "status", in: "query", schema: { type: "string" } }],
          responses: { "200": { description: "Campaign list" } },
        },
      },
      "/campaigns/{id}": {
        get: {
          tags: ["Campaigns"],
          summary: "Campaign detail",
          operationId: "getCampaign",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Campaign stats" } },
        },
      },
      "/connect/customers": {
        get: {
          tags: ["Connect"],
          summary: "List Connect customers",
          operationId: "listConnectCustomers",
          parameters: [{ name: "external_ref", in: "query", schema: { type: "string" } }],
          responses: { "200": { description: "Customer list" } },
        },
        post: {
          tags: ["Connect"],
          summary: "Provision Connect customer",
          operationId: "createConnectCustomer",
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ConnectCustomerRequest" } },
            },
          },
          responses: { "200": { description: "Customer provisioned" } },
        },
      },
      "/connect/customers/{id}": {
        get: {
          tags: ["Connect"],
          summary: "Get Connect customer",
          operationId: "getConnectCustomer",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Customer detail" } },
        },
      },
      "/sender-ids": {
        get: {
          tags: ["Sender IDs"],
          summary: "List sender IDs",
          operationId: "listSenderIds",
          parameters: [{ name: "customer_id", in: "query", schema: { type: "string" } }],
          responses: { "200": { description: "Sender ID list" } },
        },
        post: {
          tags: ["Sender IDs"],
          summary: "Register sender ID",
          operationId: "registerSenderId",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
          responses: { "200": { description: "Submitted for approval" } },
        },
      },
      "/account/status": {
        get: {
          tags: ["WordPress"],
          summary: "Account status (WordPress plugin)",
          operationId: "accountStatus",
          responses: { "200": { description: "Credits and wallet for plugin UI" } },
        },
      },
      "/wordpress/connect": {
        post: {
          tags: ["WordPress"],
          summary: "Register WordPress site",
          operationId: "wordpressConnect",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
          responses: { "200": { description: "Site linked" } },
        },
      },
    },
    "x-webhooks": {
      description: "Configure at /developers/webhooks. Signed with X-SplitSMS-Signature (HMAC-SHA256).",
      events: [
        "message.sent",
        "message.delivered",
        "message.failed",
        "campaign.completed",
        "wallet.low_balance",
      ],
    },
    "x-sandbox": {
      otpVerifyCode: "123456",
      note: "Sandbox keys return success responses without live SMS delivery or credit charges.",
    },
    "x-sdk-install": {
      javascript: "npm install https://www.splitsms.com/sdk/javascript/splitsms-sdk.tgz",
      note: "@splitsms/sdk is NOT on npm registry — use hosted tarball URL",
    },
  };
}

export function buildLlmsTxt(siteUrl: string, apiBaseUrl: string): string {
  const base = siteUrl.replace(/\/$/, "");
  return `# SplitSMS

> Bulk SMS, OTP, and wallet API for Ghana, Nigeria, and 190+ countries. Operated by Tecunit.

## Docs for AI / vibe coding

- OpenAPI: ${base}/openapi.json
- API reference: ${base}/api-docs
- Developer portal: ${base}/developers
- Integration generator: ${base}/developers/generate
- AI prompt library: ${base}/developers/prompts
- Vibe coders landing: ${base}/vibe-coders
- SMS solutions hub: ${base}/solutions
- SMS Ghana: ${base}/solutions/sms
- mNotify alternative: ${base}/solutions/mnotify
- Infobip alternative: ${base}/solutions/infobip
- OTP SMS API: ${base}/solutions/otp
- WooCommerce SMS: ${base}/solutions/woocommerce-sms
- Paystack SMS: ${base}/solutions/paystack-sms
- SMS integration: ${base}/solutions/sms-integration
- SDK install: ${base}/sdk
- Postman: ${base}/developers/postman

## Authentication

All API requests: \`Authorization: Bearer YOUR_API_KEY\`
Base URL: ${apiBaseUrl}

Create keys at ${base}/developers/api-keys
Use sandbox keys (sk_test_) for safe development — no live SMS, no credit charges.
OTP sandbox verify code: 123456

## Core endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | /balance | Wallet + SMS credits |
| POST | /sms/send | Send SMS |
| POST | /otp/send | Send OTP |
| POST | /otp/verify | Verify OTP |
| GET | /reports | Delivery reports |
| POST | /connect/customers | Provision embedded customer |
| GET | /sender-ids | List sender IDs |

Full spec: ${base}/openapi.json

## JavaScript SDK

Install (NOT from npm registry):
\`\`\`bash
npm install ${base}/sdk/javascript/splitsms-sdk.tgz
\`\`\`

\`\`\`ts
import { SplitSMS } from "@splitsms/sdk";
const client = new SplitSMS({ apiKey: process.env.SPLITSMS_API_KEY!, baseUrl: "${base}" });
await client.messages.send({ sender: "MYBRAND", recipients: ["233201234567"], message: "Hello" });
\`\`\`

## WordPress

Official plugin v${wordpressPlugin.version}: ${base}/integrations/wordpress
Download: ${base}/wordpress-plugin/splitsms.zip
WooCommerce, WPForms, CF7, Elementor, JetFormBuilder, Crocoblock supported.

## Environment variables

SPLITSMS_API_KEY=sk_test_... or sk_live_...
SPLITSMS_BASE_URL=${base}

## Support

${base}/support
`;
}
