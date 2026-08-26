import {
  BookOpen,
  Code2,
  CreditCard,
  KeyRound,
  LifeBuoy,
  MessageSquareWarning,
  Plug,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export const supportCategories = [
  { value: "bug", label: "Bug report" },
  { value: "error", label: "Error or outage" },
  { value: "billing", label: "Billing & wallet" },
  { value: "api", label: "API & integrations" },
  { value: "wordpress", label: "WordPress plugin" },
  { value: "account", label: "Account access" },
  { value: "feature", label: "Feature request" },
  { value: "other", label: "Other" },
] as const;

export type SupportCategory = (typeof supportCategories)[number]["value"];

const topicAliases: Record<string, SupportCategory> = {
  bug: "bug",
  error: "error",
  outage: "error",
  billing: "billing",
  wallet: "billing",
  credits: "billing",
  api: "api",
  otp: "api",
  webhook: "api",
  wordpress: "wordpress",
  plugin: "wordpress",
  woo: "wordpress",
  woocommerce: "wordpress",
  account: "account",
  sender: "account",
  "sender-id": "account",
  login: "account",
  feature: "feature",
  other: "other",
};

export function resolveSupportCategory(topic?: string | null): SupportCategory | undefined {
  if (!topic) return undefined;
  return topicAliases[topic.trim().toLowerCase()];
}

export const supportFaqs: { question: string; answer: string }[] = [
  {
    question: "How long until someone replies?",
    answer:
      "We read tickets in Accra business hours (Monday–Friday) and usually reply the same day, or the next working morning. There is no phone queue. Logged-in members can also open a ticket from the dashboard so the thread stays on the account.",
  },
  {
    question: "My Sender ID is still pending. Is that a support issue?",
    answer:
      "Sender IDs go through network approval. That is often hours, sometimes a couple of days — not a broken form. If it has sat more than two working days, send a ticket with the exact ID and the time you submitted it. Do not keep blasting from an unapproved ID; those messages fail quietly.",
  },
  {
    question: "Credits left the wallet but the SMS never arrived.",
    answer:
      "Check the campaign or API log for the message ID, destination number (with country code), timestamp, and status. DND, a wrong prefix (0 vs 233), or an unapproved Sender ID are the usual Ghana culprits. Paste those details in the form so we are not guessing from a screenshot of the compose box.",
  },
  {
    question: "The WordPress plugin is installed but checkout SMS is silent.",
    answer:
      "Confirm the live API key (not sandbox), that the site can reach api.splitsms.com, and that the WooCommerce / Paystack event is actually enabled. Include your WordPress version, plugin version, and one failed order ID. Docs live under Integrations → WordPress.",
  },
  {
    question: "Can you refund unused credits?",
    answer:
      "Wallet top-ups are for sending SMS. If a payment captured twice, or a top-up never landed, write in with the Paystack reference and we will trace it. We do not cash out leftover credits for a change of mind.",
  },
];

export const supportFastPaths: {
  href: string;
  title: string;
  body: string;
  icon: LucideIcon;
  featured?: boolean;
}[] = [
  {
    href: "/docs",
    title: "Platform docs",
    body: "Campaigns, contacts, Sender IDs, and the first send — read this before you wait on email.",
    icon: BookOpen,
    featured: true,
  },
  {
    href: "/api-docs",
    title: "API reference",
    body: "Auth, send, balance, webhooks, and sandbox keys.",
    icon: Code2,
  },
  {
    href: "/integrations/wordpress",
    title: "WordPress plugin",
    body: "WooCommerce, Paystack, and form plugins.",
    icon: Plug,
  },
  {
    href: "/changelog",
    title: "Changelog",
    body: "What shipped, and what might explain a new error.",
    icon: ScrollText,
  },
  {
    href: "/dashboard/support",
    title: "Dashboard tickets",
    body: "Already logged in? Keep the thread on your account.",
    icon: LifeBuoy,
  },
];

export const supportTopics: {
  href: string;
  title: string;
  body: string;
  icon: LucideIcon;
}[] = [
  {
    href: "/support?topic=sender-id#contact",
    title: "Sender ID",
    body: "Pending, rejected, or showing as a number.",
    icon: KeyRound,
  },
  {
    href: "/support?topic=billing#contact",
    title: "Wallet & billing",
    body: "Paystack top-up, missing credits, invoices.",
    icon: CreditCard,
  },
  {
    href: "/support?topic=error#contact",
    title: "Failed or silent SMS",
    body: "Campaign sent, phone stayed quiet.",
    icon: MessageSquareWarning,
  },
  {
    href: "/support?topic=api#contact",
    title: "API & OTP",
    body: "401s, webhooks, sandbox vs live.",
    icon: Code2,
  },
  {
    href: "/support?topic=wordpress#contact",
    title: "WordPress / Woo",
    body: "Plugin, checkout texts, form actions.",
    icon: Plug,
  },
  {
    href: "/support?topic=account#contact",
    title: "Login & account",
    body: "OTP to sign in, 2FA, locked users.",
    icon: LifeBuoy,
  },
];
