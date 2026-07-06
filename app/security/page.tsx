import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { LegalDocument } from "@/components/marketing/legal-document";
import { securitySections } from "@/lib/marketing/legal-content";
import { securityMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = securityMetadata;

export default function SecurityPage() {
  return (
    <MarketingPageShell>
      <LegalDocument {...securitySections} />
    </MarketingPageShell>
  );
}
