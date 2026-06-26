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
  absoluteTitle: "SplitSMS — Bulk SMS Platform & SMS API | 190+ Countries",
  title: "Bulk SMS Platform & SMS API",
  description:
    "Send bulk SMS, OTP, and marketing campaigns worldwide. Affordable SMS gateway, REST SMS API, webhooks, Smart Forms, and 5 free SMS credits on signup.",
  path: "/",
  keywords: [
    "bulk SMS",
    "bulk SMS Ghana",
    "bulk SMS Nigeria",
    "SMS API",
    "SMS gateway",
    "OTP SMS API",
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
