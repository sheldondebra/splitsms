import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { LegalDocument } from "@/components/marketing/legal-document";
import { securitySections } from "@/lib/marketing/legal-content";

export const metadata: Metadata = {
  title: "Security",
  description: "SplitSMS security — API keys, encryption, webhooks, rate limits, and reporting.",
  alternates: { canonical: "/security" },
};

export default function SecurityPage() {
  return (
    <MarketingPageShell>
      <LegalDocument {...securitySections} />
    </MarketingPageShell>
  );
}
