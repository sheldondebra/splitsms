import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { LegalDocument } from "@/components/marketing/legal-document";
import { privacySections } from "@/lib/marketing/legal-content";
import { privacyMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = privacyMetadata;

export default function PrivacyPage() {
  return (
    <MarketingPageShell>
      <LegalDocument {...privacySections} />
    </MarketingPageShell>
  );
}
