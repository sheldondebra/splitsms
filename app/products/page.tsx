import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { ProductsPageContent } from "@/components/marketing/products-page-content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { productsPageMetadata } from "@/lib/seo/marketing-metadata";
import { breadcrumbJsonLd, siteUrl, webPageJsonLd } from "@/lib/seo/site";

export const metadata: Metadata = productsPageMetadata;

const productsJsonLd = [
  webPageJsonLd({
    name: "SplitSMS Products — Bulk SMS, OTP, Smart Forms",
    description:
      "Bulk SMS campaigns, OTP API, Smart Forms, store alerts, Google SMS, and reseller tools for Ghana and 190+ countries.",
    path: "/products",
  }),
  breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
  ]),
  {
    "@type": "ItemList",
    name: "SplitSMS products",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Bulk SMS campaigns", url: `${siteUrl}/products#bulk-sms` },
      { "@type": "ListItem", position: 2, name: "OTP & verification API", url: `${siteUrl}/products#otp` },
      { "@type": "ListItem", position: 3, name: "Smart Forms", url: `${siteUrl}/products#smart-forms` },
      { "@type": "ListItem", position: 4, name: "Store & payment SMS", url: `${siteUrl}/products#ecommerce` },
      { "@type": "ListItem", position: 5, name: "Google Workspace SMS", url: `${siteUrl}/products#google` },
      { "@type": "ListItem", position: 6, name: "SMS API & webhooks", url: `${siteUrl}/products#api` },
      { "@type": "ListItem", position: 7, name: "Reseller platform", url: `${siteUrl}/products#reseller` },
      { "@type": "ListItem", position: 8, name: "Sender ID & routing", url: `${siteUrl}/products#sender-id` },
    ],
  },
  {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is included when I sign up for SplitSMS products?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "One account unlocks bulk campaigns, OTP API, Smart Forms, Google connect, and the WordPress plugin. Pay for SMS from a wallet with starter credits on signup.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need a developer for bulk SMS?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Campaigns and contacts are point-and-click. Use the API for OTP, custom apps, or automation.",
        },
      },
    ],
  },
];

export default function ProductsPage() {
  return (
    <MarketingPageShell>
      <JsonLdScript data={productsJsonLd} />
      <ProductsPageContent />
    </MarketingPageShell>
  );
}
