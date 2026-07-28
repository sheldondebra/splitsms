import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { prisma } from "@/lib/db";
import {
  ResellerPricingView,
  type PricingCountryRow,
} from "@/components/reseller/pricing/reseller-pricing-view";
import { redirect } from "next/navigation";

export default async function ResellerPricingPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; country?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const [platformPricing, resellerPricing] = await Promise.all([
    prisma.smsPricing.findMany({
      include: { country: true },
      where: { isActive: true },
      orderBy: { country: { name: "asc" } },
    }),
    prisma.resellerCountryPricing.findMany({
      where: { resellerId: reseller.id, isActive: true },
    }),
  ]);

  const byCode = Object.fromEntries(resellerPricing.map((r) => [r.countryCode, r]));

  const rows: PricingCountryRow[] = platformPricing.map((p) => {
    const custom = byCode[p.country.code];
    const costPrice = p.costPrice.toNumber();
    const memberPrice = p.memberPrice.toNumber();
    const suggestedPrice = Number((costPrice * 1.4).toFixed(4));
    return {
      code: p.country.code,
      name: p.country.name,
      dialCode: p.country.dialCode,
      currency: custom?.currency ?? p.currency,
      costPrice,
      memberPrice,
      sellPrice: custom ? custom.sellPrice.toNumber() : null,
      isCustom: Boolean(custom),
      suggestedPrice,
    };
  });

  return (
    <ResellerPricingView
      rows={rows}
      flash={{
        saved: params.saved,
        error: params.error,
        country: params.country,
      }}
    />
  );
}
