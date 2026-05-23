import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { IntegrationsHubContent } from "@/components/marketing/integrations-hub-content";
import { getSiteUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Integrations — WordPress, Paystack, Flutterwave & more",
  description:
    "Connect SplitSMS to WordPress, Crocoblock, WooCommerce, Paystack, Flutterwave, and form plugins. Setup guides and how SMS billing works.",
  alternates: { canonical: "/integrations" },
  openGraph: {
    url: `${getSiteUrl()}/integrations`,
    title: "SplitSMS Integrations",
  },
};

export default function IntegrationsPage() {
  return (
    <MarketingPageShell>
      <IntegrationsHubContent />
    </MarketingPageShell>
  );
}
