import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { LegalDocument } from "@/components/marketing/legal-document";
import { privacySections } from "@/lib/marketing/legal-content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "SplitSMS privacy policy — how Tecunit collects and protects your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <MarketingPageShell>
      <LegalDocument {...privacySections} />
    </MarketingPageShell>
  );
}
