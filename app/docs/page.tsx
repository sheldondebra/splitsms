import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { PlatformDocsContent } from "@/components/marketing/platform-docs-content";
import { docsHubMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = docsHubMetadata;

export default function DocsPage() {
  return (
    <MarketingPageShell>
      <PlatformDocsContent />
    </MarketingPageShell>
  );
}
