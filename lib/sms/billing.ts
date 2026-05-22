import { prisma } from "@/lib/db";

/** Deduct SMS credits before send (per mNotify-first spec). Refund on failure. */
export async function deductSmsCredits(
  userId: string,
  units: number,
  amount: number,
  currency: string,
  description: string,
) {
  const credit = await prisma.smsCredit.findUnique({ where: { userId } });
  if (!credit || credit.balance < units) {
    throw new Error("INSUFFICIENT_CREDITS");
  }

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
      },
    }),
  ]);
}

export async function refundSmsCredits(
  userId: string,
  units: number,
  amount: number,
  currency: string,
  description: string,
) {
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
