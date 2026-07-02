import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { IntegrationDetailContent } from "@/components/marketing/integration-detail-content";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  getAllIntegrationSlugs,
  getIntegration,
} from "@/lib/marketing/integrations-catalog";
import {
  breadcrumbJsonLd,
  organizationJsonLd,
  websiteJsonLd,
  webPageJsonLd,
} from "@/lib/seo/site";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllIntegrationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const integration = getIntegration(slug);
  if (!integration) return { title: "Integration not found" };

  const title =
    slug === "woocommerce"
      ? "WooCommerce SMS Integration — Order & Payment Notifications"
      : slug === "paystack"
        ? "Paystack SMS — WooCommerce Payment Confirmation Texts"
        : `${integration.name} SMS Integration`;

  return buildPageMetadata({
    title,
    description: integration.metaDescription,
    path: `/integrations/${slug}`,
    keywords: [
      `${integration.name} SMS`,
      `${integration.name} integration`,
      "SMS integration",
      "WordPress SMS",
      "SplitSMS",
    ],
  });
}

export default async function IntegrationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const integration = getIntegration(slug);
  if (!integration) notFound();

  const path = `/integrations/${slug}`;

  return (
    <MarketingPageShell>
      <JsonLdScript
        data={[
          websiteJsonLd,
          organizationJsonLd,
          webPageJsonLd({
            name: `${integration.name} + SplitSMS`,
            description: integration.metaDescription,
            path,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Integrations", path: "/integrations" },
            { name: integration.name, path },
          ]),
        ]}
      />
      <IntegrationDetailContent integration={integration} />
    </MarketingPageShell>
  );
}
