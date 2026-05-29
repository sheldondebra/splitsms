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
