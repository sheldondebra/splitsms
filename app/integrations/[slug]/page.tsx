import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingPageShell } from "@/components/marketing/marketing-page-shell";
import { IntegrationDetailContent } from "@/components/marketing/integration-detail-content";
import {
  getAllIntegrationSlugs,
  getIntegration,
} from "@/lib/marketing/integrations-catalog";
import { getSiteUrl } from "@/lib/site-config";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllIntegrationSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const integration = getIntegration(slug);
  if (!integration) return { title: "Integration not found" };

  const canonical = `/integrations/${slug}`;
  return {
    title: `${integration.name} Integration`,
    description: integration.metaDescription,
    alternates: { canonical },
    openGraph: {
      url: `${getSiteUrl()}${canonical}`,
      title: `${integration.name} + SplitSMS`,
      description: integration.metaDescription,
    },
  };
}

export default async function IntegrationDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const integration = getIntegration(slug);
  if (!integration) notFound();

  return (
    <MarketingPageShell>
      <IntegrationDetailContent integration={integration} />
    </MarketingPageShell>
  );
}
