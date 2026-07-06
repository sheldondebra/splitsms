import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { ConnectDocsContent } from "@/components/marketing/connect-docs-content";
import { connectFaqs } from "@/lib/marketing/connect-docs";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { docsConnectMetadata } from "@/lib/seo/marketing-metadata";
import { breadcrumbJsonLd, faqPageJsonLd, siteName, siteUrl, webPageJsonLd } from "@/lib/seo/site";
import { getSiteUrl } from "@/lib/site-config";

export const metadata: Metadata = docsConnectMetadata;

const connectDescription =
  "Provision customer accounts, wallets, and sender IDs via REST API. White-label SMS for SaaS platforms, agencies, and marketplaces.";

const connectJsonLd = [
  webPageJsonLd({
    name: "SplitSMS Connect — Embed SMS API for SaaS & Partners",
    description: connectDescription,
    path: "/docs/connect",
  }),
  breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Docs", path: "/docs" },
    { name: "Connect", path: "/docs/connect" },
  ]),
  {
    "@type": "TechArticle",
    headline: "SplitSMS Connect — Embed SMS API for SaaS & Partners",
    description: connectDescription,
    url: `${siteUrl}/docs/connect`,
    author: { "@type": "Organization", name: siteName },
    publisher: { "@type": "Organization", name: siteName, url: siteUrl },
    dateModified: "2026-05-31",
  },
  faqPageJsonLd(connectFaqs.map(({ q, a }) => ({ question: q, answer: a }))),
];

export default function DocsConnectPage() {
  return (
    <MarketingPageShell>
      <JsonLdScript data={connectJsonLd} />
      <ConnectDocsContent baseUrl={getSiteUrl()} />
    </MarketingPageShell>
  );
}
