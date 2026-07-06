import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { CompanyPageContent } from "@/components/marketing/company-page-content";
import { companyPageMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = companyPageMetadata;

export default function CompanyPage() {
  return (
    <MarketingPageShell>
      <CompanyPageContent />
    </MarketingPageShell>
  );
}
