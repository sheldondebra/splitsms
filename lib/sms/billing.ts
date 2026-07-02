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
  const price = await resolveSmsPriceForUser(userId, countryCode);
  const billableUnits = units * price.creditsPerSms;
  await assertUserCanSendSms(userId, billableUnits);
  const providerCost = units * price.platformCost;

  await prisma.$transaction(async (tx) => {
    const credit = await tx.smsCredit.findUnique({ where: { userId } });
    const creditsBefore = credit?.balance ?? 0;
    if (creditsBefore < billableUnits) {
      throw new Error("INSUFFICIENT_CREDITS");
    }

    const updated = await tx.smsCredit.updateMany({
      where: { userId, balance: { gte: billableUnits } },
      data: { balance: { decrement: billableUnits } },
    });
    if (updated.count === 0) {
      throw new Error("INSUFFICIENT_CREDITS");
    }

    await tx.transaction.create({
      data: {
        userId,
        type: "SMS_DEBIT",
        amount,
        currency,
        credits: billableUnits,
        description,
        status: "completed",
        metadata: {
          creditsBefore,
          creditsAfter: creditsBefore - billableUnits,
          segmentUnits: units,
          creditsPerSms: price.creditsPerSms,
          providerCost,
          sellPrice: price.sellPrice,
          costPrice: price.costPrice,
          countryCode,
        },
      },
    });
  });

  await recordSmsCommission(userId, units, countryCode, messageId);
}

export async function refundSmsCredits(
  userId: string,
  units: number,
  amount: number,
  currency: string,
  description: string,
) {
  await prisma.$transaction(async (tx) => {
    const credit = await tx.smsCredit.findUnique({ where: { userId } });
    const creditsBefore = credit?.balance ?? 0;

    await tx.smsCredit.upsert({
      where: { userId },
      update: { balance: { increment: units } },
      create: { userId, balance: units },
    });

    await tx.transaction.create({
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
    });
  });
}

export async function getLowBalanceWarning(userId: string, threshold = 10) {
  const credit = await prisma.smsCredit.findUnique({ where: { userId } });
  if (!credit) return null;
  if (credit.balance <= threshold) {
    return { balance: credit.balance, threshold };
  }
  return null;
}
