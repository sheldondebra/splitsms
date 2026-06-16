import { prisma } from "@/lib/db";
import { displayPricingCurrency } from "@/lib/billing/country-currency";
import { listPublicPricing } from "@/lib/billing/pricing";
import type { WalletPricingOption } from "@/components/billing/wallet-credits-panel";

export async function getWalletPricingOptions(userId: string): Promise<WalletPricingOption[]> {
  const [dbRows, customRates] = await Promise.all([
    listPublicPricing(),
    prisma.userSmsPricing.findMany({
      where: { userId, isActive: true },
    }),
  ]);

  return dbRows.map((p) => {
    const custom = customRates.find((c) => c.countryCode === p.country.code);
    return {
      countryCode: p.country.code,
      countryName: p.country.name,
      pricePerCredit: custom ? custom.sellPrice.toNumber() : p.memberPrice.toNumber(),
      currency: custom?.currency ?? displayPricingCurrency(p.country.code, p.currency),
    };
  });
}
