import type { Metadata } from "next";
import { SiteHeaderWithAccount } from "@/components/layout/site-header-with-account";
import { SiteFooter } from "@/components/layout/site-footer";
import { FeaturesPageContent } from "@/components/marketing/features-page-content";

import { organizationJsonLd, siteUrl, websiteJsonLd } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: "Bulk SMS Features — Campaigns, OTP API, Webhooks & Ghana Pricing | SplitSMS",
  description:
    "Discover SplitSMS features: bulk SMS campaigns, contact management, OTP verification API, delivery webhooks, WooCommerce plugin, and affordable rates from GHS 0.029 in Ghana. Simpler than Infobip for Africa and 190+ countries.",
  keywords: [
    "bulk SMS Ghana",
    "bulk SMS features",
    "SMS marketing platform",
    "SMS API Africa",
    "OTP SMS API",
    "transactional SMS",
    "bulk messaging software",
    "affordable SMS gateway",
    "WooCommerce SMS notifications",
    "SMS campaign scheduling",
    "delivery reports SMS",
    "SplitSMS",
  ],
  openGraph: {
    title: "Why SplitSMS — Bulk SMS Features for Ghana & Global Reach",
    description:
      "Bulk campaigns, OTP API, webhooks, WordPress integration, and pay-as-you-go pricing. The modern SMS platform for marketers and developers.",
    url: `${siteUrl}/features`,
    siteName: "SplitSMS",
    type: "website",
    locale: "en_GH",
  },
  twitter: {
    card: "summary_large_image",
    title: "SplitSMS Features — Bulk SMS Made Simple",
    description:
      "Campaigns, OTP, API, webhooks & Ghana-friendly pricing. Start with 5 free SMS credits.",
  },
  alternates: {
    canonical: "/features",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    websiteJsonLd,
    organizationJsonLd,
    {
      "@type": "WebPage",
      "@id": `${siteUrl}/features#webpage`,
      url: `${siteUrl}/features`,
      name: "SplitSMS Features — Bulk SMS Platform",
      description:
        "Bulk SMS campaigns, OTP API, contact management, webhooks, and affordable pricing for Ghana and 190+ countries.",
      isPartOf: { "@id": `${siteUrl}/#website` },
      about: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: "SplitSMS",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0.029",
        priceCurrency: "GHS",
        description: "Per SMS from, country-dependent rates",
      },
      featureList: [
        "Bulk SMS campaigns",
        "Contact CSV import and groups",
        "SMS OTP send and verify API",
        "Delivery webhooks",
        "REST API and Postman collection",
        "WordPress and WooCommerce plugin",
        "Sender ID registration",
        "Real-time delivery reports",
        "Paystack wallet top-up",
        "Multi-carrier routing with failover",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is bulk SMS and how is SplitSMS different?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Bulk SMS sends one message to many recipients. SplitSMS combines campaigns, Ghana-friendly pricing, APIs, and multi-carrier routing in one simple platform.",
          },
        },
        {
          "@type": "Question",
          name: "Can I send SMS in Ghana and other African countries?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. SplitSMS routes through trusted providers with coverage in Ghana, Nigeria, and 190+ countries with approved Sender IDs.",
          },
        },
        {
          "@type": "Question",
          name: "How much does bulk SMS cost on SplitSMS?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Country-based rates apply; Ghana starts around GHS 0.029 per segment. Pay-as-you-go wallet with free starter credits on signup.",
          },
        },
      ],
    },
  ],
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeaderWithAccount />
      <main className="flex-1">
        <FeaturesPageContent />
      </main>
      <SiteFooter />
    </div>
  );
}
