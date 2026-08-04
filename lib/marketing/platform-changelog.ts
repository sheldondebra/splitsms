export type ChangelogChangeType = "added" | "changed" | "fixed" | "deprecated" | "security";

export type ChangelogEntry = {
  type: ChangelogChangeType;
  text: string;
};

export type ChangelogRelease = {
  version: string;
  date: string;
  label?: string;
  summary: string;
  product: "platform" | "wordpress" | "api";
  changes: ChangelogEntry[];
};

export const changelogReleases: ChangelogRelease[] = [
  {
    version: "2.0.0",
    date: "2026-08-03",
    product: "platform",
    label: "Google integrations",
    summary:
      "Connect Google for Contacts, Sheets/Drive Excel, Forms → SMS, and Smart Forms export to Sheets.",
    changes: [
      {
        type: "added",
        text: "Dashboard → Integrations → Google with incremental OAuth scopes.",
      },
      {
        type: "added",
        text: "Import Google Contacts (select one or select all) and export SplitSMS contacts to Google.",
      },
      {
        type: "added",
        text: "Import Google Sheets / Excel from Drive for contacts or Send SMS.",
      },
      {
        type: "added",
        text: "Export Smart Forms responses to a new Google Sheet.",
      },
      {
        type: "added",
        text: "Google Forms → SMS automations with near-real-time polling.",
      },
    ],
  },
  {
    version: "1.7.0",
    date: "2026-06-01",
    product: "wordpress",
    summary: "Stability release — safer bootstrap, fewer admin errors, conditional integrations.",
    changes: [
      {
        type: "fixed",
        text: "Critical errors from loading Elementor/JetFormBuilder classes before parent plugins.",
      },
      {
        type: "fixed",
        text: "Integrations only boot when WooCommerce, Elementor Pro, CF7, WPForms, or JetEngine is active.",
      },
      {
        type: "changed",
        text: "Cloud site sync runs on Dashboard only — faster, fewer failed admin requests.",
      },
      {
        type: "changed",
        text: "Simpler update UI and update notices limited to SplitSMS admin pages.",
      },
    ],
  },
  {
    version: "1.6.9",
    date: "2026-06-01",
    product: "wordpress",
    summary: "Fix critical site error and ensure versioned plugin zip builds.",
    changes: [
      {
        type: "fixed",
        text: "Critical error when Elementor/JetFormBuilder action classes loaded before parent plugins.",
      },
      {
        type: "fixed",
        text: "One-click Update loads WordPress upgrader APIs safely.",
      },
      {
        type: "changed",
        text: "Release zip always named SplitSMS-v{version}.zip and splitsms-plugin-v{version}.zip with VERSION file inside.",
      },
    ],
  },
  {
    version: "1.6.8",
    date: "2026-06-01",
    product: "wordpress",
    summary:
      "Native form actions (JetFormBuilder, JetEngine, Elementor), Forms manager, create-account onboarding, delivery sync, and WordPress.org-ready packaging.",
    changes: [
      {
        type: "added",
        text: "Create free account — signup CTAs in plugin admin, Plugins list, Settings, and sidebar for WordPress.org installs.",
      },
      {
        type: "added",
        text: "Elementor Pro — SplitSMS Notification under Actions After Submit (phone, message, sender ID, admin copy per form).",
      },
      {
        type: "added",
        text: "JetFormBuilder & JetEngine legacy — Send SMS post-submit action with %phone%, %post_id%, %user_id% macro support.",
      },
      {
        type: "added",
        text: "SplitSMS → Forms — auto-detect forms, per-form toggles, phone field, and custom messages (no custom code).",
      },
      {
        type: "changed",
        text: "Delivery status sync — Sent → Delivered in WordPress logs and SplitSMS dashboard when carrier confirms DLR.",
      },
      {
        type: "changed",
        text: "WordPress.org packaging — dev files excluded from release zip; privacy policy integration; translation-ready labels.",
      },
      {
        type: "changed",
        text: "Versioned download filename: SplitSMS-v{version}.zip on splitsms.com.",
      },
    ],
  },
  {
    version: "1.6.7",
    date: "2026-05-31",
    product: "wordpress",
    summary: "Plugin version check vs splitsms.com, connected-site monitoring, and cleaner admin shell.",
    changes: [
      {
        type: "added",
        text: "Update banner and Site details (WordPress + PHP versions) when API is connected.",
      },
      {
        type: "added",
        text: "SplitSMS dashboard flags outdated connected sites with WP/PHP version details.",
      },
      {
        type: "changed",
        text: "Help page quick start — no custom code; points to Forms manager.",
      },
    ],
  },
  {
    version: "2026.06",
    date: "2026-06-01",
    label: "Documentation",
    product: "platform",
    summary:
      "Full documentation refresh — detailed WordPress plugin how-to, website dashboard guides, and changelog for v1.6.7–1.6.8.",
    changes: [
      {
        type: "changed",
        text: "/docs WordPress chapter — account setup, admin menu map, Forms manager, per-form actions, WooCommerce, and troubleshooting.",
      },
      {
        type: "changed",
        text: "/integrations/wordpress — expanded setup guide and how SplitSMS connects to splitsms.com.",
      },
      {
        type: "added",
        text: "Plugin Help page — in-wp-admin documentation mirroring website guides.",
      },
      {
        type: "changed",
        text: "/changelog — WordPress plugin releases 1.6.7 and 1.6.8 documented.",
      },
    ],
  },
  {
    version: "2.0.0",
    date: "2026-05-26",
    label: "Connect",
    product: "platform",
    summary:
      "SplitSMS Connect — partner customer provisioning, sender ID APIs, smart routing, unified providers admin, and documentation v2.",
    changes: [
      {
        type: "added",
        text: "Connect™ — POST/GET /api/v1/connect/customers to provision embedded customers with wallet and SMS credits.",
      },
      {
        type: "added",
        text: "REST sender IDs — GET/POST /api/v1/sender-ids with optional customer_id for Connect partners.",
      },
      {
        type: "added",
        text: "Dashboard /dashboard/connect hub — API keys, customers, routing, and quick links.",
      },
      {
        type: "added",
        text: "Admin Providers page — mNotify, Infobip, Twilio usage, balances, and credentials in one place.",
      },
      {
        type: "added",
        text: "Multi-provider sender ID registration (mNotify, Twilio, Infobip) with per-provider status badges.",
      },
      {
        type: "added",
        text: "Smart routing — auto-route by recipient country; admin routing policy and switch logs.",
      },
      {
        type: "added",
        text: "Docs v2 routes — /docs/api, /docs/connect, /docs/sdk, /docs/mobile.",
      },
      {
        type: "changed",
        text: "API permissions — connect.customers, sender_ids.read, sender_ids.write added to default scopes.",
      },
    ],
  },
  {
    version: "1.6.0",
    date: "2026-05-31",
    product: "wordpress",
    summary:
      "Complete admin UI for WordPress core and Crocoblock, dedicated WPForms integration, and docs alignment.",
    changes: [
      {
        type: "added",
        text: "WordPress core SMS settings — registration and password reset templates on Integrations.",
      },
      {
        type: "added",
        text: "Dedicated WPForms class with skip logs, per-form ID filter, and setup panel.",
      },
      {
        type: "changed",
        text: "Crocoblock admin exposes all JetEngine, JetBooking, and JetAppointment templates and toggles.",
      },
      {
        type: "fixed",
        text: "Removed unused otp_login_enabled setting.",
      },
    ],
  },
  {
    version: "1.5.1",
    date: "2026-05-31",
    product: "wordpress",
    summary: "JetFormBuilder native Send SMS post-submit form action.",
    changes: [
      {
        type: "added",
        text: "Send SMS (SplitSMS) appears in JetFormBuilder Post Submit Actions when connected.",
      },
      {
        type: "changed",
        text: "Global JetFormBuilder auto-SMS skipped when the per-form action runs.",
      },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-05-30",
    product: "wordpress",
    summary: "Full Elementor Pro Forms integration.",
    changes: [
      {
        type: "added",
        text: "Elementor Pro Forms — elementor_pro/forms/new_record + mail_sent fallback.",
      },
      {
        type: "added",
        text: "Elementor setup panel with Field ID instructions on Integrations.",
      },
    ],
  },
  {
    version: "1.4.9",
    date: "2026-05-29",
    product: "wordpress",
    summary: "Dedicated Contact Form 7 integration with skip logs and per-form filters.",
    changes: [
      {
        type: "added",
        text: "class-splitsms-cf7.php — wpcf7_submit primary hook with mail_failed fallback.",
      },
      {
        type: "added",
        text: "CF7 setup panel listing forms; skip reasons sync to SplitSMS dashboard.",
      },
    ],
  },
  {
    version: "1.4.8",
    date: "2026-05-28",
    product: "wordpress",
    summary: "WooCommerce failed, refunded, shipped events; HPOS compatibility.",
    changes: [
      {
        type: "added",
        text: "SMS for payment failed, refunded, and shipped (tracking) order events.",
      },
      {
        type: "added",
        text: "HPOS (custom order tables) compatibility declaration.",
      },
      {
        type: "changed",
        text: "COD/BACS payment SMS only when order is marked paid.",
      },
    ],
  },
  {
    version: "1.4.6",
    date: "2026-05-27",
    product: "wordpress",
    summary: "Cloud log sync fixes, Send SMS admin page, and low balance alerts.",
    changes: [
      {
        type: "fixed",
        text: "WordPress log sync uses sms.send permission (not sms.read).",
      },
      {
        type: "fixed",
        text: "Cloud logs sync with final sent/failed status after API response.",
      },
      {
        type: "added",
        text: "Low balance SMS alert (once per day) and WooCommerce order-placed templates.",
      },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-05-25",
    product: "wordpress",
    summary: "Elementor Pro forms, Paystack paid→processing hook, Crocoblock module independence.",
    changes: [
      {
        type: "added",
        text: "Elementor Pro forms integration (initial release, expanded in 1.5.0).",
      },
      {
        type: "added",
        text: "WooCommerce paid → processing hook for Paystack / Flutterwave gateways.",
      },
      {
        type: "fixed",
        text: "Crocoblock modules work without master Crocoblock toggle.",
      },
    ],
  },
  {
    version: "1.2.1",
    date: "2026-05-22",
    product: "wordpress",
    summary:
      "Fixes plugin install and update failures when WordPress creates a duplicate folder (splitsms-1/splitsms/).",
    changes: [
      {
        type: "fixed",
        text: "Plugin zip now uses a flat archive layout (splitsms.php at the root) so WordPress never nests splitsms/splitsms/ inside splitsms-1.",
      },
      {
        type: "changed",
        text: "Installation readme updated with cleanup steps before upgrading.",
      },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-05-20",
    label: "Crocoblock",
    product: "wordpress",
    summary:
      "Major WordPress release — Crocoblock JetEngine, JetFormBuilder, JetBooking, and JetAppointment SMS automations.",
    changes: [
      {
        type: "added",
        text: "SplitSMS → Crocoblock admin page with per-module toggles and field mapping.",
      },
      {
        type: "added",
        text: "JetEngine: SMS on custom post type create and status changes.",
      },
      {
        type: "added",
        text: "JetFormBuilder: after-submit SMS with configurable phone field.",
      },
      {
        type: "added",
        text: "JetBooking & JetAppointment: confirm, cancel, and reminder SMS via WP-Cron.",
      },
      {
        type: "added",
        text: "Conditional SMS rules (JSON) for event-specific templates.",
      },
      {
        type: "changed",
        text: "Dashboard WordPress integration view shows Crocoblock event stats when connected.",
      },
    ],
  },
  {
    version: "1.1.1",
    date: "2026-05-18",
    product: "wordpress",
    summary: "Hotfix for fatal error on plugin settings save on some PHP hosts.",
    changes: [
      {
        type: "fixed",
        text: "Replaced wp_parse_url() with parse_url() in settings — fixes activation crash on sites without that WordPress helper loaded.",
      },
      {
        type: "fixed",
        text: "Windows build script now produces a valid plugin folder structure in splitsms.zip.",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-05-15",
    product: "wordpress",
    summary: "WordPress site connection APIs and cloud log sync to your SplitSMS dashboard.",
    changes: [
      {
        type: "added",
        text: "POST /api/v1/wordpress/connect — register site URL and plugin version on connect.",
      },
      {
        type: "added",
        text: "POST /api/v1/wordpress/logs — sync outbound SMS events from WordPress to SplitSMS.",
      },
      {
        type: "added",
        text: "GET /api/v1/account/status — balance and connection health for the admin bar widget.",
      },
      {
        type: "added",
        text: "Automatic plugin updates from splitsms.com/api/plugin/update.",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-05-01",
    product: "wordpress",
    summary: "Initial public release of the SplitSMS WordPress plugin.",
    changes: [
      {
        type: "added",
        text: "WooCommerce order placed, payment complete, and status SMS.",
      },
      {
        type: "added",
        text: "WordPress user registration welcome SMS.",
      },
      {
        type: "added",
        text: "Contact Form 7 and WPForms after-submit notifications.",
      },
      {
        type: "added",
        text: "Per-event templates with placeholders and local message logs.",
      },
    ],
  },
  {
    version: "2026.05.31",
    date: "2026-05-31",
    label: "Documentation",
    product: "platform",
    summary:
      "Documentation and changelog updated for WordPress plugin v1.6.0, Connect v2.0, and form integrations.",
    changes: [
      {
        type: "changed",
        text: "/docs WordPress chapter — core SMS, all form plugins, JetFormBuilder action, full WooCommerce events.",
      },
      {
        type: "changed",
        text: "/changelog — WordPress releases 1.3.0 through 1.6.0 documented.",
      },
      {
        type: "added",
        text: "Integrations catalog — Elementor Pro Forms page; WPForms and CF7 setup details refreshed.",
      },
    ],
  },
  {
    version: "2026.05",
    date: "2026-05-22",
    label: "Documentation",
    product: "platform",
    summary: "Public documentation hub, changelog, integrations marketing pages, and support form.",
    changes: [
      {
        type: "added",
        text: "/docs — full product documentation with sidebar navigation.",
      },
      {
        type: "added",
        text: "/changelog — detailed release history for platform and WordPress plugin.",
      },
      {
        type: "added",
        text: "/integrations — WordPress, Crocoblock, Paystack, Flutterwave, Stripe guides.",
      },
      {
        type: "added",
        text: "/support — public support form for bugs, errors, billing, and API issues.",
      },
      {
        type: "changed",
        text: "Login supports email or phone number; OTP sent to account phone.",
      },
    ],
  },
  {
    version: "2026.04",
    date: "2026-04-28",
    product: "platform",
    summary: "Developer portal, API reference, and marketing site launch.",
    changes: [
      {
        type: "added",
        text: "REST API v1: SMS send, OTP, wallet, contacts, campaigns, webhooks.",
      },
      {
        type: "added",
        text: "API keys with scoped permissions and sandbox (sk_test_) keys.",
      },
      {
        type: "added",
        text: "Dashboard: bulk send, campaigns, contacts CSV import, sender ID requests.",
      },
      {
        type: "added",
        text: "Wallet top-up via Paystack, Flutterwave, and MTN MoMo (when configured).",
      },
      {
        type: "added",
        text: "JavaScript, PHP, and Flutter SDK packages.",
      },
      {
        type: "added",
        text: "Postman collection with production baseUrl preset.",
      },
    ],
  },
];

export const changelogTypeLabels: Record<ChangelogChangeType, string> = {
  added: "Added",
  changed: "Changed",
  fixed: "Fixed",
  deprecated: "Deprecated",
  security: "Security",
};

export const changelogProductLabels: Record<ChangelogRelease["product"], string> = {
  platform: "Platform",
  wordpress: "WordPress plugin",
  api: "API",
};
