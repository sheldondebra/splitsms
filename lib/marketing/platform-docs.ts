import site from "@/config/site.json";

const SITE_URL = site.siteUrl.replace(/\/$/, "");
const API_V1_URL = `${SITE_URL}${site.apiPathPrefix}`;

export type DocBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "code"; code: string; language?: string }
  | { type: "note"; title?: string; text: string }
  | { type: "warning"; title?: string; text: string }
  | { type: "table"; headers: string[]; rows: string[][] };

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

export const docsMeta = {
  version: "2.0",
  lastUpdated: "2026-05-31",
  maintainer: "Tecunit",
  wordpressPluginVersion: site.wordpressPlugin.version,
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
            text: "SplitSMS is an enterprise-grade bulk and transactional SMS platform operated by Tecunit. Businesses use it for marketing campaigns, OTP verification, order notifications, and API-driven messaging across Ghana, Nigeria, and 190+ countries — with transparent pay-as-you-go pricing and no annual contracts.",
          },
          {
            type: "table",
            headers: ["Capability", "Description"],
            rows: [
              ["Dashboard", "Campaigns, contacts, sender IDs, wallet, reports, and support"],
              ["REST API v1", "Send SMS, OTP, contacts, campaigns, webhooks, WordPress sync"],
              ["WordPress plugin", `WooCommerce, CF7, WPForms, Elementor Pro, Crocoblock / JetEngine (v${site.wordpressPlugin.version})`],
              ["Routing", "Infobip, Twilio, and mNotify with automatic failover"],
              ["Billing", "Prepaid wallet — Paystack, Flutterwave, MoMo, Stripe where enabled"],
            ],
          },
          {
            type: "note",
            title: "Who this documentation is for",
            text: "Account owners and marketers should start with Getting started and Dashboard guide. Developers should read REST API and SDKs. WordPress site owners should read the WordPress plugin chapter.",
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
          {
            type: "warning",
            title: "Keep your phone number verified",
            text: "OTP login and security alerts are sent to your registered mobile number. Update it under Dashboard → Settings if you change phones.",
          },
        ],
      },
      {
        id: "pricing-model",
        title: "Pricing & credits",
        blocks: [
          {
            type: "p",
            text: "SplitSMS bills per SMS segment based on destination country and encoding (GSM-7 vs Unicode). Ghana rates start around GHS 0.029 per segment. View live rates on the [Pricing page](/pricing) or Dashboard → Pricing.",
          },
          {
            type: "ul",
            items: [
              "Wallet holds funds in your account currency (typically GHS)",
              "SMS credits are purchased from wallet balance at country-specific rates",
              "Each send deducts credits before the message is queued",
              "New accounts receive 5 free SMS credits for testing delivery",
            ],
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
            text: "Delivery status appears in Dashboard → Message results and Transactions. Failed messages show the provider reason so you can fix balance, sender ID, or number format issues.",
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
    id: "messaging",
    title: "Messaging standards",
    description: "Phone formats, encoding, segments, and delivery lifecycle.",
    subsections: [
      {
        id: "phone-format",
        title: "Phone number format",
        blocks: [
          {
            type: "p",
            text: "Always use international format without the plus sign. Ghana numbers start with 233 followed by 9 digits (e.g. 233201234567). Nigeria uses 234. The platform validates and normalizes numbers before routing.",
          },
          {
            type: "table",
            headers: ["Country", "Example", "Notes"],
            rows: [
              ["Ghana", "233201234567", "Drop leading 0 from local 020… numbers"],
              ["Nigeria", "2348012345678", "Include full national number after 234"],
              ["International", "441234567890", "Use country code + subscriber number"],
            ],
          },
        ],
      },
      {
        id: "encoding",
        title: "Encoding & segments",
        blocks: [
          {
            type: "table",
            headers: ["Encoding", "Chars / segment", "When used"],
            rows: [
              ["GSM-7", "160 (153 for multi-part)", "Standard Latin letters and basic symbols"],
              ["Unicode (UCS-2)", "70 (67 for multi-part)", "Emojis, Arabic, extended accents"],
            ],
          },
          {
            type: "p",
            text: "Long messages are split into multiple billable segments. The Send SMS screen and API responses show segment count before you confirm. Unicode in a single word switches the entire message to UCS-2.",
          },
        ],
      },
      {
        id: "delivery-states",
        title: "Delivery lifecycle",
        blocks: [
          {
            type: "ul",
            items: [
              "Queued — accepted by SplitSMS, awaiting worker dispatch",
              "Sent — handed to upstream carrier",
              "Delivered — handset or carrier confirmed delivery (where supported)",
              "Failed — rejected or expired; reason shown in reports",
              "Pending — in transit; may update via webhook or polling",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "api",
    title: "REST API",
    description: "Production HTTPS JSON API for developers and integrations.",
    subsections: [
      {
        id: "api-overview",
        title: "Overview",
        blocks: [
          {
            type: "p",
            text: `All requests use HTTPS and JSON. Authenticate with Authorization: Bearer YOUR_API_KEY. Production API base: ${API_V1_URL}. See the full [API reference](/api-docs) for every endpoint, schema, and cURL example.`,
          },
          {
            type: "table",
            headers: ["Header", "Value"],
            rows: [
              ["Authorization", "Bearer sk_live_… or sk_test_…"],
              ["Content-Type", "application/json"],
              ["Accept", "application/json"],
            ],
          },
        ],
      },
      {
        id: "api-keys",
        title: "API keys & permissions",
        blocks: [
          {
            type: "table",
            headers: ["Permission", "Allows"],
            rows: [
              ["sms.send", "POST /sms/send, OTP send/verify"],
              ["sms.read", "GET messages, reports, logs"],
              ["wallet.read", "GET balance and transactions"],
              ["contacts.read", "List and search contacts"],
              ["contacts.write", "Create, update, import contacts"],
              ["campaigns.read", "Read campaign status and stats"],
            ],
          },
          {
            type: "warning",
            title: "Key security",
            text: "API keys are shown only once at creation (~56 characters). Store in server-side environment variables. Never commit keys to Git, expose in browser JavaScript, or paste into WordPress page content.",
          },
        ],
      },
      {
        id: "api-send",
        title: "Send SMS",
        blocks: [
          {
            type: "code",
            language: "bash",
            code: `curl -X POST '${API_V1_URL}/sms/send' \\
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
            text: "Successful responses include message IDs and initial status. Poll GET /api/v1/messages or configure webhooks for delivery updates.",
          },
        ],
      },
      {
        id: "api-otp",
        title: "OTP verification",
        blocks: [
          {
            type: "ol",
            items: [
              "POST /api/v1/otp/send — sends a one-time code to the recipient",
              "Store the returned reference server-side",
              "POST /api/v1/otp/verify — submit the code the user entered",
              "Use sk_test_ keys in development to validate without billing",
            ],
          },
        ],
      },
      {
        id: "webhooks",
        title: "Webhooks",
        blocks: [
          {
            type: "p",
            text: "Register HTTPS endpoints under [Developers → Webhooks](/developers/webhooks). Payloads include event type, message ID, status, and timestamp. Each request is signed with HMAC-SHA256 using your webhook secret.",
          },
          {
            type: "code",
            language: "javascript",
            code: `// Verify X-SplitSMS-Signature (pseudocode)
const crypto = require("crypto");
const expected = crypto
  .createHmac("sha256", WEBHOOK_SECRET)
  .update(rawBody)
  .digest("hex");
if (expected !== signature) throw new Error("Invalid signature");`,
          },
        ],
      },
    ],
  },
  {
    id: "wordpress",
    title: "WordPress plugin",
    description: `Official plugin (v${site.wordpressPlugin.version}) for WooCommerce, forms, WordPress core, and Crocoblock.`,
    subsections: [
      {
        id: "wp-install",
        title: "Installation",
        blocks: [
          {
            type: "ol",
            items: [
              `Download splitsms.zip (v${site.wordpressPlugin.version}) from [Integrations → WordPress](/integrations/wordpress).`,
              "If upgrading, deactivate and remove old splitsms* folders under wp-content/plugins/ first.",
              "Plugins → Add New → Upload Plugin → choose the zip → Activate.",
              "Open the **SplitSMS** menu in wp-admin → **Settings** — paste your full API key (~56 chars), Sender ID, and admin phone.",
              "Click Test connection, then Save. Send a test SMS to confirm delivery.",
            ],
          },
          {
            type: "warning",
            title: "Plugin file not found?",
            text: "WordPress extracted the zip into a nested folder because an old version existed. Delete every splitsms* folder under wp-content/plugins/, then upload a fresh zip from splitsms.com.",
          },
        ],
      },
      {
        id: "wp-api-key",
        title: "API key & connection",
        blocks: [
          {
            type: "p",
            text: "Create a live API key under Dashboard → App connections with **sms.send** permission. Copy the entire key at creation — the dashboard only shows a prefix afterward. Partial keys (e.g. sk_test_99a064) will fail with not_configured errors.",
          },
          {
            type: "ul",
            items: [
              "Test connection before save — invalid keys are rejected",
              "Settings merge on plugin update — keys and templates are preserved",
              "Connected sites appear in Dashboard → WordPress integration",
              "Skip reasons (no phone, disabled event) sync to your SplitSMS dashboard",
              "Local dev: use http://127.0.0.1:3000 when running npm run dev on Local WP",
            ],
          },
        ],
      },
      {
        id: "wp-core",
        title: "WordPress core",
        blocks: [
          {
            type: "p",
            text: "Under **SplitSMS → Integrations → WordPress core**, enable welcome SMS on user registration and optional password reset via SMS.",
          },
          {
            type: "ul",
            items: [
              "Phone is read from user meta **billing_phone** or **splitsms_phone**",
              "Password reset SMS replaces the email when a phone exists; otherwise WordPress email is kept",
              "Templates support {site_name}, {customer_name}, {reset_link}",
            ],
          },
        ],
      },
      {
        id: "wp-woocommerce",
        title: "WooCommerce",
        blocks: [
          {
            type: "p",
            text: "Enable events under SplitSMS → Integrations. SMS is sent to billing phone, then shipping phone, custom order meta, or user meta if billing is empty. HPOS (custom order tables) and block checkout are supported.",
          },
          {
            type: "ul",
            items: [
              "Events: order placed, payment complete, paid → processing, processing, completed, cancelled, failed, refunded, shipped (tracking)",
              "Paystack / Flutterwave / Stripe — SMS fires when WooCommerce marks the order paid (no direct gateway API)",
              "COD/BACS payment SMS only when the order is marked paid",
            ],
          },
          {
            type: "table",
            headers: ["Placeholder", "Replaced with"],
            rows: [
              ["{customer_name}", "Billing first + last name"],
              ["{order_id}", "WooCommerce order number"],
              ["{order_total}", "Formatted order total"],
              ["{order_status}", "Current order status"],
              ["{payment_method}", "Gateway title"],
              ["{paystack_reference}", "Paystack transaction reference (when available)"],
              ["{tracking_number}", "Shipping tracking number"],
              ["{refund_amount}", "Refund total on refunded orders"],
              ["{site_name}", "WordPress site name"],
            ],
          },
          {
            type: "note",
            title: "No SMS on order?",
            text: "Check SplitSMS → Logs for skip reasons (e.g. no_billing_phone). Ensure checkout collects a phone number or set a custom phone meta key under Integrations.",
          },
        ],
      },
      {
        id: "wp-forms",
        title: "Form plugins",
        blocks: [
          {
            type: "table",
            headers: ["Plugin", "Hook / action", "Setup"],
            rows: [
              [
                "Contact Form 7",
                "wpcf7_submit (mail_sent; optional mail_failed)",
                "Tel field e.g. [tel* your-phone]; per-form IDs; skip logs",
              ],
              [
                "WPForms",
                "wpforms_process_complete",
                "Phone field type or name; per-form IDs; setup panel lists forms",
              ],
              [
                "Elementor Pro",
                "elementor_pro/forms/new_record",
                "Tel field → Advanced → Field ID; per-form name filter",
              ],
              [
                "JetFormBuilder",
                "Post Submit Action: Send SMS (SplitSMS)",
                "Add action per form, or enable global auto-SMS under Crocoblock",
              ],
            ],
          },
          {
            type: "p",
            text: "All form integrations support custom message templates with placeholders like {name}, {phone}, {form_title}, and {site_name}.",
          },
        ],
      },
      {
        id: "wp-crocoblock",
        title: "Crocoblock",
        blocks: [
          {
            type: "p",
            text: "JetEngine, JetFormBuilder, JetBooking, and JetAppointment modules live under **SplitSMS → Crocoblock**. Map phone fields, edit every event template, and use optional conditional rules (JSON) for status-based SMS.",
          },
          {
            type: "ul",
            items: [
              "JetFormBuilder — native **Send SMS (SplitSMS)** in Post Submit Actions (recommended per-form control)",
              "JetBooking / JetAppointment — reminder SMS via WP-Cron before check-in or appointment",
              "Per-module toggles work independently of the master Crocoblock switch",
              "Activity tagged by source in WordPress logs and your SplitSMS dashboard",
              `Requires plugin v1.2.0+; current release v${site.wordpressPlugin.version}`,
            ],
          },
        ],
      },
      {
        id: "wp-updates",
        title: "Plugin updates",
        blocks: [
          {
            type: "ol",
            items: [
              "WordPress Admin → Dashboard → Updates → Update SplitSMS",
              "Or Plugins → Installed Plugins → Check for updates",
              `Manifest: ${SITE_URL}/api/plugin/update`,
              `Manual fallback: download splitsms-${site.wordpressPlugin.version}.zip from ${SITE_URL}/wordpress-plugin/`,
            ],
          },
          {
            type: "p",
            text: "API keys, templates, and toggles are preserved when you update. See [Changelog](/changelog) for release notes and [Dashboard → WordPress](/dashboard/integrations/wordpress) for connected site stats.",
          },
        ],
      },
    ],
  },
  {
    id: "security",
    title: "Security & compliance",
    description: "Protect credentials, respect recipients, and meet regulatory expectations.",
    subsections: [
      {
        id: "credentials",
        title: "Credential hygiene",
        blocks: [
          {
            type: "ul",
            items: [
              "Rotate API keys immediately if exposed — revoke old keys in App connections",
              "Use separate keys per environment (production vs staging)",
              "Restrict key permissions to the minimum required scope",
              "Enable webhook signature verification on every endpoint",
            ],
          },
        ],
      },
      {
        id: "compliance",
        title: "Responsible messaging",
        blocks: [
          {
            type: "p",
            text: "Obtain consent before promotional SMS. Include opt-out instructions where required by local law. Transactional messages (OTP, order updates) should clearly identify your brand via an approved Sender ID.",
          },
          {
            type: "p",
            text: "Read our [Privacy Policy](/privacy), [Terms](/terms), and [Data Protection](/data-protection) pages for how Tecunit processes account and message metadata.",
          },
        ],
      },
    ],
  },
  {
    id: "sdks",
    title: "SDKs",
    description: "Official client libraries for popular languages.",
    subsections: [
      {
        id: "sdk-js",
        title: "JavaScript / TypeScript",
        blocks: [
          {
            type: "code",
            language: "typescript",
            code: `npm install ${SITE_URL}/sdk/javascript/splitsms-sdk.tgz

import { SplitSMS } from "@splitsms/sdk";

const client = new SplitSMS({
  apiKey: process.env.SPLITSMS_API_KEY!,
  baseUrl: "${SITE_URL}",
});

await client.messages.send({
  sender: "MYBRAND",
  recipients: ["233201234567"],
  message: "Hello from SplitSMS",
});

await client.connect.createCustomer({
  full_name: "Jane Doe",
  phone: "233201234567",
  country_code: "GH",
  external_ref: "user-42",
});`,
          },
        ],
      },
      {
        id: "sdk-other",
        title: "PHP, Flutter & Postman",
        blocks: [
          {
            type: "ul",
            items: [
              `PHP: composer config repositories.splitsms composer ${SITE_URL}/sdk/php/ then composer require splitsms/sdk`,
              `Flutter: download ${SITE_URL}/sdk/flutter/splitsms-flutter.zip — path dependency (see [SDK page](/sdk))`,
              "Postman: import the collection from Developers → Postman",
              "Install manifest: /sdk/manifest.json — all packages hosted on SplitSMS",
            ],
          },
        ],
      },
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    description: "Diagnose delivery, API, and WordPress issues quickly.",
    subsections: [
      {
        id: "delivery",
        title: "SMS not delivered",
        blocks: [
          {
            type: "table",
            headers: ["Symptom", "Likely cause", "Action"],
            rows: [
              ["Immediate failure", "Insufficient SMS credits", "Top up wallet → buy credits"],
              ["Invalid number", "Wrong format", "Use 233… not 020… or +233…"],
              ["Sender rejected", "ID not approved", "Wait for approval or use approved ID"],
              ["Sandbox key", "sk_test_ used in production", "Switch to sk_live_ key"],
              ["Pending forever", "Carrier delay", "Check reports; retry if failed"],
            ],
          },
        ],
      },
      {
        id: "api-errors",
        title: "API error codes",
        blocks: [
          {
            type: "table",
            headers: ["HTTP", "Code", "Meaning"],
            rows: [
              ["401", "UNAUTHORIZED", "Missing, truncated, or revoked API key"],
              ["403", "FORBIDDEN", "Key lacks permission (e.g. sms.send)"],
              ["402", "PAYMENT_REQUIRED", "Wallet or SMS credits too low"],
              ["400", "INVALID_REQUEST", "Validation failed — check JSON schema"],
              ["429", "TOO_MANY_REQUESTS", "Rate limit — exponential backoff"],
              ["500", "INTERNAL_ERROR", "Retry once; contact support if persistent"],
            ],
          },
        ],
      },
      {
        id: "wp-troubleshoot",
        title: "WordPress plugin",
        blocks: [
          {
            type: "ul",
            items: [
              "not_configured — paste full API key (~56 chars), not prefix only",
              "no_billing_phone — add phone to checkout or custom meta key",
              "wc_*_skipped / cf7_*_skipped — event disabled or phone missing; synced to dashboard",
              "JetFormBuilder action missing — add Send SMS (SplitSMS) under Post Submit Actions",
              "Connection test fails — check SSL, firewall, and splitsms.com reachability",
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
            text: "Report bugs, billing issues, or integration problems at [Support](/support). Logged-in users can open tickets under Dashboard → Help & support. Include message IDs, API request IDs, and WordPress log entries when possible.",
          },
        ],
      },
    ],
  },
];

export const docsQuickLinks = [
  { href: "/docs/api", label: "REST API", desc: "Authentication, SMS, wallet, webhooks" },
  { href: "/docs/connect", label: "Connect", desc: "Embedded customers & partner APIs" },
  { href: "/api-docs", label: "API reference", desc: "Interactive endpoints & cURL" },
  { href: "/docs/sdk", label: "SDKs", desc: "JavaScript, PHP, Flutter" },
  { href: "/docs/mobile", label: "Mobile", desc: "Flutter app integration" },
  { href: "/integrations/wordpress", label: "WordPress", desc: "Plugin setup & WooCommerce" },
  { href: "/changelog", label: "Changelog", desc: "Platform & plugin releases" },
  { href: "/support", label: "Support", desc: "Contact Tecunit" },
];
