import type { Metadata } from "next";
import { AdsFunnelPage } from "@/components/marketing/ads-funnel-page";
import { hasSessionCookie } from "@/lib/auth/session";
import { formatRowPrice } from "@/lib/billing/pricing-format";
import { listPublicPricing, toPublicPricingRows } from "@/lib/billing/pricing";
import { buildFunnelCtaHref } from "@/lib/marketing/funnel-cta";
import { adsFunnelMetadata } from "@/lib/seo/marketing-metadata";

export const metadata: Metadata = adsFunnelMetadata;

const GHANA_PRICE_FALLBACK = "GHS 0.029";

async function ghanaPriceLabel() {
  try {
    const rows = toPublicPricingRows(await listPublicPricing());
    const ghana = rows.find((row) => row.countryCode === "GH");
    if (ghana) return formatRowPrice(ghana);
  } catch {
    // Public pricing is optional on this page. Keep the published Ghana teaser.
  }
  return GHANA_PRICE_FALLBACK;
}

export default async function GoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, signedIn, ghanaPrice] = await Promise.all([
    searchParams,
    hasSessionCookie(),
    ghanaPriceLabel(),
  ]);
  const ctaHref = buildFunnelCtaHref(params, { signedIn });

  return (
    <AdsFunnelPage
      ctaHref={ctaHref}
      ctaLabel={signedIn ? "Open dashboard" : "Start free"}
      ghanaPrice={ghanaPrice}
    />
  );
}
