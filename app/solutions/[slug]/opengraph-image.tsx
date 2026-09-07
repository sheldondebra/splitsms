import { createOgImageResponse, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-image";
import { getSeoLandingPage } from "@/lib/marketing/seo-landing-pages";

export const alt = "SplitSMS solution";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const runtime = "nodejs";

export default async function SolutionOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getSeoLandingPage(slug);
  return createOgImageResponse({
    kicker: "Solution",
    title: page?.h1 ?? "SplitSMS Solutions",
    subtitle: page?.excerpt ?? "Bulk SMS, OTP, and messaging built for your use case.",
  });
}
