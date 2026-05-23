import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { LegalDocument } from "@/components/marketing/legal-document";
import { termsSections } from "@/lib/marketing/legal-content";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "SplitSMS terms and conditions for using our bulk SMS platform and API.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <MarketingPageShell>
      <LegalDocument {...termsSections} />
    </MarketingPageShell>
  );
}
