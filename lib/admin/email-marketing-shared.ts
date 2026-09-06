import { getSiteUrl, siteName, supportEmail } from "@/lib/site-config";

export const EMAIL_MARKETING_MAX_RECIPIENTS = 200;
export const EMAIL_MARKETING_NEWSLETTER_MAX_RECIPIENTS = 5000;
export const EMAIL_MARKETING_INACTIVE_DAYS_DEFAULT = 30;

export const EMAIL_MARKETING_SITE_IMAGES = [
  { href: "/og.png", label: "Homepage banner" },
  { href: "/logo.png", label: "Logo" },
  { href: "/icon.png", label: "App icon" },
  { href: "/smslogo-dark.png", label: "SMS mark" },
] as const;

export type EmailMarketingAudienceType =
  | "all"
  | "inactive"
  | "role_member"
  | "role_reseller"
  | "role_enterprise"
  | "manual"
  | "newsletter";

export type EmailMarketingTemplateSeed = {
  slug: string;
  name: string;
  description: string;
  category: "feature" | "reengagement" | "newsletter" | "custom";
  subject: string;
  preheader: string;
  headline: string;
  bodyText: string;
  ctaLabel: string;
  ctaHref: string;
  footerNote: string;
  imageUrl?: string;
};

export const EMAIL_MARKETING_SYSTEM_TEMPLATES: EmailMarketingTemplateSeed[] = [
  {
    slug: "smart-forms",
    name: "SmartForms",
    description: "Promote lead-capture forms with SMS follow-up",
    category: "feature",
    subject: "Capture leads with SplitSMS SmartForms",
    preheader: "Forms that collect data and trigger SMS automatically",
    headline: "Turn every form into a conversation",
    bodyText: `SmartForms lets you build branded forms that collect responses and trigger SMS follow-ups — without writing code.

Use them for registrations, bookings, support intake, or lead capture. Responses land in your dashboard, and you can automate SMS confirmations instantly.

Ready to try it on your next campaign?`,
    ctaLabel: "Explore SmartForms",
    ctaHref: "/smart-forms",
    footerNote: "You are receiving this because you have a SplitSMS account.",
    imageUrl: "/og.png",
  },
  {
    slug: "reseller",
    name: "Reseller platform",
    description: "Invite partners to white-label SMS under their brand",
    category: "feature",
    subject: "Grow revenue with the SplitSMS Reseller platform",
    preheader: "White-label SMS, your pricing, your customers",
    headline: "Sell SMS under your own brand",
    bodyText: `Our Reseller platform lets you offer SMS to your customers with your branding, your pricing, and your margins.

Manage sub-accounts, monitor usage, and scale without building carrier integrations yourself.

If you serve agencies, schools, churches, or businesses — this is built for you.`,
    ctaLabel: "Become a Reseller",
    ctaHref: "/reseller-platform",
    footerNote: "You are receiving this because you have a SplitSMS account.",
    imageUrl: "/logo.png",
  },
  {
    slug: "bulk-sms",
    name: "Bulk SMS",
    description: "Highlight reliable bulk messaging and campaigns",
    category: "feature",
    subject: "Send Bulk SMS campaigns with SplitSMS",
    preheader: "Reach thousands with reliable delivery across Africa",
    headline: "Bulk SMS that actually delivers",
    bodyText: `SplitSMS makes it simple to send personalised Bulk SMS to your contacts and groups.

Upload lists, schedule campaigns, track delivery, and manage Sender IDs — all from one dashboard.

Whether you are announcing an offer or sending reminders, you stay in control of every message.`,
    ctaLabel: "Start a campaign",
    ctaHref: "/dashboard/campaigns",
    footerNote: "You are receiving this because you have a SplitSMS account.",
    imageUrl: "/og.png",
  },
  {
    slug: "wordpress-plugin",
    name: "WordPress plugin",
    description: "Promote SMS from WordPress and WooCommerce",
    category: "feature",
    subject: "Send SMS from WordPress with SplitSMS",
    preheader: "Official plugin for notifications, OTP, and WooCommerce alerts",
    headline: "SMS for your WordPress site",
    bodyText: `Install the official SplitSMS WordPress plugin and send SMS from your site in minutes.

Use it for order alerts, OTP login, form notifications, and customer updates — powered by the same reliable routes as the SplitSMS dashboard.

One plugin. Your existing WordPress workflow.`,
    ctaLabel: "Get the WordPress plugin",
    ctaHref: "/docs/wordpress",
    footerNote: "You are receiving this because you have a SplitSMS account.",
    imageUrl: "/icon.png",
  },
  {
    slug: "sms-schools",
    name: "SMS for Schools",
    description: "Promote attendance alerts and parent updates for schools",
    category: "feature",
    subject: "Keep parents informed with SplitSMS for Schools",
    preheader: "Attendance alerts, fee reminders, and exam updates by SMS",
    headline: "Reach every parent, instantly",
    bodyText: `Schools use SplitSMS to send attendance alerts, fee reminders, exam schedules, and emergency notices straight to parents' phones — no app required.

Upload your class or school-wide contact list, personalise each message with the student's name, and track delivery in real time.

From a single class update to a school-wide closure notice, your message reaches every parent in minutes.`,
    ctaLabel: "Set up school messaging",
    ctaHref: "/dashboard/campaigns",
    footerNote: "You are receiving this because you have a SplitSMS account.",
    imageUrl: "/og.png",
  },
  {
    slug: "sms-churches",
    name: "Churches",
    description: "Promote service reminders and congregation updates",
    category: "feature",
    subject: "Reach your congregation with SplitSMS",
    preheader: "Service reminders, event updates, and giving prompts by SMS",
    headline: "Keep your congregation connected",
    bodyText: `Churches and ministries use SplitSMS to send service reminders, event invitations, prayer requests, and giving prompts directly to members' phones.

Group contacts by department or unit, schedule messages ahead of a service or program, and see exactly who received your update.

Whether it is a Sunday reminder or an urgent announcement, your congregation hears from you first.`,
    ctaLabel: "Start messaging your church",
    ctaHref: "/dashboard/campaigns",
    footerNote: "You are receiving this because you have a SplitSMS account.",
    imageUrl: "/logo.png",
  },
  {
    slug: "app-integration",
    name: "App",
    description: "Promote the SplitSMS API for developers building apps",
    category: "feature",
    subject: "Add SMS to your app with the SplitSMS API",
    preheader: "OTP, alerts, and notifications from your own codebase",
    headline: "SMS, wired straight into your app",
    bodyText: `The SplitSMS API lets your app send OTP codes, transaction alerts, and notifications the moment something happens — no manual sending required.

Generate an API key from your dashboard, follow the docs, and go from first request to delivered SMS in minutes. The same reliable routes that power the SplitSMS dashboard back every call.

Already have a WordPress site instead? The official plugin covers that path too.`,
    ctaLabel: "View API docs",
    ctaHref: "/developers",
    footerNote: "You are receiving this because you have a SplitSMS account.",
    imageUrl: "/icon.png",
  },
  {
    slug: "google-forms",
    name: "Google Forms feature",
    description: "Promote SMS automation triggered by Google Forms responses",
    category: "feature",
    subject: "Turn Google Forms responses into instant SMS",
    preheader: "Connect a form and text respondents automatically",
    headline: "Every form submission, followed by an SMS",
    bodyText: `Connect a Google Form to SplitSMS and every new response can trigger an automatic SMS — a confirmation, a reminder, or a next step.

No code needed: link your Google Sheet, map the phone number column, and SplitSMS handles the rest. Responses also appear in your dashboard alongside delivery status.

Perfect for registrations, RSVPs, applications, or support intake forms.`,
    ctaLabel: "Connect Google Forms",
    ctaHref: "/dashboard/integrations/google/forms",
    footerNote: "You are receiving this because you have a SplitSMS account.",
    imageUrl: "/smslogo-dark.png",
  },
  {
    slug: "inactive-reengagement",
    name: "Inactive re-engagement",
    description: "Win back members who have not been active lately",
    category: "reengagement",
    subject: "We miss you on SplitSMS",
    preheader: "Your account is ready whenever you are",
    headline: "Come back — your SMS workspace is waiting",
    bodyText: `It has been a while since we saw activity on your SplitSMS account.

Your dashboard, contacts, and Sender IDs are still here. Top up credits when you are ready and send your next campaign in minutes.

Need a hand getting started again? Reply or contact support — we are happy to help.`,
    ctaLabel: "Open dashboard",
    ctaHref: "/dashboard",
    footerNote: "You are receiving this because you have a SplitSMS account.",
    imageUrl: "/logo.png",
  },
  {
    slug: "custom",
    name: "Custom blank",
    description: "Start from a clean marketing shell",
    category: "custom",
    subject: `A message from ${siteName}`,
    preheader: "News and updates from SplitSMS",
    headline: "Hello from SplitSMS",
    bodyText: `Write your marketing message here.

Share what is new, what your audience should do next, and why it matters.`,
    ctaLabel: "Learn more",
    ctaHref: "/",
    footerNote: "You are receiving this because you have a SplitSMS account.",
    imageUrl: "/og.png",
  },
  {
    slug: "newsletter-welcome",
    name: "Newsletter welcome",
    description: "Automation sent when someone joins the newsletter list",
    category: "newsletter",
    subject: "You're on the SplitSMS newsletter",
    preheader: "Product notes, delivery tips, and SMS ideas — no spam",
    headline: "Welcome to the SplitSMS list",
    bodyText: `Thanks for subscribing. We'll send practical notes on bulk SMS, SmartForms, and delivery across Africa — not a daily inbox dump.

You can explore the dashboard, docs, and pricing any time. If this wasn't you, use the unsubscribe link in this email.`,
    ctaLabel: "Open SplitSMS",
    ctaHref: "/",
    footerNote: "You subscribed to the SplitSMS newsletter.",
    imageUrl: "/og.png",
  },
  {
    slug: "newsletter-whats-new",
    name: "Newsletter: what's new",
    description: "Feature roundup for the newsletter list",
    category: "newsletter",
    subject: "What's new at SplitSMS",
    preheader: "Smarter forms, faster campaigns, clearer reports",
    headline: "New tools for your next campaign",
    bodyText: `Here's what teams are using this month:

• SmartForms that capture leads and fire SMS follow-ups
• Bulk campaigns with delivery tracking
• Reseller tools if you sell SMS under your own brand

Tap below to try the one that fits your workflow.`,
    ctaLabel: "See features",
    ctaHref: "/features",
    footerNote: "You are receiving this because you subscribed to the SplitSMS newsletter.",
    imageUrl: "/logo.png",
  },
  {
    slug: "newsletter-delivery",
    name: "Newsletter: delivery",
    description: "How SplitSMS routes messages across Africa",
    category: "newsletter",
    subject: "How SplitSMS delivers across Africa",
    preheader: "Routes, Sender IDs, and delivery you can actually track",
    headline: "Delivery that holds up at volume",
    bodyText: `Reliable bulk SMS is routing, not luck. SplitSMS sends through primary and fallback routes so OTP, alerts, and campaigns keep moving.

Upload a list, pick a Sender ID, and watch delivery land in the dashboard — then reuse the same path from the API or WordPress.`,
    ctaLabel: "View coverage",
    ctaHref: "/features",
    footerNote: "You are receiving this because you subscribed to the SplitSMS newsletter.",
    imageUrl: "/og.png",
  },
  {
    slug: "newsletter-smart-forms",
    name: "Newsletter: SmartForms",
    description: "Promote lead-capture forms to newsletter subscribers",
    category: "newsletter",
    subject: "Capture leads with SmartForms",
    preheader: "Forms that collect data and trigger SMS automatically",
    headline: "Turn a form into a conversation",
    bodyText: `SmartForms collect registrations, bookings, and support requests — then send SMS confirmations without extra tools.

Build the form, point it at a phone field, and let SplitSMS handle the follow-up.`,
    ctaLabel: "Try SmartForms",
    ctaHref: "/smart-forms",
    footerNote: "You are receiving this because you subscribed to the SplitSMS newsletter.",
    imageUrl: "/icon.png",
  },
];

export function resolveMarketingCtaHref(href: string | null | undefined): string | undefined {
  if (!href?.trim()) return undefined;
  const raw = href.trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  const path = raw.startsWith("/") ? raw : `/${raw}`;
  return `${getSiteUrl()}${path}`;
}

export function defaultMarketingContactLine() {
  return supportEmail
    ? `Questions? Contact us at ${supportEmail}`
    : `Visit ${getSiteUrl()} for more.`;
}

export function interpolateMarketing(
  template: string,
  vars: { firstName: string; fullName: string; siteName: string; siteUrl: string },
) {
  return template
    .replace(/\{\{firstName\}\}/g, vars.firstName)
    .replace(/\{\{fullName\}\}/g, vars.fullName)
    .replace(/\{\{siteName\}\}/g, vars.siteName)
    .replace(/\{\{siteUrl\}\}/g, vars.siteUrl);
}

export function buildMarketingVars(fullName: string) {
  const trimmed = fullName.trim() || "there";
  const firstName = trimmed.split(/\s+/)[0] || "there";
  return {
    firstName,
    fullName: trimmed,
    siteName,
    siteUrl: getSiteUrl(),
  };
}
