import { prisma } from "@/lib/db";
import { resolveSmsPriceForUser } from "@/lib/reseller/pricing";

export async function recordSmsCommission(
  subUserId: string,
  units: number,
  countryCode: string,
  messageId?: string,
) {
  const membership = await prisma.resellerUser.findUnique({
    where: { userId: subUserId },
    include: { reseller: true },
  });
  if (!membership || membership.isSuspended || membership.reseller.status !== "APPROVED") {
    return;
  }

  const price = await resolveSmsPriceForUser(subUserId, countryCode);
  const marginPerUnit = price.resellerMargin;
  const amount = marginPerUnit * units;
  if (amount <= 0) return;

  const rate = membership.reseller.commissionRate.toNumber();
  const commission = amount * (rate / 100);

  await prisma.resellerCommission.create({
    data: {
      resellerId: membership.resellerId,
      amount: commission,
      currency: price.currency,
      source: "sms_usage",
      referenceId: messageId,
      metadata: {
        subUserId,
        units,
        marginPerUnit,
        countryCode,
      },
    },
  });
}
