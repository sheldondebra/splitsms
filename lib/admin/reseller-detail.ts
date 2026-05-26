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

  const [unpaid, paidTotal, sms30d] = await Promise.all([
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
  ]);

  return {
    reseller,
    unpaidCommissions: unpaid,
    paidCommissions: paidTotal._sum.amount?.toNumber() ?? 0,
    smsLast30Days: sms30d,
  };
}
