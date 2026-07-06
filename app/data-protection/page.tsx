import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { LegalDocument } from "@/components/marketing/legal-document";
import { dataProtectionSections } from "@/lib/marketing/legal-content";
import { dataProtectionMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = dataProtectionMetadata;

export default function DataProtectionPage() {
  return (
    <MarketingPageShell>
      <LegalDocument {...dataProtectionSections} />
    </MarketingPageShell>
  );
}
