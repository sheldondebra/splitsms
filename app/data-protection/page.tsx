import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { LegalDocument } from "@/components/marketing/legal-document";
import { dataProtectionSections } from "@/lib/marketing/legal-content";

export const metadata: Metadata = {
  title: "Data Protection",
  description: "How SplitSMS protects personal data — lawful processing, security, and your rights.",
  alternates: { canonical: "/data-protection" },
};

export default function DataProtectionPage() {
  return (
    <MarketingPageShell>
      <LegalDocument {...dataProtectionSections} />
    </MarketingPageShell>
  );
}
