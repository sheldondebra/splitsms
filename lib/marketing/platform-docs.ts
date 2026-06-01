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
  version: "2.1",
  lastUpdated: "2026-06-01",
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
          {
            type: "note",
            title: "Next: connect WordPress",
            text: "Install the official plugin from [Integrations → WordPress](/integrations/wordpress), create an API key under Developers → API Keys with sms.send permission, and paste it under SplitSMS → Settings in wp-admin. Your site appears under Dashboard → Integrations → WordPress.",
          },
        ],
      },
      {
        id: "wordpress-quick",
        title: "Connect WordPress (overview)",
        blocks: [
          {
            type: "ol",
            items: [
              "Download or install the plugin from the WordPress.org directory (search SplitSMS).",
              "In wp-admin, click **Create free account** if you signed up from the website already, skip to API key.",
              "Developers → API Keys — create key with **sms.send** and copy the full secret.",
              "SplitSMS → Settings — paste key, select Sender ID, Test connection → Save.",
              "SplitSMS → Forms or Integrations — enable the events you need.",
              "Monitor sends on splitsms.com Dashboard → Integrations → WordPress.",
            ],
          },
          {
            type: "p",
            text: "Full step-by-step instructions are in the [WordPress plugin](/docs#wordpress) chapter of this documentation.",
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
              "Integrations — WordPress connected sites, plugin/WP/PHP versions, skip logs, delivery sync",
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
      {
        id: "wordpress-dashboard",
        title: "WordPress integration",
        blocks: [
          {
            type: "p",
            text: "When a WordPress site saves a valid API key, it registers under **Dashboard → Integrations → WordPress**. You see each connected site URL, plugin version, WordPress and PHP versions, and recent SMS activity synced from the plugin.",
          },
          {
            type: "ul",
            items: [
              "Outdated plugin versions are flagged — update from wp-admin when a new release is available",
              "Skip logs explain why an SMS was not sent (no phone, disabled event, insufficient balance)",
              "Delivery status updates when the carrier confirms DLR (Sent → Delivered)",
              "Create API keys under Developers → API Keys — one key per site or environment is recommended",
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
        id: "wp-overview",
        title: "How it works",
        blocks: [
          {
            type: "p",
            text: "SplitSMS is a cloud SMS platform at splitsms.com. The WordPress plugin connects your site to your SplitSMS account using an API key. When an event happens (order placed, form submitted, user registered), the plugin builds a message from your template, sends it through the SplitSMS API, and logs the result in wp-admin and your SplitSMS dashboard.",
          },
          {
            type: "ol",
            items: [
              "Create a free account on splitsms.com — starter SMS credits included.",
              "Generate an API key (Developers → API Keys) with **sms.send** permission.",
              "Install the plugin on WordPress and paste the key under SplitSMS → Settings.",
              "Enable integrations (WooCommerce, WordPress core, Crocoblock) or configure per-form SMS.",
              "Messages debit your SplitSMS wallet; delivery status syncs back to SplitSMS → Logs and Dashboard → WordPress.",
            ],
          },
          {
            type: "note",
            title: "No custom code required",
            text: "Every feature is configured in the plugin admin — toggles, templates, form actions, and the Forms manager. You never need to add PHP hooks or edit theme files.",
          },
        ],
      },
      {
        id: "wp-install",
        title: "Installation",
        blocks: [
          {
            type: "ol",
            items: [
              `**WordPress.org:** Plugins → Add New → search “SplitSMS” → Install → Activate.`,
              `**Manual:** Download [SplitSMS-v${site.wordpressPlugin.version}.zip](${SITE_URL}/wordpress-plugin/SplitSMS-v${site.wordpressPlugin.version}.zip) from [Integrations → WordPress](/integrations/wordpress).`,
              "Plugins → Add New → Upload Plugin → choose the zip → Activate.",
              "If upgrading from an old manual install, deactivate and remove any splitsms* folders under wp-content/plugins/ first.",
              "Open **SplitSMS** in wp-admin. If you do not have an account yet, click **Create free account**.",
              "Paste your API key under **Settings** → Test connection → Save → send a test SMS on **Dashboard**.",
            ],
          },
          {
            type: "warning",
            title: "Plugin file not found?",
            text: "WordPress extracted the zip into a nested folder because an old version existed. Delete every splitsms* folder under wp-content/plugins/, then upload a fresh zip from splitsms.com. Or use **Replace from splitsms.com** on Settings when available.",
          },
        ],
      },
      {
        id: "wp-account",
        title: "Create account & API key",
        blocks: [
          {
            type: "p",
            text: "WordPress.org installs show **Create free account** links in the plugin sidebar, Settings page, Dashboard banner, and Plugins list. These open splitsms.com/signup with UTM tracking so you can return and paste your API key.",
          },
          {
            type: "ol",
            items: [
              "Sign up at splitsms.com — verify email and log in.",
              "Dashboard → Wallet — add credits or use starter balance.",
              "Dashboard → Sender IDs — register or select your sender name (required for most routes).",
              "Developers → API Keys → Create key — enable **sms.send** (and **sender_ids.read** for the sender picker).",
              "Copy the **full** key at creation (~56 characters). The dashboard only shows a prefix afterward.",
              "WordPress → SplitSMS → Settings — paste key, pick Sender ID, set admin phone → Test connection → Save.",
            ],
          },
          {
            type: "warning",
            title: "Partial API keys fail",
            text: "Pasting only the visible prefix (e.g. sk_test_99a064) causes not_configured errors. Always paste the complete secret from the creation screen.",
          },
        ],
      },
      {
        id: "wp-admin-menu",
        title: "Plugin admin menu",
        blocks: [
          {
            type: "table",
            headers: ["Page", "Purpose"],
            rows: [
              ["Dashboard", "Balance, send test SMS, activity stats, connection status, update alerts"],
              ["Settings", "API key, Sender ID, admin phone, country code, replace-from-cloud reinstall"],
              ["Forms", "Auto-detected forms — toggle SMS, phone field, message, admin copy per form"],
              ["Integrations", "WooCommerce events, WordPress core, CF7/WPForms/Elementor global toggles, Paystack tips"],
              ["Crocoblock", "JetEngine CPTs, JetBooking, JetAppointment templates and reminders"],
              ["Logs", "Every send, skip, and failure with delivery status (Sent → Delivered when DLR arrives)"],
              ["Help", "Quick start, update guide, and in-plugin documentation"],
            ],
          },
          {
            type: "p",
            text: "When connected, the top banner shows your SplitSMS account status, plugin version vs splitsms.com, WordPress version, and PHP version. Outdated plugin versions show an update notice.",
          },
        ],
      },
      {
        id: "wp-api-key",
        title: "API key & connection",
        blocks: [
          {
            type: "p",
            text: "The plugin stores your API key in WordPress options. On save, it validates against splitsms.com/account/status. Connected sites register with Dashboard → WordPress integration so you can monitor version and activity from the cloud.",
          },
          {
            type: "ul",
            items: [
              "Test connection before save — invalid keys are rejected",
              "Settings merge on plugin update — keys and templates are preserved",
              "Skip reasons (no phone, disabled event) sync to your SplitSMS dashboard",
              "Delivery status polls splitsms.com/messages/{id} — logs update from Sent to Delivered",
              "Local dev: API base URL auto-suggests http://127.0.0.1:3000 on .local sites when WP_DEBUG is on",
            ],
          },
        ],
      },
      {
        id: "wp-forms-manager",
        title: "Forms manager (no code)",
        blocks: [
          {
            type: "p",
            text: "**SplitSMS → Forms** scans your site for Contact Form 7, WPForms, Elementor Pro forms, JetFormBuilder, and JetEngine legacy forms. Each row shows the form title, plugin source, and controls to enable SMS without touching form builder code.",
          },
          {
            type: "ol",
            items: [
              "Open SplitSMS → Forms → **Refresh list** after adding new forms.",
              "Toggle **Send SMS** on for the form you want.",
              "Select the **phone field** from the dropdown (tel fields are auto-detected).",
              "Edit the **message template** — use {name}, {phone}, {form_title}, {site_name}, and field_* placeholders.",
              "Optional: enable **Admin copy** to SMS your admin phone on every submission.",
              "Save. Submit a test entry and check SplitSMS → Logs.",
            ],
          },
          {
            type: "note",
            title: "When to use Forms vs form actions",
            text: "Use the Forms manager for quick setup on CF7, WPForms, and global Elementor hooks. For JetFormBuilder, JetEngine, and Elementor Pro **Actions After Submit**, use the native actions below — they run per form in the builder and support macros like %phone%.",
          },
        ],
      },
      {
        id: "wp-form-actions",
        title: "Native form actions",
        blocks: [
          {
            type: "table",
            headers: ["Builder", "Where to add", "Action name"],
            rows: [
              [
                "JetFormBuilder",
                "Form → Post Submit Actions → Add Action",
                "**Send SMS** — phone field, message, admin copy, sender ID",
              ],
              [
                "JetEngine (legacy forms)",
                "JetEngine → Forms → Notifications → Add Notification",
                "**Send SMS** — same fields + %post_id%, %user_id% macros",
              ],
              [
                "Elementor Pro",
                "Form widget → Actions After Submit → Add Action",
                "**SplitSMS Notification** — phone, message, sender ID, admin copy",
              ],
            ],
          },
          {
            type: "p",
            text: "When a native action is configured on a form, the plugin skips duplicate global hooks for that submission. Macros: **%phone%** (submitted phone), **%post_id%** (current post), **%user_id%** (logged-in user). Message templates also support {field_name} placeholders from form data.",
          },
          {
            type: "ol",
            items: [
              "Connect API key first — actions show a connect notice until configured.",
              "Add the action in your form builder (not in SplitSMS admin).",
              "Pick the phone field from the dropdown populated from your form fields.",
              "Write your SMS template; test with a real submission.",
              "Check Logs — skip reasons explain missing phone or validation failures.",
            ],
          },
        ],
      },
      {
        id: "wp-forms",
        title: "Form plugins reference",
        blocks: [
          {
            type: "table",
            headers: ["Plugin", "Setup options", "Notes"],
            rows: [
              [
                "Contact Form 7",
                "Forms manager or Integrations toggle",
                "Tel field e.g. [tel* your-phone]; per-form ID filter; skip logs",
              ],
              [
                "WPForms",
                "Forms manager or Integrations toggle",
                "Phone field type or name; setup panel lists detected forms",
              ],
              [
                "Elementor Pro",
                "Forms manager, global hook, or Actions After Submit",
                "Tel field → Advanced → Field ID; **SplitSMS Notification** action recommended",
              ],
              [
                "JetFormBuilder",
                "Post Submit Action: **Send SMS**",
                "Per-form control; global auto-SMS skipped when action runs",
              ],
              [
                "JetEngine Forms",
                "Notification type: **Send SMS**",
                "Legacy JetEngine form builder; shared helper with JFB",
              ],
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
              "JetFormBuilder — native **Send SMS** in Post Submit Actions (recommended per-form control)",
              "JetEngine legacy forms — **Send SMS** notification type in form builder",
              "JetBooking / JetAppointment — reminder SMS via WP-Cron before check-in or appointment",
              "Per-module toggles work independently of the master Crocoblock switch",
              "Activity tagged by source in WordPress logs and your SplitSMS dashboard",
            ],
          },
        ],
      },
      {
        id: "wp-connected-sites",
        title: "SplitSMS dashboard connection",
        blocks: [
          {
            type: "p",
            text: "When your API key is saved, the plugin registers your site with splitsms.com. Open **Dashboard → Integrations → WordPress** to see connected sites, plugin version, WordPress/PHP versions, recent activity, and skip logs.",
          },
          {
            type: "ul",
            items: [
              "Outdated plugin versions are flagged so you know when to update",
              "Cloud log sync sends send/skip/fail events to your SplitSMS account",
              "Delivery status updates appear in both WordPress Logs and the dashboard",
              "Disconnect by removing the API key in WordPress Settings",
            ],
          },
        ],
      },
      {
        id: "wp-updates",
        title: "Plugin updates & troubleshooting",
        blocks: [
          {
            type: "ol",
            items: [
              "**WordPress.org:** Dashboard → Updates → Update SplitSMS when available.",
              "**Manual:** Download latest zip from [Integrations → WordPress](/integrations/wordpress) → Plugins → Add New → Upload.",
              "Settings → **Replace from splitsms.com** — reinstall in place when upload says folder exists.",
              "API keys, templates, and toggles are preserved when you update.",
            ],
          },
          {
            type: "table",
            headers: ["Problem", "Fix"],
            rows: [
              ["Plugin file not found", "Delete all splitsms* folders under wp-content/plugins/, re-upload zip"],
              ["Could not move to upgrade-temp-backup", "Use Replace from splitsms.com or manual upload; host may block WP updater"],
              ["not_configured / invalid key", "Paste full ~56-char API key; test connection on Settings"],
              ["No SMS sent", "Check Logs skip reason; verify phone field and event toggle enabled"],
              ["Sent but not Delivered", "Wait for carrier DLR; check wallet balance and sender ID approval"],
            ],
          },
          {
            type: "p",
            text: "See [Changelog](/changelog) for release notes. Plugin Help page in wp-admin mirrors this guide.",
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
