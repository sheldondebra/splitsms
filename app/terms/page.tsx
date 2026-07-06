import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { LegalDocument } from "@/components/marketing/legal-document";
import { termsSections } from "@/lib/marketing/legal-content";
import { termsMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = termsMetadata;

export default function TermsPage() {
  return (
    <MarketingPageShell>
      <LegalDocument {...termsSections} />
    </MarketingPageShell>
  );
}
