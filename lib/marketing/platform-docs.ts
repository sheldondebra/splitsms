export type DocBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; code: string; language?: string }
  | { type: "note"; title?: string; text: string };

export type DocSubsection = {
  id: string;
  title: string;
  blocks: DocBlock[];
};

export type DocChapter = {
  id: string;
  title: string;
  description: string;
  subsections: DocSubsection[];
};

export const platformDocsChapters: DocChapter[] = [
  {
    id: "getting-started",
    title: "Getting started",
    description: "Create an account, verify your phone, and send your first SMS.",
    subsections: [
      {
        id: "overview",
        title: "What is SplitSMS?",
        blocks: [
          {
            type: "p",
            text: "SplitSMS is a bulk and transactional SMS platform operated by Tecunit Ghana. You sign up with a phone number, fund a prepaid wallet, register sender IDs, and send SMS through the dashboard, REST API, or WordPress plugin to Ghana and 190+ countries.",
          },
          {
            type: "ul",
            items: [
              "Dashboard for campaigns, contacts, and delivery reports",
              "REST API v1 for developers and integrations",
              "Official WordPress plugin for WooCommerce and forms",
              "Pay-as-you-go pricing from GHS 0.029 per segment in Ghana",
              "5 free SMS credits on signup",
            ],
          },
        ],
      },
      {
        id: "signup",
        title: "Create your account",
        blocks: [
          {
            type: "ol",
            items: [
              "Go to splitsms.com/signup and enter your name, email, and phone number.",
              "Verify your phone with the 6-digit OTP sent by SMS.",
              "Set a password and log in to the dashboard.",
              "Your wallet starts with 5 free SMS credits for testing.",
            ],
          },
          {
            type: "note",
            title: "Login options",
            text: "You can log in with your email or phone number. Password login uses either identifier; OTP login accepts email or phone but always sends the code to your registered phone.",
          },
        ],
      },
      {
        id: "first-sms",
        title: "Send your first message",
        blocks: [
          {
            type: "ol",
            items: [
              "Open Dashboard → Send SMS.",
              "Enter one or more phone numbers (international format, e.g. 233201234567).",
              "Choose an approved Sender ID or request a new one under Sender IDs.",
              "Write your message — GSM-7 is 160 characters per segment; Unicode uses 70.",
              "Review the cost preview and click Send.",
            ],
          },
          {
            type: "p",
            text: "Delivery status appears in Dashboard → Transactions and Reports. Failed messages show the provider reason so you can fix balance, sender ID, or number format issues.",
          },
        ],
      },
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard guide",
    description: "Navigate the member dashboard and core workflows.",
    subsections: [
      {
        id: "navigation",
        title: "Main sections",
        blocks: [
          {
            type: "ul",
            items: [
              "Home — overview, wallet balance, recent activity, onboarding checklist",
              "Send SMS — quick single or multi-recipient send",
              "Campaigns — scheduled bulk sends to contact groups",
              "Contacts — import CSV, tags, groups, and segmentation",
              "Sender IDs — register alphanumeric sender names (carrier approval)",
              "Wallet — top up credits, view transactions and invoices",
              "Reports — delivery stats, filters, and export",
              "API Keys — create live and sandbox keys with permissions",
              "Integrations — WordPress connected sites and event logs",
              "Settings — profile, password, phone verification",
              "Support — tickets for logged-in users",
            ],
          },
        ],
      },
      {
        id: "wallet",
        title: "Wallet & billing",
        blocks: [
          {
            type: "p",
            text: "SplitSMS uses a prepaid wallet. Every sent SMS deducts credits based on destination country and message segments. Top up from Dashboard → Wallet using Paystack, Flutterwave, or MTN MoMo when enabled on your account.",
          },
          {
            type: "ul",
            items: [
              "Pending payments complete after the provider webhook confirms funds.",
              "Transaction history lists top-ups and SMS debits.",
              "Invoices are available for accounting and reseller accounts.",
              "Insufficient balance blocks sends until you top up.",
            ],
          },
        ],
      },
      {
        id: "sender-ids",
        title: "Sender IDs",
        blocks: [
          {
            type: "p",
            text: "Recipients see your Sender ID as the message origin (e.g. MYBRAND). Each ID is submitted for approval and may be pending, approved, or rejected depending on carrier rules in Ghana and other routes.",
          },
          {
            type: "ol",
            items: [
              "Request a Sender ID from Dashboard → Sender IDs.",
              "Wait for admin approval (typically 1–2 business days).",
              "Use only approved IDs in the dashboard, API, and WordPress plugin.",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "campaigns",
    title: "Campaigns & contacts",
    description: "Organize audiences and run bulk SMS campaigns.",
    subsections: [
      {
        id: "contacts",
        title: "Managing contacts",
        blocks: [
          {
            type: "p",
            text: "Contacts store phone numbers with optional name, email, country, and tags. Import a CSV with columns for phone, name, and email — invalid rows are reported before import.",
          },
          {
            type: "ul",
            items: [
              "Search and filter by name, phone, or tag",
              "Bulk tag, delete, or add to groups",
              "Export contacts as CSV for backup",
              "API: GET/POST /api/v1/contacts for programmatic sync",
            ],
          },
        ],
      },
      {
        id: "campaigns-run",
        title: "Running a campaign",
        blocks: [
          {
            type: "ol",
            items: [
              "Create a contact group and add members (or import first).",
              "Go to Campaigns → New campaign.",
              "Select the group, message, sender ID, and optional schedule time.",
              "Confirm segment count and estimated cost.",
              "Launch — messages queue and process in the background worker.",
            ],
          },
          {
            type: "p",
            text: "Campaign detail pages show sent, delivered, failed, and pending counts. You can retry failed recipients where the platform supports it.",
          },
        ],
      },
      {
        id: "personalization",
        title: "Message placeholders",
        blocks: [
          {
            type: "p",
            text: "In campaigns, use {name} and {phone} in the message body to personalize each recipient. Preview shows a sample substitution before send.",
          },
        ],
      },
    ],
  },
  {
    id: "api",
    title: "REST API",
    description: "Integrate SplitSMS into your application.",
    subsections: [
      {
        id: "api-overview",
        title: "Overview",
        blocks: [
          {
            type: "p",
            text: "All API requests use HTTPS and JSON. Authenticate with Authorization: Bearer YOUR_API_KEY. The production base URL is https://splitsms.com and the API prefix is /api/v1.",
          },
          {
            type: "note",
            text: "See the full interactive API reference at /api-docs including every endpoint, request body, and cURL example.",
          },
        ],
      },
      {
        id: "api-keys",
        title: "API keys & permissions",
        blocks: [
          {
            type: "ul",
            items: [
              "sk_live_… — production keys that send real SMS and charge credits",
              "sk_test_… — sandbox keys that validate requests without sending or billing",
              "sms.send — send SMS and OTP",
              "sms.read — read messages and delivery logs",
              "wallet.read — read balance and transactions",
              "contacts.read / contacts.write — manage contacts",
              "campaigns.read — read campaign status",
            ],
          },
          {
            type: "p",
            text: "Keys are shown only once at creation. Store them in environment variables, never in client-side code or public repositories.",
          },
        ],
      },
      {
        id: "api-send",
        title: "Send SMS via API",
        blocks: [
          {
            type: "code",
            language: "bash",
            code: `curl -X POST 'https://splitsms.com/api/v1/sms/send' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "sender": "MYBRAND",
    "recipients": ["233201234567"],
    "message": "Hello from SplitSMS"
  }'`,
          },
          {
            type: "p",
            text: "Responses include message IDs and status. Use GET /api/v1/messages or webhooks for delivery updates.",
          },
        ],
      },
      {
        id: "webhooks",
        title: "Webhooks",
        blocks: [
          {
            type: "p",
            text: "Register HTTPS endpoints in the developer portal to receive events when messages are sent, delivered, or fail. Payloads are signed with HMAC-SHA256 using your webhook secret — verify the signature before trusting the body.",
          },
          {
            type: "ul",
            items: [
              "Configure retry behaviour for failed webhook deliveries",
              "Use sandbox mode to test handlers without live SMS",
              "See /developers/webhooks in the dashboard for endpoint management",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "wordpress",
    title: "WordPress plugin",
    description: "Connect WooCommerce and forms to SplitSMS.",
    subsections: [
      {
        id: "wp-install",
        title: "Installation",
        blocks: [
          {
            type: "ol",
            items: [
              "Download splitsms.zip from splitsms.com/integrations/wordpress.",
              "If upgrading, deactivate and delete all splitsms / splitsms-1 folders under wp-content/plugins/ first.",
              "Plugins → Add New → Upload Plugin → choose splitsms.zip (keep the filename).",
              "Activate and open SplitSMS → Settings.",
              "Paste your API key, set Sender ID and admin phone, send a test SMS.",
            ],
          },
          {
            type: "note",
            title: "Plugin file not found?",
            text: "This error means WordPress extracted the zip into splitsms-1/splitsms/ because an old folder existed. Delete every splitsms* plugin folder and reinstall with a fresh zip from splitsms.com.",
          },
        ],
      },
      {
        id: "wp-woocommerce",
        title: "WooCommerce",
        blocks: [
          {
            type: "p",
            text: "Enable events under SplitSMS → Integrations: order placed, payment complete, processing, completed, cancelled. SMS goes to the order billing phone.",
          },
          {
            type: "p",
            text: "Templates support {customer_name}, {order_id}, {order_total}, {order_status}, {payment_method}, and {site_name}. Works with Paystack, Flutterwave, Stripe, and other WooCommerce gateways — SplitSMS listens to WooCommerce hooks, not the gateway directly.",
          },
        ],
      },
      {
        id: "wp-crocoblock",
        title: "Crocoblock (v1.2+)",
        blocks: [
          {
            type: "p",
            text: "JetEngine, JetFormBuilder, JetBooking, and JetAppointment each have a module under SplitSMS → Crocoblock. Map phone fields, write templates, and optionally set conditional JSON rules for status-based SMS.",
          },
          {
            type: "ul",
            items: [
              "JetBooking / JetAppointment reminders via WP-Cron",
              "Logs tagged by source in WordPress and your SplitSMS dashboard",
              "Requires SplitSMS plugin v1.2.0 or newer",
            ],
          },
        ],
      },
      {
        id: "wp-updates",
        title: "Updates",
        blocks: [
          {
            type: "p",
            text: "The plugin checks splitsms.com/api/plugin/update for new versions. When a release is available, WordPress shows it under Plugins → Updates like any other plugin.",
          },
        ],
      },
    ],
  },
  {
    id: "sdks",
    title: "SDKs",
    description: "Official client libraries.",
    subsections: [
      {
        id: "sdk-js",
        title: "JavaScript / TypeScript",
        blocks: [
          {
            type: "code",
            code: `npm install @splitsms/sdk

import { SplitSMS } from "@splitsms/sdk";

const client = new SplitSMS({
  apiKey: process.env.SPLITSMS_API_KEY,
  baseUrl: "https://splitsms.com",
});

await client.messages.send({
  sender: "MYBRAND",
  recipients: ["233201234567"],
  message: "Hello",
});`,
          },
        ],
      },
      {
        id: "sdk-other",
        title: "PHP & Flutter",
        blocks: [
          {
            type: "ul",
            items: [
              "PHP: composer require splitsms/sdk — see /sdk for examples",
              "Flutter: splitsms_flutter package for mobile apps",
              "All SDKs accept a custom baseUrl for staging or self-hosted testing",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    description: "Common issues and how to resolve them.",
    subsections: [
      {
        id: "delivery",
        title: "SMS not delivered",
        blocks: [
          {
            type: "ul",
            items: [
              "Check wallet balance — insufficient credits block sends",
              "Confirm Sender ID is approved for the destination country",
              "Use international format without + (e.g. 233201234567)",
              "Review Reports for provider failure codes",
              "Sandbox keys never deliver live SMS — switch to sk_live_ for production",
            ],
          },
        ],
      },
      {
        id: "api-errors",
        title: "API error codes",
        blocks: [
          {
            type: "ul",
            items: [
              "401 UNAUTHORIZED — missing or invalid API key",
              "403 FORBIDDEN — key lacks required permission (e.g. sms.send)",
              "402 PAYMENT_REQUIRED — wallet balance too low",
              "400 INVALID_REQUEST — validation failed; check JSON body",
              "429 TOO_MANY_REQUESTS — rate limit exceeded; backoff and retry",
            ],
          },
        ],
      },
      {
        id: "support",
        title: "Get help",
        blocks: [
          {
            type: "p",
            text: "Submit bugs, errors, billing questions, or integration issues at /support. Logged-in users can also open tickets under Dashboard → Help & support.",
          },
        ],
      },
    ],
  },
];

export const docsQuickLinks = [
  { href: "/api-docs", label: "API reference", desc: "Endpoints & cURL examples" },
  { href: "/sdk", label: "SDKs", desc: "JavaScript, PHP, Flutter" },
  { href: "/integrations", label: "Integrations", desc: "WordPress & payment gateways" },
  { href: "/changelog", label: "Changelog", desc: "Release history" },
  { href: "/support", label: "Support", desc: "Report bugs & get help" },
];
