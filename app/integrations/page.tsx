import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { WordPressIntegrationContent } from "@/components/marketing/wordpress-integration-content";
import { getSiteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "WordPress & WooCommerce SMS Plugin",
  description:
    "Download the official SplitSMS WordPress plugin. Connect WooCommerce order SMS, CF7, WPForms, and OTP to www.splitsms.com with auto-updates.",
  alternates: { canonical: "/integrations" },
  openGraph: {
    url: `${getSiteUrl()}/integrations`,
    title: "SplitSMS WordPress Plugin",
  },
};

export default function IntegrationsPage() {
  return (
    <MarketingPageShell>
      <WordPressIntegrationContent />
    </MarketingPageShell>
  );
}
