import { createOgImageResponse, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-image";
import { getIntegration } from "@/lib/marketing/integrations-catalog";

export const alt = "SplitSMS integration";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";

export default async function IntegrationOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const integration = getIntegration(slug);
  return createOgImageResponse({
    kicker: "Integration",
    title: integration ? `SplitSMS + ${integration.name}` : "SplitSMS Integrations",
    subtitle: integration?.metaDescription ?? "Connect SplitSMS to the tools you already use.",
  });
}
