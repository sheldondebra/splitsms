import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PlatformDocsContent } from "@/components/marketing/platform-docs-content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { docsHubMetadata } from "@/lib/seo/marketing-metadata";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo/site";

export const metadata: Metadata = docsHubMetadata;

const docsDescription =
  "SplitSMS documentation: getting started, dashboard, messaging standards, REST API, WordPress plugin, security, SDKs, and troubleshooting.";

const docsJsonLd = [
  webPageJsonLd({
    name: "SplitSMS Documentation",
    description: docsDescription,
    path: "/docs",
  }),
  breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Docs", path: "/docs" },
  ]),
];

export default function DocsPage() {
  return (
    <MarketingPageShell>
      <JsonLdScript data={docsJsonLd} />
      <PlatformDocsContent />
    </MarketingPageShell>
  );
}
