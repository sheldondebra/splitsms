import type { Metadata } from "next";
import { SiteHeaderWithAccount } from "@/components/layout/site-header-with-account";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomePageContent } from "@/components/marketing/home-page-content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  organizationJsonLd,
  smsServiceJsonLd,
  websiteJsonLd,
  webPageJsonLd,
} from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  absoluteTitle:
    "SplitSMS — SMS Ghana, Bulk SMS API, OTP & WooCommerce | 190+ Countries",
  title: "Bulk SMS Platform & SMS API",
  description:
    "Send SMS in Ghana and 190+ countries — bulk campaigns, OTP API, WooCommerce SMS, Paystack payment texts, mNotify routing, and REST integration. 5 free credits on signup.",
  path: "/",
  keywords: [
    "SMS",
    "SMS Ghana",
    "bulk SMS",
    "bulk SMS Ghana",
    "bulk SMS Nigeria",
    "SMS API",
    "SMS gateway",
    "OTP SMS API",
    "WooCommerce SMS",
    "Paystack SMS",
    "SMS integration",
    "mNotify alternative",
    "Infobip alternative",
    "affordable bulk SMS",
    "international SMS",
    "SMS marketing platform",
    "SplitSMS",
  ],
});

const homeJsonLd = [
  websiteJsonLd,
  organizationJsonLd,
  smsServiceJsonLd,
  webPageJsonLd({
    name: "SplitSMS — Bulk SMS Platform & SMS API",
    description:
      "Send bulk SMS, OTP, and marketing campaigns. Affordable SMS gateway for Ghana, Nigeria, and 190+ countries.",
    path: "/",
  }),
  {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is SplitSMS and how do I send bulk SMS?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SplitSMS is a bulk SMS platform and SMS API. Sign up free, top up your wallet, register a Sender ID, then send SMS from the dashboard or REST API with starter credits included.",
        },
      },
      {
        "@type": "Question",
        name: "How much does bulk SMS cost on SplitSMS?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SMS rates vary by destination country with transparent per-segment pricing on the SplitSMS pricing page — pay-as-you-go with no monthly minimum.",
        },
      },
      {
        "@type": "Question",
        name: "Does SplitSMS provide an SMS API for developers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. SplitSMS offers a REST SMS API for send SMS, OTP verification, wallet balance, contacts, campaigns, delivery webhooks, and SDKs for JavaScript, PHP, and Flutter.",
        },
      },
      {
        "@type": "Question",
        name: "Which countries does SplitSMS support for bulk SMS?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "SplitSMS delivers bulk SMS and OTP to 190+ countries including Ghana, Nigeria, Kenya, South Africa, the UK, and the United States.",
        },
      },
      {
        "@type": "Question",
        name: "Is SplitSMS an mNotify or Infobip alternative?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. SplitSMS routes Ghana SMS through carriers including mNotify and offers a self-serve dashboard, REST API, OTP, WooCommerce plugin, and transparent pricing — a simpler Infobip alternative for Africa-focused teams.",
        },
      },
      {
        "@type": "Question",
        name: "Does SplitSMS support WooCommerce and Paystack SMS?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Install the free SplitSMS WordPress plugin to send WooCommerce order and Paystack payment confirmation SMS when customers checkout on your store.",
        },
      },
      {
        "@type": "Question",
        name: "How do I integrate SMS into my app?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use the SplitSMS REST SMS API with Bearer auth, sandbox keys for testing, and delivery webhooks. See splitsms.com/api-docs or splitsms.com/solutions/sms-integration.",
        },
      },
    ],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <JsonLdScript data={homeJsonLd} />
      <SiteHeaderWithAccount />
      <main className="flex-1">
        <HomePageContent />
      </main>
      <SiteFooter />
    </div>
  );
}
