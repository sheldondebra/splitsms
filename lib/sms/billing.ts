import { prisma } from "@/lib/db";
import { resolveSmsPriceForUser } from "@/lib/reseller/pricing";
import { recordSmsCommission } from "@/lib/reseller/commission";
import { assertUserCanSendSms } from "@/lib/reseller/access";

/** Deduct SMS credits before send. Records provider cost in metadata for profit analytics. */
export async function deductSmsCredits(
  userId: string,
  units: number,
  amount: number,
  currency: string,
  description: string,
  countryCode = "GH",
  messageId?: string,
) {
  await assertUserCanSendSms(userId, units);

  const credit = await prisma.smsCredit.findUnique({ where: { userId } });
  if (!credit || credit.balance < units) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

  const price = await resolveSmsPriceForUser(userId, countryCode);
  const providerCost = units * price.platformCost;
  const creditsBefore = credit.balance;

  await prisma.$transaction([
    prisma.smsCredit.update({
      where: { userId },
      data: { balance: { decrement: units } },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: "SMS_DEBIT",
        amount,
        currency,
        credits: units,
        description,
        status: "completed",
        metadata: {
          creditsBefore,
          creditsAfter: creditsBefore - units,
          providerCost,
          sellPrice: price.sellPrice,
          costPrice: price.costPrice,
          countryCode,
        },
      },
    }),
  ]);

  await recordSmsCommission(userId, units, countryCode, messageId);
}

export async function refundSmsCredits(
  userId: string,
  units: number,
  amount: number,
  currency: string,
  description: string,
) {
  const credit = await prisma.smsCredit.findUnique({ where: { userId } });
  const creditsBefore = credit?.balance ?? 0;

  await prisma.$transaction([
    prisma.smsCredit.update({
      where: { userId },
      data: { balance: { increment: units } },
    }),
    prisma.transaction.create({
      data: {
        userId,
        type: "REFUND",
        amount,
        currency,
        credits: units,
        description,
        status: "completed",
        metadata: { creditsBefore, creditsAfter: creditsBefore + units },
      },
    }),
  ]);
}

export async function getLowBalanceWarning(userId: string, threshold = 10) {
  const credit = await prisma.smsCredit.findUnique({ where: { userId } });
  if (!credit) return null;
  if (credit.balance <= threshold) {
    return { balance: credit.balance, threshold };
  }
  return null;
}
