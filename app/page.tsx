import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HomePageContent } from "@/components/marketing/home-page-content";
import {
  organizationJsonLd,
  siteName,
  siteUrl,
  websiteJsonLd,
  defaultKeywords,
} from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "SplitSMS — Bulk SMS Platform & SMS API | 190+ Countries",
  description:
    "Send bulk SMS, OTP, and marketing campaigns worldwide. Affordable SMS gateway, REST API, pay-as-you-go pricing, and 5 free SMS credits on signup.",
  keywords: defaultKeywords,
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "SplitSMS — Send SMS at Scale | Bulk SMS Worldwide",
    description:
      "Bulk SMS campaigns, OTP API, webhooks, and transparent pricing. The modern SMS platform for 190+ countries.",
    url: siteUrl,
    siteName,
    type: "website",
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: "SplitSMS — Bulk SMS & SMS API Made Simple",
    description:
      "Affordable bulk SMS worldwide. Campaigns, OTP, API & 5 free credits.",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    websiteJsonLd,
    organizationJsonLd,
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/#webpage`,
      url: siteUrl,
      name: "SplitSMS — Bulk SMS Platform & SMS API",
      description:
        "Send bulk SMS, OTP, and marketing campaigns. Affordable SMS gateway for Ghana and 190+ countries.",
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: siteName,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0.029",
        priceCurrency: "GHS",
        description: "Per SMS segment from, country-dependent",
      },
      featureList: [
        "Bulk SMS campaigns",
        "SMS OTP API",
        "REST SMS API",
        "Delivery webhooks",
        "Contact CSV import",
        "Sender ID registration",
        "Paystack SMS wallet",
        "WooCommerce SMS plugin",
        "190+ country SMS delivery",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is SplitSMS and how do I send SMS?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "SplitSMS is a bulk SMS platform. Sign up, top up, register a Sender ID, then send SMS from the dashboard or REST API with free starter credits.",
          },
        },
        {
          "@type": "Question",
          name: "How much does SMS cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "SMS rates vary by destination country on SplitSMS with transparent per-country pricing on the pricing page.",
          },
        },
        {
          "@type": "Question",
          name: "Do you provide an SMS API for developers?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. REST API for send SMS, OTP, wallet, contacts, campaigns, and webhooks with sandbox testing.",
          },
        },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <HomePageContent />
      </main>
      <SiteFooter />
    </div>
  );
}
