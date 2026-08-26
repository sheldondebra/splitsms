import { prisma } from "@/lib/db";
import { displayPricingCurrency } from "@/lib/billing/country-currency";
import { listPublicPricing } from "@/lib/billing/pricing";
import type { WalletPricingOption } from "@/components/billing/wallet-credits-panel";

export async function getWalletPricingOptions(userId: string): Promise<WalletPricingOption[]> {
  const [dbRows, customRates, membership] = await Promise.all([
    listPublicPricing(),
    prisma.userSmsPricing.findMany({
      where: { userId, isActive: true },
    }),
    prisma.resellerUser.findUnique({
      where: { userId },
      include: {
        reseller: {
          include: { countryPricing: { where: { isActive: true } } },
        },
      },
    }),
  ]);

  const resellerRates =
    membership && !membership.isSuspended && membership.reseller.status === "APPROVED"
      ? membership.reseller.countryPricing
      : [];

  return dbRows.map((p) => {
    const custom = customRates.find((c) => c.countryCode === p.country.code);
    const reseller = resellerRates.find((c) => c.countryCode === p.country.code);
    const pricePerCredit = reseller
      ? reseller.sellPrice.toNumber()
      : custom
        ? custom.sellPrice.toNumber()
        : p.memberPrice.toNumber();

    return {
      countryCode: p.country.code,
      countryName: p.country.name,
      pricePerCredit,
      currency:
        custom?.currency ??
        reseller?.currency ??
        displayPricingCurrency(p.country.code, p.currency),
    };
  });
}
