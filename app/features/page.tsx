import type { Metadata } from "next";
import { SiteHeaderWithAccount } from "@/components/layout/site-header-with-account";
import { SiteFooter } from "@/components/layout/site-footer";
import { FeaturesPageContent } from "@/components/marketing/features-page-content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { featuresPageMetadata } from "@/lib/seo/marketing-metadata";
import { breadcrumbJsonLd, siteUrl, webPageJsonLd } from "@/lib/seo/site";

export const metadata: Metadata = featuresPageMetadata;

const featuresJsonLd = [
  webPageJsonLd({
    name: "SplitSMS Features — Bulk SMS Platform",
    description:
      "Bulk SMS campaigns, OTP API, contact management, webhooks, and affordable pricing for Ghana and 190+ countries.",
    path: "/features",
  }),
  breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Features", path: "/features" },
  ]),
  {
    "@type": "SoftwareApplication",
    name: "SplitSMS",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `${siteUrl}/features`,
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
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-marketing">
      <JsonLdScript data={featuresJsonLd} />
      <SiteHeaderWithAccount />
      <main className="flex-1">
        <FeaturesPageContent />
      </main>
      <SiteFooter />
    </div>
  );
}
