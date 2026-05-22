import { prisma } from "@/lib/db";
import { resolveSmsPrice, type ResolvedPrice } from "@/lib/billing/pricing";

export type ResellerResolvedPrice = ResolvedPrice & {
  resellerId?: string;
  platformCost: number;
  resellerMargin: number;
};

/** Platform cost → reseller sell → optional user override */
export async function resolveSmsPriceForUser(
  userId: string,
  countryCode: string,
): Promise<ResellerResolvedPrice> {
  const code = countryCode.toUpperCase();
  const membership = await prisma.resellerUser.findUnique({
    where: { userId },
    include: {
      reseller: {
        include: {
          countryPricing: { where: { countryCode: code, isActive: true } },
        },
      },
    },
  });

  const base = await resolveSmsPrice(userId, code);
  const platformCost = base.costPrice;

  if (membership && !membership.isSuspended && membership.reseller.status === "APPROVED") {
    const rp = membership.reseller.countryPricing[0];
    const sell = rp ? rp.sellPrice.toNumber() : base.sellPrice;
    return {
      ...base,
      sellPrice: sell,
      costPrice: platformCost,
      profitPerSms: Math.max(0, sell - platformCost),
      isCustom: Boolean(rp),
      resellerId: membership.resellerId,
      platformCost,
      resellerMargin: Math.max(0, sell - platformCost),
      currency: rp?.currency ?? base.currency,
    };
  }

  return {
    ...base,
    platformCost,
    resellerMargin: base.profitPerSms,
  };
}
