export const PLATFORM_FEATURES_KEY = "platform_features";

export const PLATFORM_FEATURE_GROUPS = [
  {
    id: "access",
    label: "Access",
    description: "Who can sign in or create an account.",
    features: [
      {
        id: "login",
        label: "Login",
        description: "Member, reseller, and enterprise sign-in. Staff can always sign in.",
      },
      {
        id: "register",
        label: "Register",
        description: "Public signup, including Google sign-up for new accounts.",
      },
      {
        id: "password_reset",
        label: "Password reset",
        description: "Forgot-password and reset-password flow.",
      },
      {
        id: "google_signin",
        label: "Google sign-in",
        description: "Continue with Google on login and signup.",
        requires: ["google"] as const,
      },
    ],
  },
  {
    id: "messaging",
    label: "Messaging",
    description: "Sending SMS from the dashboard, campaigns, and API.",
    features: [
      {
        id: "sms",
        label: "SMS",
        description: "Send SMS from the dashboard and the REST API.",
      },
      {
        id: "bulk_sms",
        label: "Bulk SMS",
        description: "Campaigns and scheduled bulk sends.",
        requires: ["sms"] as const,
      },
      {
        id: "otp_api",
        label: "OTP API",
        description: "Programmatic OTP send via /api/v1/otp.",
        requires: ["sms"] as const,
      },
      {
        id: "sender_id_registration",
        label: "Sender ID registration",
        description: "Members can submit new Sender IDs for approval.",
      },
      {
        id: "contacts",
        label: "Contacts",
        description: "Contact lists and groups.",
      },
      {
        id: "templates",
        label: "Templates",
        description: "Saved SMS templates.",
      },
    ],
  },
  {
    id: "billing",
    label: "Billing",
    description: "Wallet funding and invoices.",
    features: [
      {
        id: "wallet_topup",
        label: "Wallet top-up",
        description: "Members can add money to their wallet.",
      },
      {
        id: "paystack",
        label: "Paystack",
        description: "Paystack checkout for wallet top-ups.",
        requires: ["wallet_topup"] as const,
      },
      {
        id: "stripe",
        label: "Stripe",
        description: "Stripe checkout for wallet top-ups.",
        requires: ["wallet_topup"] as const,
      },
      {
        id: "invoices",
        label: "Invoices",
        description: "Member invoice history.",
      },
      {
        id: "transactions",
        label: "Transactions",
        description: "Wallet and credit transaction history.",
      },
    ],
  },
  {
    id: "google",
    label: "Google",
    description: "Master switch plus each Google product.",
    features: [
      {
        id: "google",
        label: "All Google features",
        description: "Turns off Google sign-in, Forms, Sheets, Contacts, and Drive together.",
      },
      {
        id: "google_forms",
        label: "Google Forms SMS",
        description: "Send SMS from Google Form responses.",
        requires: ["google"] as const,
      },
      {
        id: "google_sheets",
        label: "Google Sheets",
        description: "Import sheets and export responses.",
        requires: ["google"] as const,
      },
      {
        id: "google_contacts",
        label: "Google Contacts",
        description: "Import and export Google Contacts.",
        requires: ["google"] as const,
      },
      {
        id: "google_drive",
        label: "Google Drive",
        description: "Browse Drive files for SMS lists.",
        requires: ["google"] as const,
      },
    ],
  },
  {
    id: "smart_forms",
    label: "Smart Forms",
    description: "Native SplitSMS forms and each form tool.",
    features: [
      {
        id: "smart_forms",
        label: "Smart Forms",
        description: "The Smart Forms product. Turns off every form tool below.",
      },
      {
        id: "smart_forms_builder",
        label: "Form builder",
        description: "Create and edit forms.",
        requires: ["smart_forms"] as const,
      },
      {
        id: "smart_forms_templates",
        label: "Form templates",
        description: "Start from a saved template.",
        requires: ["smart_forms"] as const,
      },
      {
        id: "smart_forms_automation",
        label: "Form automation",
        description: "SMS follow-ups when someone submits.",
        requires: ["smart_forms"] as const,
      },
      {
        id: "smart_forms_analytics",
        label: "Form analytics",
        description: "Per-form charts and conversion stats.",
        requires: ["smart_forms"] as const,
      },
      {
        id: "smart_forms_reports",
        label: "Form reports",
        description: "Download and email form reports.",
        requires: ["smart_forms"] as const,
      },
      {
        id: "smart_forms_share",
        label: "Form sharing",
        description: "Public links, embed, and QR share.",
        requires: ["smart_forms"] as const,
      },
    ],
  },
  {
    id: "integrations",
    label: "Integrations",
    description: "APIs, plugins, and connected apps.",
    features: [
      {
        id: "wordpress",
        label: "WordPress",
        description: "WordPress plugin connect and events.",
      },
      {
        id: "developers",
        label: "Developers",
        description: "Developer docs, keys, and API console in the member portal.",
      },
      {
        id: "api_keys",
        label: "App connections",
        description: "Create and manage API keys.",
      },
      {
        id: "connect",
        label: "Connect",
        description: "Webhooks and Connect customers.",
      },
      {
        id: "api_logs",
        label: "API logs",
        description: "Member API request logs in the dashboard.",
        requires: ["developers"] as const,
      },
      {
        id: "automation",
        label: "Automation",
        description: "Dashboard automation rules.",
      },
    ],
  },
  {
    id: "account",
    label: "Account",
    description: "Reports, help, and pricing inside the member portal.",
    features: [
      {
        id: "reports",
        label: "Message results",
        description: "Delivery and send result reports.",
      },
      {
        id: "account_reports",
        label: "My reports",
        description: "Account-level scheduled reports.",
      },
      {
        id: "support",
        label: "Help & support",
        description: "Member support inbox.",
      },
      {
        id: "pricing",
        label: "In-app pricing",
        description: "SMS pricing page inside the dashboard.",
      },
    ],
  },
] as const;

export type PlatformFeatureGroupId = (typeof PLATFORM_FEATURE_GROUPS)[number]["id"];

export type PlatformFeatureId =
  (typeof PLATFORM_FEATURE_GROUPS)[number]["features"][number]["id"];

export type PlatformFeatureFlags = Record<PlatformFeatureId, boolean>;

type FeatureDef = {
  id: PlatformFeatureId;
  label: string;
  description: string;
  requires?: readonly PlatformFeatureId[];
};

const FEATURE_BY_ID: Record<PlatformFeatureId, FeatureDef> = Object.fromEntries(
  PLATFORM_FEATURE_GROUPS.flatMap((group) =>
    group.features.map((feature) => [feature.id, feature]),
  ),
) as Record<PlatformFeatureId, FeatureDef>;

export const PLATFORM_FEATURE_IDS = Object.keys(FEATURE_BY_ID) as PlatformFeatureId[];

export function defaultPlatformFeatureFlags(): PlatformFeatureFlags {
  return Object.fromEntries(PLATFORM_FEATURE_IDS.map((id) => [id, true])) as PlatformFeatureFlags;
}

export function isPlatformFeatureId(value: string): value is PlatformFeatureId {
  return value in FEATURE_BY_ID;
}

export function platformFeatureRequires(id: PlatformFeatureId): readonly PlatformFeatureId[] {
  return FEATURE_BY_ID[id]?.requires ?? [];
}

export function featureDisabledMessage(id: PlatformFeatureId) {
  return `${platformFeatureLabel(id)} is turned off right now.`;
}

function selfEnabled(flags: PlatformFeatureFlags, id: PlatformFeatureId) {
  return flags[id] !== false;
}

/** Stored switch plus any parent switches (e.g. Google Forms needs All Google). */
export function isFeatureEnabledIn(
  flags: PlatformFeatureFlags,
  id: PlatformFeatureId,
): boolean {
  if (!selfEnabled(flags, id)) return false;
  const parents = FEATURE_BY_ID[id]?.requires ?? [];
  return parents.every((parent) => isFeatureEnabledIn(flags, parent));
}

export function parsePlatformFeatureFlags(value: unknown): PlatformFeatureFlags {
  const defaults = defaultPlatformFeatureFlags();
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaults;
  const raw = value as Record<string, unknown>;
  for (const id of PLATFORM_FEATURE_IDS) {
    if (typeof raw[id] === "boolean") defaults[id] = raw[id];
  }
  return defaults;
}

export function staffBypassesPlatformFeatures(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

const DASHBOARD_FEATURE_ROUTES: { prefix: string; feature: PlatformFeatureId }[] = [
  { prefix: "/dashboard/integrations/google/forms", feature: "google_forms" },
  { prefix: "/dashboard/integrations/google", feature: "google" },
  { prefix: "/dashboard/integrations/wordpress", feature: "wordpress" },
  { prefix: "/dashboard/forms/templates", feature: "smart_forms_templates" },
  { prefix: "/dashboard/forms/create", feature: "smart_forms_builder" },
  { prefix: "/dashboard/send", feature: "sms" },
  { prefix: "/dashboard/campaigns", feature: "bulk_sms" },
  { prefix: "/dashboard/contacts", feature: "contacts" },
  { prefix: "/dashboard/templates", feature: "templates" },
  { prefix: "/dashboard/forms", feature: "smart_forms" },
  { prefix: "/dashboard/api-keys", feature: "api_keys" },
  { prefix: "/dashboard/connect", feature: "connect" },
  { prefix: "/dashboard/automation", feature: "automation" },
  { prefix: "/dashboard/account-reports", feature: "account_reports" },
  { prefix: "/dashboard/reports", feature: "reports" },
  { prefix: "/dashboard/invoices", feature: "invoices" },
  { prefix: "/dashboard/transactions", feature: "transactions" },
  { prefix: "/dashboard/api-logs", feature: "api_logs" },
  { prefix: "/dashboard/support", feature: "support" },
  { prefix: "/dashboard/pricing", feature: "pricing" },
  { prefix: "/developers", feature: "developers" },
];

export function featureForPath(pathname: string): PlatformFeatureId | null {
  if (pathname.startsWith("/dashboard/forms/") && pathname.includes("/builder")) {
    return "smart_forms_builder";
  }
  if (pathname.startsWith("/dashboard/forms/") && pathname.includes("/automation")) {
    return "smart_forms_automation";
  }
  if (pathname.startsWith("/dashboard/forms/") && pathname.includes("/analytics")) {
    return "smart_forms_analytics";
  }
  if (pathname.startsWith("/dashboard/forms/") && pathname.includes("/report")) {
    return "smart_forms_reports";
  }
  if (pathname.startsWith("/dashboard/forms/") && pathname.includes("/share")) {
    return "smart_forms_share";
  }
  for (const route of DASHBOARD_FEATURE_ROUTES) {
    if (pathname === route.prefix || pathname.startsWith(`${route.prefix}/`)) {
      return route.feature;
    }
  }
  return null;
}

export function paymentMethodFeature(
  method: string,
): PlatformFeatureId | null {
  if (method === "PAYSTACK") return "paystack";
  if (method === "STRIPE") return "stripe";
  return null;
}
