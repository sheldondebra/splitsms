import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { CompanyPageContent } from "@/components/marketing/company-page-content";

export const metadata: Metadata = {
  title: "Company — SplitSMS & Tecunit Ghana",
  description:
    "Learn about SplitSMS, the bulk SMS platform built by Tecunit Ghana. Our mission, values, and commitment to affordable SMS in Africa and worldwide.",
  alternates: { canonical: "/company" },
};

export default function CompanyPage() {
  return (
    <MarketingPageShell>
      <CompanyPageContent />
    </MarketingPageShell>
  );
}
