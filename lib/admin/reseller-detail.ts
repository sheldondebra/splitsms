import { prisma } from "@/lib/db";
import { getUnpaidCommissionTotal } from "@/lib/reseller/payout";
import { notFound } from "next/navigation";

export async function getAdminResellerDetail(resellerId: string) {
  const reseller = await prisma.reseller.findUnique({
    where: { id: resellerId },
    include: {
      user: { include: { wallet: true, smsCredit: true } },
      branding: true,
      countryPricing: { orderBy: { countryCode: "asc" } },
      subUsers: {
        include: {
          user: {
            include: {
              wallet: true,
              smsCredit: true,
              _count: { select: { messages: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      commissions: { orderBy: { createdAt: "desc" }, take: 30 },
      _count: { select: { commissions: true, subUsers: true } },
    },
  });

  if (!reseller) notFound();

  const countryCodes = reseller.countryPricing.map((p) => p.countryCode);

  const [unpaid, paidTotal, sms30d, platformPricing] = await Promise.all([
    getUnpaidCommissionTotal(resellerId),
    prisma.resellerCommission.aggregate({
      where: { resellerId, paidAt: { not: null } },
      _sum: { amount: true },
    }),
    prisma.message.count({
      where: {
        userId: { in: reseller.subUsers.map((s) => s.userId) },
        createdAt: { gte: new Date(Date.now() - 30 * 86400000) },
      },
    }),
    prisma.smsPricing.findMany({
      where: {
        isActive: true,
        ...(countryCodes.length
          ? { country: { code: { in: countryCodes } } }
          : {}),
      },
      include: { country: { select: { code: true, name: true } } },
      orderBy: { country: { name: "asc" } },
      ...(countryCodes.length ? {} : { take: 24 }),
    }),
  ]);

  const platformByCode = new Map(
    platformPricing.map((p) => [
      p.country.code,
      {
        memberPrice: p.memberPrice.toNumber(),
        resellerPrice: p.resellerPrice?.toNumber() ?? p.memberPrice.toNumber(),
        costPrice: p.costPrice.toNumber(),
        currency: p.currency,
        countryName: p.country.name,
      },
    ]),
  );

  return {
    reseller,
    unpaidCommissions: unpaid,
    paidCommissions: paidTotal._sum.amount?.toNumber() ?? 0,
    smsLast30Days: sms30d,
    platformPricing: platformPricing.map((p) => ({
      countryCode: p.country.code,
      countryName: p.country.name,
      currency: p.currency,
      memberPrice: p.memberPrice.toNumber(),
      resellerPrice: p.resellerPrice?.toNumber() ?? p.memberPrice.toNumber(),
      costPrice: p.costPrice.toNumber(),
    })),
    pricingComparison: reseller.countryPricing.map((p) => {
      const platform = platformByCode.get(p.countryCode);
      return {
        id: p.id,
        countryCode: p.countryCode,
        currency: p.currency,
        sellPrice: p.sellPrice.toNumber(),
        isActive: p.isActive,
        wholesale: platform?.resellerPrice ?? null,
        memberPrice: platform?.memberPrice ?? null,
        costPrice: platform?.costPrice ?? null,
        margin:
          platform != null
            ? Number((p.sellPrice.toNumber() - platform.resellerPrice).toFixed(4))
            : null,
      };
    }),
  };
}
