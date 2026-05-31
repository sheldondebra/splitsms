import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { ConnectDocsContent } from "@/components/marketing/connect-docs-content";
import { connectFaqs } from "@/lib/marketing/connect-docs";
import { getSiteUrl, siteName } from "@/lib/site-config";

const siteUrl = getSiteUrl();

const connectDescription =
  "Provision customer accounts, wallets, and sender IDs via REST API. White-label SMS for SaaS platforms, agencies, and marketplaces — smart routing, WordPress plugin, and partner dashboard included.";

export const metadata: Metadata = {
  title: "SplitSMS Connect — Embed SMS API for SaaS & Partners",
  description: connectDescription,
  keywords: [
    "SplitSMS Connect",
    "embed SMS API",
    "white label SMS",
    "SMS reseller API",
    "provision SMS customers",
    "SaaS SMS integration",
    "partner SMS platform",
    "embedded SMS",
    "SMS API for marketplace",
  ],
  alternates: { canonical: `${siteUrl}/docs/connect` },
  openGraph: {
    title: "SplitSMS Connect — Embed SMS in Your Product",
    description:
      "Create customer accounts, allocate SMS credits, register sender IDs, and send globally through one partner API.",
    url: `${siteUrl}/docs/connect`,
    type: "article",
  },
};

function connectDocsJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: "SplitSMS Connect — Embed SMS API for SaaS & Partners",
        description: connectDescription,
        url: `${siteUrl}/docs/connect`,
        author: { "@type": "Organization", name: siteName },
        publisher: { "@type": "Organization", name: siteName, url: siteUrl },
        dateModified: "2026-05-31",
      },
      {
        "@type": "FAQPage",
        mainEntity: connectFaqs.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };
}

export default function DocsConnectPage() {
  return (
    <MarketingPageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(connectDocsJsonLd()) }}
      />
      <ConnectDocsContent baseUrl={siteUrl} />
    </MarketingPageShell>
  );
}
