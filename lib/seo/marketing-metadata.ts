import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const pricingPageMetadata: Metadata = buildPageMetadata({
  absoluteTitle: "SMS Pricing by Country — Transparent Bulk SMS Rates | SplitSMS",
  title: "SMS Pricing by Country",
  description:
    "View SplitSMS bulk SMS pricing per country. Select your destination, see per-segment rates, credits, and provider. Pay-as-you-go with no hidden fees.",
  path: "/pricing",
  keywords: [
    "SMS pricing Ghana",
    "bulk SMS rates",
    "SMS pricing Nigeria",
    "cheap bulk SMS",
    "SMS cost per message",
    "pay as you go SMS",
    "SplitSMS pricing",
  ],
});

export const featuresPageMetadata: Metadata = buildPageMetadata({
  absoluteTitle:
    "Bulk SMS Features — Campaigns, OTP API, Google & Ghana Pricing | SplitSMS",
  title: "Bulk SMS Features",
  description:
    "Discover SplitSMS features: bulk SMS campaigns, Google Contacts/Sheets/Forms, contact management, OTP API, delivery webhooks, WooCommerce plugin, and rates from GHS 0.029 in Ghana.",
  path: "/features",
  keywords: [
    "bulk SMS Ghana",
    "bulk SMS features",
    "Google Forms SMS",
    "Google Sheets SMS",
    "SMS marketing platform",
    "SMS API Africa",
    "OTP SMS API",
    "transactional SMS",
    "WooCommerce SMS notifications",
    "SplitSMS",
  ],
});

export const blogIndexMetadata: Metadata = {
  ...buildPageMetadata({
    title: "Blog — Bulk SMS Tips, Guides & SMS Marketing",
    description:
      "SplitSMS blog: bulk SMS marketing, WooCommerce SMS, OTP API guides, Ghana & Nigeria SMS pricing, WordPress plugin setup, compliance, and business stories.",
    path: "/blog",
    keywords: [
      "bulk SMS blog",
      "SMS marketing Ghana",
      "SMS API guide",
      "WordPress SMS plugin",
      "WooCommerce SMS",
      "OTP SMS",
      "SplitSMS blog",
    ],
  }),
  alternates: {
    canonical: "/blog",
    types: {
      "application/rss+xml": "/blog/feed.xml",
    },
  },
};

export const integrationsHubMetadata: Metadata = buildPageMetadata({
  title: "Integrations — Google, WordPress, Paystack & More",
  description:
    "Connect SplitSMS to Google Contacts, Sheets, Forms, WordPress, Crocoblock, WooCommerce, Paystack, Flutterwave, and Elementor. Setup guides and SMS billing explained.",
  path: "/integrations",
  keywords: [
    "Google Forms SMS",
    "Google Sheets SMS",
    "Google Contacts SMS",
    "WordPress SMS plugin",
    "WooCommerce SMS",
    "Paystack SMS",
    "Flutterwave SMS",
    "Elementor SMS",
    "SplitSMS integrations",
  ],
});

export const docsHubMetadata: Metadata = buildPageMetadata({
  title: "Documentation — SplitSMS Guides & Tutorials",
  description:
    "SplitSMS documentation: getting started, dashboard, messaging standards, REST API, WordPress plugin, security, SDKs, and troubleshooting.",
  path: "/docs",
});

export const docsApiMetadata: Metadata = buildPageMetadata({
  title: "API Documentation — SplitSMS Connect REST API",
  description:
    "REST API for SMS send, OTP, wallet balance, sender IDs, Connect customer provisioning, and WordPress sync.",
  path: "/docs/api",
});

export const docsMobileMetadata: Metadata = buildPageMetadata({
  title: "Mobile SDK — Flutter SMS Integration",
  description:
    "Install the SplitSMS Flutter SDK to send SMS, verify OTP, and manage wallet balance from iOS and Android apps.",
  path: "/docs/mobile",
});

export const docsConnectMetadata: Metadata = buildPageMetadata({
  title: "SplitSMS Connect — Embed SMS API for SaaS & Partners",
  description:
    "Provision customer accounts, wallets, and sender IDs via REST API. White-label SMS for SaaS platforms, agencies, and marketplaces.",
  path: "/docs/connect",
  keywords: [
    "SplitSMS Connect",
    "embed SMS API",
    "white label SMS",
    "SMS reseller API",
    "SaaS SMS integration",
  ],
});

export const sdkPageMetadata: Metadata = buildPageMetadata({
  title: "SDKs — JavaScript, PHP & Flutter",
  description:
    "Official SplitSMS SDKs — npm tarball, Composer repository, and Flutter zip. SMS, OTP, Connect, and sender IDs.",
  path: "/sdk",
  keywords: ["SplitSMS SDK", "SMS API JavaScript", "SMS PHP SDK", "Flutter SMS"],
});

export const smartFormsMetadata: Metadata = buildPageMetadata({
  title: "Smart Forms — Custom Forms with SMS Automation",
  description:
    "Create custom forms, match your brand, share with short links and QR codes, export responses to Google Sheets, and connect Google Forms for SMS confirmations.",
  path: "/smart-forms",
  keywords: [
    "Smart Forms",
    "SMS form confirmation",
    "Google Sheets export forms",
    "Google Forms SMS",
    "QR code forms Ghana",
  ],
});

export const googleFeaturesMetadata: Metadata = buildPageMetadata({
  title: "Google Features — Contacts, Sheets, Forms → SMS",
  description:
    "Connect Google to SplitSMS: import Contacts, pull Sheets from Drive, automate Google Forms → SMS, and export Smart Forms to Google Sheets.",
  path: "/google",
  keywords: [
    "Google SMS integration",
    "Google Contacts bulk SMS",
    "Google Sheets SMS",
    "Google Forms SMS",
    "Smart Forms Google Sheets",
    "SplitSMS Google",
  ],
});

export const supportPageMetadata: Metadata = buildPageMetadata({
  title: "Support — Report Bugs & Get Help",
  description:
    "Submit a support request for SplitSMS — bugs, errors, billing, API, WordPress plugin, and account help.",
  path: "/support",
});

export const companyPageMetadata: Metadata = buildPageMetadata({
  title: "Company — SplitSMS & Tecunit",
  description:
    "Learn about SplitSMS, the bulk SMS platform built by Tecunit. Our mission, values, and commitment to affordable SMS in Africa and worldwide.",
  path: "/company",
});

export const changelogMetadata: Metadata = buildPageMetadata({
  title: "Changelog — SplitSMS Product Updates",
  description:
    "Release notes and product updates for SplitSMS — new features, API changes, integrations, and platform improvements.",
  path: "/changelog",
});

export const privacyMetadata: Metadata = buildPageMetadata({
  title: "Privacy Policy",
  description: "How SplitSMS collects, uses, and protects your personal data.",
  path: "/privacy",
});

export const termsMetadata: Metadata = buildPageMetadata({
  title: "Terms of Service",
  description: "Terms and conditions for using the SplitSMS bulk SMS platform and API.",
  path: "/terms",
});

export const securityMetadata: Metadata = buildPageMetadata({
  title: "Security",
  description:
    "SplitSMS security practices — encryption, access controls, API key handling, and data protection.",
  path: "/security",
});

export const dataProtectionMetadata: Metadata = buildPageMetadata({
  title: "Data Protection",
  description: "SplitSMS data protection policy and compliance information.",
  path: "/data-protection",
});

export function authPageMetadata(
  path:
    | "/login"
    | "/signup"
    | "/forgot-password"
    | "/reset-password"
    | "/verify-otp"
    | "/complete-profile"
    | "/complete-phone",
  title: string,
  description: string,
): Metadata {
  return buildPageMetadata({ title, description, path, noIndex: true });
}
