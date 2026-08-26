import { getApiV1Url, wordpressPlugin } from "@/lib/site-config";
import { siteUrl } from "@/lib/seo/site";

export type HowToCategoryId =
  | "start"
  | "features"
  | "wordpress"
  | "reports"
  | "smart-forms"
  | "google"
  | "api"
  | "billing";

export type HowToLevel = "beginner" | "intermediate" | "advanced";

export type HowToStep = {
  title: string;
  body: string;
};

export type HowToRelated = {
  href: string;
  label: string;
};

export type HowToGuide = {
  id: string;
  category: HowToCategoryId;
  title: string;
  summary: string;
  minutes: number;
  level: HowToLevel;
  audience: string;
  steps: HowToStep[];
  notes?: string[];
  related: HowToRelated[];
  keywords: string;
};

export const howToCategories: { id: HowToCategoryId; label: string; blurb: string }[] = [
  {
    id: "start",
    label: "Getting started",
    blurb: "Account, Sender ID, and your first message.",
  },
  {
    id: "features",
    label: "Features",
    blurb: "Send SMS, contacts, campaigns, templates.",
  },
  {
    id: "wordpress",
    label: "WordPress",
    blurb: "Plugin, WooCommerce, forms, Crocoblock.",
  },
  {
    id: "reports",
    label: "Reports",
    blurb: "Delivery, spend, logins, and exports.",
  },
  {
    id: "smart-forms",
    label: "Smart Forms",
    blurb: "Build, SMS, share, and review responses.",
  },
  {
    id: "google",
    label: "Google",
    blurb: "Contacts, Sheets, Forms, and Drive.",
  },
  {
    id: "api",
    label: "API",
    blurb: "Keys, send, OTP, and webhooks.",
  },
  {
    id: "billing",
    label: "Wallet",
    blurb: "Credits, top-ups, invoices.",
  },
];

export const howToLevels: { id: HowToLevel; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

const apiV1 = getApiV1Url();

export const howToGuides: HowToGuide[] = [
  {
    id: "create-account",
    category: "start",
    title: "Create an account and send your first SMS",
    summary:
      "Sign up, claim starter credits, pick a Sender ID, and send a test to your own phone.",
    minutes: 8,
    level: "beginner",
    audience: "Anyone starting SplitSMS",
    keywords: "signup register first sms free credits get started",
    steps: [
      {
        title: "Create the account",
        body: "Open Sign up, enter your name, email, and password. Confirm the email if asked. New accounts include 5 free credits — enough to send a test without a card.",
      },
      {
        title: "Verify your phone",
        body: "Open Dashboard → Settings and complete phone verification when prompted. A verified number is required before branded sends on most Ghana routes.",
      },
      {
        title: "Request a Sender ID",
        body: "Open Dashboard → Sender ID and submit the name recipients should see (for example MYSHOP). Approval is typically 1–2 business days. Until then, use an approved ID if one is already on the account.",
      },
      {
        title: "Send a test",
        body: "Open Dashboard → Send SMS. Enter your number in international format without a plus (Ghana: 233201234567). Write a short message, confirm segments and cost, then send. Check Message results for Queued → Sent → Delivered.",
      },
    ],
    notes: [
      "Drop the leading 0 from local Ghana numbers. 020… becomes 23320…",
      "Emoji or special characters switch the whole message to Unicode (70 characters per segment instead of 160).",
    ],
    related: [
      { href: "/signup", label: "Sign up" },
      { href: "/docs", label: "Platform docs" },
      { href: "/pricing", label: "SMS pricing" },
    ],
  },
  {
    id: "register-sender-id",
    category: "start",
    title: "Register and use a Sender ID",
    summary:
      "How branded names get approved, what to wait for, and where the ID is used.",
    minutes: 5,
    level: "beginner",
    audience: "Anyone sending branded SMS",
    keywords: "sender id alphanumeric brand name approval pending",
    steps: [
      {
        title: "Choose a name",
        body: "Pick a short brand name recipients will recognise. Avoid impersonating banks, networks, or government. Most routes expect letters (sometimes digits) within carrier length limits.",
      },
      {
        title: "Submit from the dashboard",
        body: "Go to Dashboard → Sender ID → request a new ID. Status will show pending until an admin reviews it.",
      },
      {
        title: "Wait for approval",
        body: "Typical review is 1–2 business days. Rejected IDs include a reason — fix the name and resubmit rather than sending from an unapproved ID.",
      },
      {
        title: "Use only approved IDs",
        body: "Select the approved Sender ID in Send SMS, campaigns, Smart Forms, WordPress, Google Forms SMS, and the API sender field. Unapproved IDs are blocked on routes that require registration.",
      },
    ],
    notes: [
      "If checkout or OTP SMS is silent after setup, check Sender ID status before blaming the plugin or API key.",
    ],
    related: [
      { href: "/support?topic=sender-id", label: "Sender ID support" },
      { href: "/docs#sender-ids", label: "Sender ID docs" },
    ],
  },
  {
    id: "send-sms",
    category: "features",
    title: "Send a one-off SMS",
    summary:
      "Quick send for one number or a pasted list — cost preview, encoding, and delivery states.",
    minutes: 6,
    level: "beginner",
    audience: "Dashboard users",
    keywords: "send sms quick message recipients cost preview segments",
    steps: [
      {
        title: "Open Send SMS",
        body: "From the dashboard sidebar choose Send SMS. This is the fastest path for a single alert or a small pasted list. Use Campaigns when you already have a saved group.",
      },
      {
        title: "Add recipients",
        body: "Type or paste numbers in international format without +. You can also pick from Contacts. Invalid rows are flagged before you pay.",
      },
      {
        title: "Write the message",
        body: "Choose an approved Sender ID. Watch the segment count and estimated credit cost as you type. GSM-7 is 160 characters per segment; Unicode is 70.",
      },
      {
        title: "Confirm and track",
        body: "Send. Open Message results to filter by status. Queued means accepted, Sent means handed to the carrier, Delivered means the handset or network confirmed (where the route supports DLR).",
      },
    ],
    related: [
      { href: "/dashboard/send", label: "Send SMS" },
      { href: "/features", label: "SMS features" },
      { href: "/how-to/message-results", label: "How to read results" },
    ],
  },
  {
    id: "import-contacts",
    category: "features",
    title: "Import contacts and build groups",
    summary:
      "CSV import, tags, groups, and when to pull numbers from Google instead.",
    minutes: 8,
    level: "beginner",
    audience: "Anyone with a list",
    keywords: "csv contacts groups tags import audience",
    steps: [
      {
        title: "Prepare a CSV",
        body: "Include a phone column. Name and email are optional. Ghana numbers should be 233… without a plus. Save as CSV UTF-8 if names include accents.",
      },
      {
        title: "Import",
        body: "Open Dashboard → Contacts → Import. Map phone (and name) columns. Invalid rows are reported so you can fix them before they enter the list.",
      },
      {
        title: "Tag and group",
        body: "Use tags for filters (vip, staff, unpaid). Create a group and add members for campaigns. You can bulk-tag, delete, or export a CSV backup.",
      },
      {
        title: "Or pull from Google",
        body: "If the list already lives in Google Contacts or a Sheet, connect Google and import from there instead of downloading a CSV.",
      },
    ],
    related: [
      { href: "/how-to/google-contacts", label: "Google Contacts" },
      { href: "/how-to/google-sheets", label: "Sheets & Drive" },
      { href: "/docs#contacts", label: "Contacts docs" },
    ],
  },
  {
    id: "run-campaign",
    category: "features",
    title: "Run a bulk SMS campaign",
    summary:
      "Group, message, schedule, cost check, then launch into the background queue.",
    minutes: 10,
    level: "intermediate",
    audience: "Marketing and operations",
    keywords: "campaign bulk schedule group launch queue",
    steps: [
      {
        title: "Create or pick a group",
        body: "Campaigns send to a saved group, not a one-off paste. Import contacts first, then add them to a group under Contacts.",
      },
      {
        title: "Start a new campaign",
        body: "Open Dashboard → Campaigns → New campaign. Choose the group, Sender ID, and message. Optional: set a schedule time in your account timezone.",
      },
      {
        title: "Confirm cost",
        body: "Review recipient count, segments, and estimated credits. Insufficient wallet balance blocks the launch until you top up.",
      },
      {
        title: "Launch and watch",
        body: "Launch. The worker queues messages in the background. The campaign page shows sent, delivered, failed, and pending. Retry failed recipients where the platform offers it.",
      },
    ],
    notes: [
      "Promotional campaigns need consent. Transactional alerts (orders, OTPs) should still use an approved Sender ID.",
    ],
    related: [
      { href: "/dashboard/campaigns", label: "Campaigns" },
      { href: "/how-to/personalize-messages", label: "Personalize messages" },
      { href: "/how-to/wallet-topup", label: "Top up wallet" },
    ],
  },
  {
    id: "personalize-messages",
    category: "features",
    title: "Personalize messages with merge tags",
    summary: "Use {name} and {phone} in campaigns, plus form placeholders in WordPress and Smart Forms.",
    minutes: 5,
    level: "beginner",
    audience: "Campaigns and forms",
    keywords: "merge tags placeholders personalize {name} template",
    steps: [
      {
        title: "Campaigns",
        body: "In the campaign editor, insert {name} and {phone}. Preview shows a sample substitution. Recipients without a name still get the SMS — the tag is left blank or skipped depending on the field.",
      },
      {
        title: "Saved templates",
        body: "Open Dashboard → Templates to store reusable copy. Templates keep your Sender ID workflow consistent across Send SMS and campaigns.",
      },
      {
        title: "WordPress and forms",
        body: "WordPress templates use {customer_name}, {order_id}, {order_total}, and form field placeholders. Smart Forms SMS can include submitted field values in the confirmation.",
      },
    ],
    related: [
      { href: "/dashboard/templates", label: "Templates" },
      { href: "/how-to/wordpress-woocommerce", label: "WooCommerce placeholders" },
      { href: "/how-to/smart-forms-sms", label: "Smart Forms SMS" },
    ],
  },
  {
    id: "wordpress-install",
    category: "wordpress",
    title: "Install and connect the WordPress plugin",
    summary: `Install SplitSMS v${wordpressPlugin.version}, paste a full API key, pick a Sender ID, and send a test.`,
    minutes: 12,
    level: "beginner",
    audience: "WordPress site owners",
    keywords: "wordpress plugin install api key wp-admin woocommerce",
    steps: [
      {
        title: "Create the SplitSMS account first",
        body: "Sign up on splitsms.com, add wallet credits, and request a Sender ID. The plugin does not send until the cloud account has an approved sender and balance.",
      },
      {
        title: "Create an API key",
        body: "Open Developers → API Keys (or Dashboard → App connections). Create a key with sms.send (and sender_ids.read so the plugin can list senders). Copy the full ~56-character secret immediately — the dashboard only shows a prefix later.",
      },
      {
        title: "Install the plugin",
        body: `WordPress.org: Plugins → Add New → search SplitSMS → Install → Activate. Manual: download the zip from Integrations → WordPress (v${wordpressPlugin.version}) → Upload Plugin → Activate. If an old splitsms* folder exists, delete it first.`,
      },
      {
        title: "Connect and test",
        body: "In wp-admin open SplitSMS → Settings. Paste the full API key, pick the Sender ID, set an admin phone, Test connection, then Save. Send a test SMS from the plugin Dashboard. The site then appears under SplitSMS Dashboard → Integrations → WordPress.",
      },
    ],
    notes: [
      "Pasting only the visible prefix (for example sk_live_99a064) causes not_configured errors.",
      "If WordPress says plugin file not found, delete every splitsms* folder under wp-content/plugins/ and upload a fresh zip.",
    ],
    related: [
      { href: "/integrations/wordpress", label: "WordPress integration" },
      { href: wordpressPlugin.downloadUrl, label: "Download plugin" },
      { href: "/docs#wordpress", label: "WordPress docs" },
    ],
  },
  {
    id: "wordpress-woocommerce",
    category: "wordpress",
    title: "Send WooCommerce order SMS",
    summary:
      "Turn on order events, write templates, and know why an order might skip SMS.",
    minutes: 10,
    level: "intermediate",
    audience: "Store owners",
    keywords: "woocommerce order paid shipped paystack flutterwave checkout",
    steps: [
      {
        title: "Enable events",
        body: "In wp-admin open SplitSMS → Integrations. Turn on the events you need: order placed, payment complete, processing, completed, cancelled, failed, refunded, shipped (tracking).",
      },
      {
        title: "Edit each template",
        body: "Use placeholders such as {customer_name}, {order_id}, {order_total}, {order_status}, {payment_method}, {tracking_number}, {refund_amount}, and {site_name}. Keep messages short so they stay in one GSM segment when possible.",
      },
      {
        title: "Collect a phone at checkout",
        body: "SMS goes to billing phone, then shipping phone, custom order meta, or user meta. If checkout does not collect a phone, every order will skip. HPOS and block checkout are supported.",
      },
      {
        title: "Know when payment SMS fires",
        body: "Paystack, Flutterwave, and Stripe SMS fire when WooCommerce marks the order paid — not via a separate gateway API. COD/BACS payment SMS only sends when the order is marked paid.",
      },
    ],
    notes: [
      "No SMS on an order? Open SplitSMS → Logs and read the skip reason (often no_billing_phone). Then check wallet balance and Sender ID.",
    ],
    related: [
      { href: "/integrations/woocommerce", label: "WooCommerce SMS" },
      { href: "/integrations/paystack", label: "Paystack SMS" },
      { href: "/how-to/wordpress-logs", label: "Read plugin logs" },
    ],
  },
  {
    id: "wordpress-forms",
    category: "wordpress",
    title: "SMS from Contact Form 7, WPForms, and Elementor",
    summary:
      "Use the Forms manager for a quick toggle, or native after-submit actions for per-form control.",
    minutes: 9,
    level: "intermediate",
    audience: "WordPress forms",
    keywords: "contact form 7 wpforms elementor jetformbuilder forms manager",
    steps: [
      {
        title: "Scan the site",
        body: "Open SplitSMS → Forms and click Refresh list. The table shows Contact Form 7, WPForms, Elementor Pro, JetFormBuilder, and JetEngine legacy forms.",
      },
      {
        title: "Enable SMS on a form",
        body: "Toggle Send SMS, pick the phone field (tel fields are detected), edit the message with {name}, {phone}, {form_title}, {site_name}, and field_* placeholders. Optional: send an admin copy to your admin phone. Save.",
      },
      {
        title: "Or use native actions",
        body: "JetFormBuilder: Post Submit Actions → Send SMS. JetEngine legacy: Notifications → Send SMS. Elementor Pro: Actions After Submit → SplitSMS Notification. Native actions skip the duplicate global hook for that submission.",
      },
      {
        title: "Submit a test",
        body: "Send a real test entry and confirm SplitSMS → Logs. If it skipped, the log names the reason (no phone field, event off, or insufficient credits).",
      },
    ],
    related: [
      { href: "/integrations/contact-form-7", label: "Contact Form 7" },
      { href: "/integrations/wpforms", label: "WPForms" },
      { href: "/docs#wp-forms-manager", label: "Forms manager docs" },
    ],
  },
  {
    id: "wordpress-crocoblock",
    category: "wordpress",
    title: "Crocoblock, JetEngine, and JetFormBuilder SMS",
    summary:
      "Map phone fields, write event templates, and use JetFormBuilder’s Send SMS action.",
    minutes: 10,
    level: "intermediate",
    audience: "Crocoblock sites",
    keywords: "crocoblock jetengine jetformbuilder jetbooking jetappointment",
    steps: [
      {
        title: "Open Crocoblock settings",
        body: "In wp-admin go to SplitSMS → Crocoblock. Each module (JetEngine, JetFormBuilder, JetBooking, JetAppointment) has its own toggle — they work independently of a master switch.",
      },
      {
        title: "Map the phone field",
        body: "Point each module at the phone meta or form field. Edit every event template. Optional JSON rules can gate SMS on status.",
      },
      {
        title: "Prefer native JetFormBuilder action",
        body: "On the form, add Post Submit Actions → Send SMS. That is the recommended per-form control. JetEngine legacy forms use a Send SMS notification type.",
      },
      {
        title: "Reminders",
        body: "JetBooking and JetAppointment can send reminder SMS via WP-Cron before check-in or the appointment. Activity is tagged by source in WordPress logs and the SplitSMS dashboard.",
      },
    ],
    related: [
      { href: "/integrations/crocoblock", label: "Crocoblock SMS" },
      { href: "/docs#wp-crocoblock", label: "Crocoblock docs" },
    ],
  },
  {
    id: "wordpress-logs",
    category: "wordpress",
    title: "Read WordPress logs and skip reasons",
    summary:
      "Why an SMS was not sent, how delivery syncs, and what the dashboard connection shows.",
    minutes: 6,
    level: "beginner",
    audience: "Anyone debugging plugin SMS",
    keywords: "logs skip no_billing_phone delivery dlr wordpress dashboard",
    steps: [
      {
        title: "Open plugin logs",
        body: "In wp-admin go to SplitSMS → Logs. Each row is a send, skip, or fail. Skip reasons (no phone, disabled event, insufficient balance) explain silence better than “it didn’t work.”",
      },
      {
        title: "Check the cloud connection",
        body: "On splitsms.com open Dashboard → Integrations → WordPress. You should see the site URL, plugin version, WordPress/PHP versions, and synced skip logs. Outdated plugin versions are flagged.",
      },
      {
        title: "Follow delivery",
        body: "Sent means the API accepted the message. Delivered updates when the carrier DLR arrives — both in WordPress Logs and the SplitSMS dashboard.",
      },
      {
        title: "Update or disconnect",
        body: "Update from Dashboard → Updates, or Replace from splitsms.com on Settings if the host blocks the updater. Disconnect by removing the API key in WordPress Settings.",
      },
    ],
    related: [
      { href: "/changelog", label: "Changelog" },
      { href: "/support?topic=wordpress", label: "WordPress support" },
    ],
  },
  {
    id: "message-results",
    category: "reports",
    title: "Read message results and delivery reports",
    summary:
      "Filter Queued, Sent, Delivered, and Failed — then export what you need.",
    minutes: 7,
    level: "beginner",
    audience: "Anyone who just sent SMS",
    keywords: "delivery dlr reports failed pending message results",
    steps: [
      {
        title: "Open Message results",
        body: "Dashboard → Message results lists each SMS with status, destination, Sender ID, and time. This is the live delivery log — not the same as My reports (account summaries).",
      },
      {
        title: "Learn the statuses",
        body: "Queued: accepted, waiting for the worker. Sent: handed to the carrier. Delivered: confirmed where the route supports DLR. Failed: rejected or expired (reason on the row). Pending: still in transit.",
      },
      {
        title: "Filter and search",
        body: "Narrow by status, date, destination, or campaign. Use this when a customer says they never received an OTP or order alert — search the number first.",
      },
      {
        title: "Export",
        body: "Export the filtered list as CSV for finance or a client. Pair with My reports when you need spend and login history for a date range.",
      },
    ],
    related: [
      { href: "/dashboard/reports", label: "Message results" },
      { href: "/how-to/account-reports", label: "My reports" },
      { href: "/docs#delivery-states", label: "Delivery lifecycle" },
    ],
  },
  {
    id: "account-reports",
    category: "reports",
    title: "Use My reports (delivery, logins, transactions)",
    summary:
      "Account-level summaries for a date range — not the per-message log.",
    minutes: 6,
    level: "beginner",
    audience: "Account owners and finance",
    keywords: "account reports spend logins transactions delivery pdf",
    steps: [
      {
        title: "Open My reports",
        body: "Dashboard → My reports. Pick a period (for example last 7 / 30 days). The overview summarises sends, delivery, credits, and activity for that window.",
      },
      {
        title: "Delivery",
        body: "Open the Delivery sub-report for volume and success rates over time. Use this for client recaps; use Message results when you need a single number.",
      },
      {
        title: "Logins",
        body: "The Logins report shows who signed in and when — useful if several people share an organisation account.",
      },
      {
        title: "Transactions",
        body: "The Transactions report lines up wallet top-ups and SMS debits. Download or print when you need an accounting pack alongside Invoices.",
      },
    ],
    related: [
      { href: "/dashboard/account-reports", label: "My reports" },
      { href: "/dashboard/account-reports/delivery", label: "Delivery report" },
      { href: "/dashboard/account-reports/transactions", label: "Transactions report" },
      { href: "/dashboard/invoices", label: "Invoices" },
    ],
  },
  {
    id: "campaign-reports",
    category: "reports",
    title: "Read a campaign report",
    summary: "Sent, delivered, failed, and pending counts on the campaign itself.",
    minutes: 4,
    level: "beginner",
    audience: "Campaign senders",
    keywords: "campaign report retry failed bulk stats",
    steps: [
      {
        title: "Open the campaign",
        body: "Dashboard → Campaigns → select the campaign. The header shows sent, delivered, failed, and pending as the worker finishes the queue.",
      },
      {
        title: "Inspect failures",
        body: "Open failed recipients. Typical causes: invalid number, blocked route, or insufficient balance mid-send. Top up and retry where the UI offers it.",
      },
      {
        title: "Compare with Message results",
        body: "Campaign totals are aggregates. Message results still holds the row-level DLR if you need to prove a single delivery.",
      },
    ],
    related: [
      { href: "/dashboard/campaigns", label: "Campaigns" },
      { href: "/how-to/run-campaign", label: "Run a campaign" },
    ],
  },
  {
    id: "smart-forms-create",
    category: "smart-forms",
    title: "Create a Smart Form",
    summary:
      "Build fields, brand the form, and publish a public link — no WordPress required.",
    minutes: 10,
    level: "beginner",
    audience: "Anyone collecting replies by SMS",
    keywords: "smart forms builder fields design publish",
    steps: [
      {
        title: "Start a form",
        body: "Open Dashboard → Smart Forms and create a form. Start from a template or a blank canvas. Add text, phone, email, select, date, consent, and other field types.",
      },
      {
        title: "Brand it",
        body: "In the builder, set colours, button text, header banner, background, and the success message so the public page matches your organisation.",
      },
      {
        title: "Require a phone when you need SMS",
        body: "Add a phone field and mark it required if you will send a confirmation SMS. International format still applies when you message that number later.",
      },
      {
        title: "Publish",
        body: "Save and publish. You get a short public URL under /f/…, plus options to embed or generate a QR code on the form’s share tools.",
      },
    ],
    related: [
      { href: "/smart-forms", label: "Smart Forms product" },
      { href: "/dashboard/forms", label: "Open Smart Forms" },
      { href: "/how-to/smart-forms-sms", label: "SMS on submit" },
    ],
  },
  {
    id: "smart-forms-sms",
    category: "smart-forms",
    title: "Send SMS when a Smart Form is submitted",
    summary:
      "Confirmation to the respondent and an optional alert to your team — billed from the wallet.",
    minutes: 8,
    level: "intermediate",
    audience: "Form owners",
    keywords: "smart forms sms confirmation automation admin alert",
    steps: [
      {
        title: "Open Automation",
        body: "From the form, open Automation (or the SMS panel in the builder). Choose an approved Sender ID.",
      },
      {
        title: "Write the respondent SMS",
        body: "Map the phone field and write the confirmation. Include submitted values where the builder offers merge tags. Keep it one segment when you can.",
      },
      {
        title: "Optional admin alert",
        body: "Turn on an admin copy so your team’s phone gets a short ping on every new response.",
      },
      {
        title: "Submit a test",
        body: "Open the public link, send a real entry, and confirm Message results. Automations pause if the wallet runs out — top up and the next submission sends again.",
      },
    ],
    related: [
      { href: "/how-to/smart-forms-responses", label: "Responses and reports" },
      { href: "/how-to/wallet-topup", label: "Top up wallet" },
    ],
  },
  {
    id: "smart-forms-share",
    category: "smart-forms",
    title: "Share a Smart Form with a link, QR, or embed",
    summary: "Public short links, QR codes, and website embeds — including WordPress pages.",
    minutes: 5,
    level: "beginner",
    audience: "Anyone distributing a form",
    keywords: "qr embed short link share public form iframe",
    steps: [
      {
        title: "Copy the short link",
        body: "Every published form has a public /f/… URL. Share it in WhatsApp, email, or SMS. Recipients do not need a SplitSMS account.",
      },
      {
        title: "Generate a QR code",
        body: "Use the form’s share tools to download a QR for print, posters, or event check-in.",
      },
      {
        title: "Embed on a site",
        body: "Paste the embed snippet on your website or a WordPress page. The public form still runs on SplitSMS — submissions land in your dashboard.",
      },
    ],
    related: [
      { href: "/smart-forms", label: "Smart Forms" },
      { href: "/how-to/smart-forms-create", label: "Create a form" },
    ],
  },
  {
    id: "smart-forms-responses",
    category: "smart-forms",
    title: "Review responses, analytics, and form reports",
    summary:
      "Inbox, charts, scheduled reports, and export to Google Sheets.",
    minutes: 7,
    level: "intermediate",
    audience: "Form owners and ops",
    keywords: "responses analytics report sheets export smart forms",
    steps: [
      {
        title: "Open Responses",
        body: "Dashboard → Smart Forms → the form → Responses. Each submission is a row with field values and timestamp.",
      },
      {
        title: "Analytics",
        body: "Open Analytics for volume over time and field breakdowns. Use this to see which channels (link, QR, embed) are actually converting.",
      },
      {
        title: "Form report",
        body: "Open the form’s Report page for a printable recap. You can also email scheduled Smart Form reports when that option is enabled on the form.",
      },
      {
        title: "Export to Sheets",
        body: "If Google is connected, export responses to a new Google Sheet from the Responses page so ops can filter in Drive.",
      },
    ],
    related: [
      { href: "/how-to/google-smart-forms-sheets", label: "Export to Sheets" },
      { href: "/google", label: "Google features" },
    ],
  },
  {
    id: "google-connect",
    category: "google",
    title: "Connect Google (this is not Sign in with Google)",
    summary:
      "Store a refresh token so SplitSMS can call Contacts, Sheets, Drive, and Forms after you approve scopes.",
    minutes: 6,
    level: "beginner",
    audience: "Anyone using Google features",
    keywords: "oauth connect google scopes refresh token disconnect",
    steps: [
      {
        title: "Know the difference",
        body: "Sign in with Google logs you into SplitSMS. Connect Google is a separate OAuth grant under Dashboard → Integrations → Google. It lets SplitSMS read Contacts, Sheets/Drive, and Forms after you approve the scopes.",
      },
      {
        title: "Connect",
        body: "Open Dashboard → Integrations → Google → Connect Google. Grant base identity first. Extra Contacts, Sheets, or Forms scopes are requested when a feature needs them.",
      },
      {
        title: "Use a feature",
        body: "Import Contacts, browse Drive Sheets, wire Google Forms → SMS, or export Smart Forms to Sheets. Messages still use your SplitSMS wallet and Sender ID.",
      },
      {
        title: "Disconnect anytime",
        body: "Disconnect removes the refresh token. Feature configs stay on the account, but API calls fail until you reconnect.",
      },
    ],
    related: [
      { href: "/google", label: "Google product page" },
      { href: "/integrations/google", label: "Google integration" },
      { href: "/dashboard/integrations/google", label: "Connect Google" },
    ],
  },
  {
    id: "google-contacts",
    category: "google",
    title: "Import and export Google Contacts",
    summary: "Pull numbers from Google People, or push SplitSMS contacts back.",
    minutes: 6,
    level: "beginner",
    audience: "Teams that live in Google Contacts",
    keywords: "google contacts import export people phone",
    steps: [
      {
        title: "Connect Google with Contacts scope",
        body: "If you have not connected yet, start from Dashboard → Integrations → Google. Approve Contacts when prompted.",
      },
      {
        title: "Load contacts with phone numbers",
        body: "Open Contacts → Import (Google). SplitSMS lists Google contacts that have a phone. Preview, select one, or Select all.",
      },
      {
        title: "Import into SplitSMS",
        body: "Import the selection. They become ordinary SplitSMS contacts — tag them, add to groups, or send immediately.",
      },
      {
        title: "Export back (optional)",
        body: "You can export selected or all SplitSMS contacts back to Google Contacts when the team still works in People.",
      },
    ],
    related: [
      { href: "/blog/import-google-contacts-bulk-sms", label: "Contacts guide" },
      { href: "/how-to/import-contacts", label: "CSV import" },
    ],
  },
  {
    id: "google-sheets",
    category: "google",
    title: "Send SMS from Google Sheets or Drive Excel",
    summary: "Browse Drive, map the phone column, save as contacts or jump into Send SMS.",
    minutes: 8,
    level: "intermediate",
    audience: "Ops working in spreadsheets",
    keywords: "google sheets drive excel csv phone column map",
    steps: [
      {
        title: "Connect Sheets / Drive",
        body: "Approve Sheets and Drive scopes from Dashboard → Integrations → Google when the import screen asks.",
      },
      {
        title: "Pick a file",
        body: "Browse Google Sheets and Excel files on Drive. Open the sheet that holds phone numbers.",
      },
      {
        title: "Map columns",
        body: "Choose the phone column and optional name column. Invalid numbers are called out before you import or send.",
      },
      {
        title: "Import or send",
        body: "Save as SplitSMS contacts, or open Send SMS with that list for a one-off campaign. Credits debit as usual.",
      },
    ],
    related: [
      { href: "/blog/connect-google-sheets-drive-export-sms", label: "Sheets & Drive guide" },
      { href: "/google", label: "Google features" },
    ],
  },
  {
    id: "google-forms-sms",
    category: "google",
    title: "Google Forms → SMS automation",
    summary:
      "Map a phone question, pick a Sender ID and template — new responses queue SMS in about a minute.",
    minutes: 10,
    level: "intermediate",
    audience: "Anyone already using Google Forms",
    keywords: "google forms sms automation poll responses apps script",
    steps: [
      {
        title: "Connect Google with Forms scope",
        body: "Open Dashboard → Integrations → Google Forms SMS. Connect Google if needed and allow Forms access.",
      },
      {
        title: "Pick the form and phone question",
        body: "Choose the Google Form, map the question that collects the phone, select an approved Sender ID, and write the message template.",
      },
      {
        title: "How it runs",
        body: "A worker polls roughly every 45–60 seconds and queues SMS for new responses. Historical responses are skipped by default — only new answers send.",
      },
      {
        title: "Watch credits",
        body: "Automations pause when the wallet cannot cover the next SMS. Top up and the automation resumes. Check Message results for each send.",
      },
    ],
    notes: [
      "You do not paste Apps Script. Mapping happens in the SplitSMS dashboard.",
    ],
    related: [
      { href: "/dashboard/integrations/google/forms", label: "Google Forms SMS" },
      { href: "/blog/google-forms-sms-automation-splitsms", label: "Forms → SMS guide" },
      { href: "/google", label: "Google features" },
    ],
  },
  {
    id: "google-smart-forms-sheets",
    category: "google",
    title: "Export Smart Forms responses to Google Sheets",
    summary: "Create a Sheet from the Responses page so ops can filter in Drive.",
    minutes: 5,
    level: "beginner",
    audience: "Smart Forms + Google users",
    keywords: "export sheets smart forms drive responses",
    steps: [
      {
        title: "Connect Google",
        body: "Dashboard → Integrations → Google. Approve Sheets scope when export asks for it.",
      },
      {
        title: "Open Responses",
        body: "Dashboard → Smart Forms → the form → Responses.",
      },
      {
        title: "Export",
        body: "Export to a new Google Sheet. Share that Sheet with the team that already lives in Drive — they do not need SplitSMS logins to read the rows.",
      },
    ],
    related: [
      { href: "/how-to/smart-forms-responses", label: "Form reports" },
      { href: "/google", label: "Google features" },
    ],
  },
  {
    id: "api-keys",
    category: "api",
    title: "Create API keys with the right permissions",
    summary:
      "Live vs test keys, scopes, and why the secret is shown only once.",
    minutes: 6,
    level: "intermediate",
    audience: "Developers and WordPress installers",
    keywords: "api key sk_live permissions sms.send bearer",
    steps: [
      {
        title: "Open App connections",
        body: "Dashboard → App connections (or Developers → API Keys). Create a key per environment — production vs staging — instead of sharing one secret everywhere.",
      },
      {
        title: "Grant the minimum scopes",
        body: "sms.send for send and OTP. sms.read for logs. wallet.read for balance. contacts.read / contacts.write for list sync. WordPress needs sms.send and usually sender_ids.read.",
      },
      {
        title: "Store the full secret",
        body: "Copy the ~56-character key immediately. Later the UI only shows a prefix. Put it in a server environment variable — never in frontend JavaScript or a public WordPress page.",
      },
      {
        title: "Rotate if leaked",
        body: "Revoke the old key and create a new one. Update WordPress Settings or your app config in the same change.",
      },
    ],
    related: [
      { href: "/dashboard/api-keys", label: "App connections" },
      { href: "/api-docs", label: "API reference" },
      { href: "/docs#api-keys", label: "API docs" },
    ],
  },
  {
    id: "api-send",
    category: "api",
    title: "Send SMS with the REST API",
    summary: `POST ${apiV1}/sms/send with a Bearer key, sender, recipients, and message.`,
    minutes: 8,
    level: "intermediate",
    audience: "Developers",
    keywords: "curl rest send sms api json bearer recipients",
    steps: [
      {
        title: "Authenticate",
        body: `All requests are HTTPS JSON. Header Authorization: Bearer YOUR_API_KEY. Base URL: ${apiV1}. Use sk_test_ keys in development.`,
      },
      {
        title: "Send",
        body: "POST /sms/send with sender (approved Sender ID), recipients (array of international numbers without +), and message. The response includes message IDs and initial status.",
      },
      {
        title: "Track delivery",
        body: "Poll GET /messages or register a webhook. Do not assume Delivered from a 200 on send — that only means SplitSMS accepted the request.",
      },
    ],
    notes: [
      "Full schemas and cURL examples live on the API reference. This page is the operator walkthrough.",
    ],
    related: [
      { href: "/api-docs", label: "API reference" },
      { href: "/docs/api", label: "API guides" },
      { href: "/sdk", label: "SDKs" },
    ],
  },
  {
    id: "api-otp",
    category: "api",
    title: "Send and verify OTP codes",
    summary: "One-time codes for login and verification — send, store the reference, verify.",
    minutes: 7,
    level: "intermediate",
    audience: "App and web developers",
    keywords: "otp verify send code login verification",
    steps: [
      {
        title: "Send the code",
        body: "POST /otp/send with the recipient number and your Sender ID. Store the returned reference on your server, not in the browser.",
      },
      {
        title: "Collect the code",
        body: "The user types the SMS code in your app. Do not log the code in client analytics.",
      },
      {
        title: "Verify",
        body: "POST /otp/verify with the reference and the code. Treat a successful verify as one-time — do not reuse the same reference.",
      },
    ],
    related: [
      { href: "/solutions/otp", label: "OTP SMS API" },
      { href: "/docs#api-otp", label: "OTP docs" },
      { href: "/api-docs", label: "API reference" },
    ],
  },
  {
    id: "wallet-topup",
    category: "billing",
    title: "Top up the wallet and understand credits",
    summary:
      "Prepaid credits, Paystack (and other gateways), and what happens when balance hits zero.",
    minutes: 6,
    level: "beginner",
    audience: "Account owners",
    keywords: "wallet top up paystack momo flutterwave credits invoice",
    steps: [
      {
        title: "Open Wallet",
        body: "Dashboard → Wallet shows current credits. Every SMS deducts credits by destination country and number of segments.",
      },
      {
        title: "Top up",
        body: "Choose an amount and pay with Paystack. Flutterwave, MTN MoMo, or Stripe appear when enabled on the account. The balance updates after the provider webhook confirms funds — pending is not spendable yet.",
      },
      {
        title: "When balance is empty",
        body: "Dashboard sends, campaigns, WordPress, Google Forms SMS, and Smart Form automations pause until you top up. Failed or skipped rows in logs often say insufficient balance.",
      },
      {
        title: "Paper trail",
        body: "Wallet transactions list top-ups and SMS debits. Invoices are under Dashboard → Invoices for accounting.",
      },
    ],
    related: [
      { href: "/dashboard/wallet", label: "Wallet" },
      { href: "/pricing", label: "Pricing" },
      { href: "/dashboard/invoices", label: "Invoices" },
    ],
  },
];

export const howToFaqs = [
  {
    question: "Is the How to page the same as Documentation?",
    answer:
      "No. How to is step-by-step for operators: Send SMS, WordPress, reports, Smart Forms, and Google. Documentation is the full platform reference, including API schemas and troubleshooting tables.",
  },
  {
    question: "Do I need WordPress to use Smart Forms?",
    answer:
      "No. Smart Forms are hosted on SplitSMS. Share a link, QR, or embed. The WordPress plugin is for WooCommerce and WordPress form builders on your own site.",
  },
  {
    question: "Is Connect Google the same as Sign in with Google?",
    answer:
      "No. Sign in logs you into SplitSMS. Connect Google stores a refresh token so Contacts, Sheets, Drive, and Forms automations can run after you approve scopes.",
  },
  {
    question: "Where do I see if an SMS was delivered?",
    answer:
      "Dashboard → Message results for each message. Campaign pages show totals. My reports summarises a date range. WordPress also syncs delivery into SplitSMS → Logs.",
  },
];

export function getHowToGuide(id: string) {
  return howToGuides.find((guide) => guide.id === id);
}

export function getHowToCategory(id: string) {
  return howToCategories.find((category) => category.id === id);
}

export function resolveHowToCategory(topic?: string | null): HowToCategoryId | "all" {
  if (!topic || topic === "all") return "all";
  if (howToCategories.some((category) => category.id === topic)) {
    return topic as HowToCategoryId;
  }
  const aliases: Record<string, HowToCategoryId> = {
    "getting-started": "start",
    getting: "start",
    wp: "wordpress",
    woo: "wordpress",
    woocommerce: "wordpress",
    forms: "smart-forms",
    "smart-form": "smart-forms",
    sheets: "google",
    contacts: "google",
    wallet: "billing",
    billing: "billing",
    credits: "billing",
    delivery: "reports",
    report: "reports",
  };
  return aliases[topic.toLowerCase()] ?? "all";
}

export function resolveHowToLevel(level?: string | null): HowToLevel | "all" {
  if (level === "beginner" || level === "intermediate" || level === "advanced") {
    return level;
  }
  return "all";
}

export function searchHowToGuides(
  guides: HowToGuide[],
  query: string,
): HowToGuide[] {
  const q = query.trim().toLowerCase();
  if (!q) return guides;

  const words = q.split(/\s+/).filter(Boolean);

  const scored = guides
    .map((guide) => {
      const hay = [
        guide.title,
        guide.summary,
        guide.keywords,
        guide.audience,
        guide.category,
        ...guide.steps.map((step) => `${step.title} ${step.body}`),
        ...(guide.notes ?? []),
      ]
        .join(" ")
        .toLowerCase();
      const title = guide.title.toLowerCase();
      let score = 0;
      if (title === q) score = 100;
      else if (title.startsWith(q)) score = 80;
      else if (title.includes(q)) score = 60;
      else if (hay.includes(q)) score = 40;
      else if (words.length > 1 && words.every((word) => hay.includes(word))) score = 30;
      else if (words.some((word) => word.length > 2 && hay.includes(word))) score = 15;
      return { guide, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.guide.title.localeCompare(b.guide.title));

  return scored.map((row) => row.guide);
}

export function filterHowToGuides(input: {
  query?: string;
  category?: HowToCategoryId | "all";
  level?: HowToLevel | "all";
}) {
  let list = howToGuides;
  if (input.category && input.category !== "all") {
    list = list.filter((guide) => guide.category === input.category);
  }
  if (input.level && input.level !== "all") {
    list = list.filter((guide) => guide.level === input.level);
  }
  return searchHowToGuides(list, input.query ?? "");
}

export function howToJsonLd(guide: HowToGuide) {
  return {
    "@type": "HowTo",
    name: guide.title,
    description: guide.summary,
    url: `${siteUrl}/how-to/${guide.id}`,
    totalTime: `PT${guide.minutes}M`,
    step: guide.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: step.body,
    })),
  };
}

export function howToItemListJsonLd() {
  return {
    "@type": "ItemList",
    name: "SplitSMS How to guides",
    numberOfItems: howToGuides.length,
    itemListElement: howToGuides.map((guide, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteUrl}/how-to/${guide.id}`,
      name: guide.title,
    })),
  };
}
