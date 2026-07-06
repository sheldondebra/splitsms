import type { Metadata } from "next";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { IntegrationsHubContent } from "@/components/marketing/integrations-hub-content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { integrationsHubMetadata } from "@/lib/seo/marketing-metadata";
import { breadcrumbJsonLd, webPageJsonLd } from "@/lib/seo/site";

export const metadata: Metadata = integrationsHubMetadata;

export default function IntegrationsPage() {
  return (
    <MarketingPageShell>
      <JsonLdScript
        data={[
          webPageJsonLd({
            name: "SplitSMS Integrations",
            description:
              "Connect SplitSMS to WordPress, WooCommerce, Paystack, Flutterwave, Elementor, and form plugins.",
            path: "/integrations",
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Integrations", path: "/integrations" },
          ]),
        ]}
      />
      <IntegrationsHubContent />
    </MarketingPageShell>
  );
}
