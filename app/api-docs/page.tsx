import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PageHero } from "@/components/layout/page-hero";
import Link from "next/link";

const sections = [
  {
    title: "Authentication",
    body: `All API requests use Bearer token authentication.

\`\`\`
Authorization: Bearer sk_live_...
\`\`\`

Sandbox keys use the \`sk_test_\` prefix — no real SMS is sent and credits are not deducted.`,
  },
  {
    title: "POST /api/v1/messages/send",
    alias: "Alias: /api/v1/sms/send",
    body: `Permission: sms.send

\`\`\`json
{
  "sender": "SplitSMS",
  "recipients": ["+233201234567"],
  "message": "Hello {name}",
  "countryCode": "GH"
}
\`\`\`

\`\`\`json
{
  "success": true,
  "campaign_id": "…",
  "message_ids": ["…"],
  "queued": true,
  "sandbox": false,
  "recipients": 1
}
\`\`\``,
  },
  {
    title: "GET /api/v1/messages/:id",
    body: `Permission: sms.read — message status and delivery fields.`,
  },
  {
    title: "POST /api/v1/otp/send · POST /api/v1/otp/verify",
    body: `Permission: sms.send

Send: \`{ "phone": "+233…", "countryCode": "GH" }\`
Verify: \`{ "phone": "+233…", "code": "123456" }\`

Sandbox verify accepts code \`123456\`.`,
  },
  {
    title: "GET /api/v1/wallet/balance",
    alias: "Alias: /api/v1/balance",
    body: `Permission: wallet.read`,
  },
  {
    title: "GET /api/v1/wallet/transactions",
    body: `Permission: wallet.read — query \`?limit=50\``,
  },
  {
    title: "GET /api/v1/campaigns",
    body: `Permission: campaigns.read — optional \`?status=SCHEDULED&limit=50\``,
  },
  {
    title: "GET /api/v1/campaigns/:id",
    body: `Permission: campaigns.read — campaign detail + delivery stats.`,
  },
  {
    title: "GET /api/v1/campaigns/:id/messages",
    body: `Permission: sms.read — per-recipient logs.`,
  },
  {
    title: "GET/POST /api/v1/contacts",
    body: `Permissions: contacts.read / contacts.write

POST: \`{ "name", "phone", "email", "tags", "countryCode" }\`
PUT/DELETE /api/v1/contacts/:id`,
  },
  {
    title: "GET /api/v1/reports",
    body: `Permission: sms.read — recent message logs.`,
  },
  {
    title: "Webhooks",
    body: `Events: message.sent, message.delivered, message.failed, campaign.completed, wallet.low_balance

Signed with HMAC-SHA256 header \`X-SplitSMS-Signature\`. Retries: 1m → 5m → 30m → 2h.`,
  },
  {
    title: "Errors",
    body: `\`\`\`json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid phone number"
  }
}
\`\`\`

Codes: UNAUTHORIZED, FORBIDDEN, INVALID_REQUEST, NOT_FOUND, RATE_LIMITED, INSUFFICIENT_CREDITS`,
  },
  {
    title: "Rate limits",
    body: `Per API key (configurable at creation):
- Free: 10 req/min
- Standard: 100 req/min
- Enterprise: 1000 req/min

Response header: X-RateLimit-Remaining`,
  },
  {
    title: "Node.js SDK",
    body: `Starter SDK: sdk/javascript/

\`\`\`js
import { SplitSMSClient } from './sdk/javascript/index.js';
const client = new SplitSMSClient({ apiKey: process.env.SPLITSMS_KEY, baseUrl: 'https://your-app.com' });
await client.sendSms({ sender: 'SplitSMS', recipients: ['+233201234567'], message: 'Hi' });
\`\`\``,
  },
];

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <PageHero
        title="API Documentation"
        description="REST API v1 for SMS, OTP, wallet, campaigns, contacts, and webhooks."
      />
      <main className="mx-auto max-w-3xl px-4 py-16 space-y-10">
        <p className="font-sans text-sm text-muted-foreground">
          <Link href="/developers" className="text-primary hover:underline">
            Developer portal
          </Link>
          {" · "}
          <a href="/postman/splitsms.collection.json" className="text-primary hover:underline">
            Postman collection
          </a>
        </p>
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-sans font-semibold text-lg mb-1">{s.title}</h2>
            {s.alias && <p className="text-sm text-muted-foreground mb-2">{s.alias}</p>}
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap font-mono">
              {s.body}
            </pre>
          </section>
        ))}
      </main>
      <SiteFooter />
    </div>
  );
}
