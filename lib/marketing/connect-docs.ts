/** Anchor IDs and copy for /docs/connect — no upstream carrier names in public copy. */

export const connectDocsMeta = {
  version: "2.0",
  lastUpdated: "2026-05-31",
};

export const connectDocSections = [
  { id: "overview", title: "Overview" },
  { id: "use-cases", title: "Use cases" },
  { id: "how-it-works", title: "How it works" },
  { id: "getting-started", title: "Getting started" },
  { id: "provision-customers", title: "Provision customers" },
  { id: "sender-ids", title: "Sender IDs" },
  { id: "routing", title: "Smart routing" },
  { id: "permissions", title: "API permissions" },
  { id: "dashboard", title: "Partner dashboard" },
  { id: "wordpress", title: "WordPress & stores" },
  { id: "faq", title: "FAQ" },
] as const;

export const connectFaqs = [
  {
    q: "What is SplitSMS Connect?",
    a: "Connect is SplitSMS’s partner API for embedding SMS inside your own product. You provision sub-accounts with wallets and SMS credits, register sender IDs on their behalf, and send messages through the same delivery network as the main SplitSMS dashboard — without building carrier integrations yourself.",
  },
  {
    q: "Who should use Connect?",
    a: "SaaS platforms, marketplaces, agencies, and resellers that need per-customer SMS billing, branded sender IDs, or automated onboarding. It is also useful when you already use SplitSMS on WordPress and want a unified API for multiple client sites.",
  },
  {
    q: "How do I map Connect customers to my database?",
    a: "Pass external_ref when you create a customer. SplitSMS stores it on the Connect link record. You can fetch customers by Connect id, SplitSMS user id, or external_ref via GET /api/v1/connect/customers/{id}.",
  },
  {
    q: "Do Connect customers get their own login?",
    a: "Yes. Each provisioned customer is a full SplitSMS member account linked to your partner account. You control initial credits and wallet balance; they can use the dashboard, API keys, and WordPress plugin under your partnership model.",
  },
  {
    q: "Which API permission do I need?",
    a: "Customer provisioning requires connect.customers on your partner API key. Sending SMS uses sms.send on the partner key or the customer’s own key. Sender ID registration uses sender_ids.read and sender_ids.write.",
  },
];
