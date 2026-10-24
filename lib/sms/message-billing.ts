import { prisma } from "@/lib/db";
import { resolveSmsPriceForUser } from "@/lib/reseller/pricing";
import { reverseSmsCommission } from "@/lib/reseller/commission";

type RefundableMessage = {
  id?: string;
  userId: string;
  channel: string | null;
  smsUnits: number;
  countryCode: string | null;
  cost: { toNumber: () => number } | null;
  recipient: string;
};

/** Serialize by message and commit the refund ledger with the credit adjustment. */
export async function refundMessageBilling(message: RefundableMessage, currency: string, reason: string) {
  if (!message.id) throw new Error("SMS refund requires a durable message ID");
  const messageId = message.id;
  const cost = message.cost?.toNumber() ?? 0;
  const countryCode = message.countryCode ?? "GH";
  const price = await resolveSmsPriceForUser(message.userId, countryCode);
  const credits = message.smsUnits * price.creditsPerSms;

  const refunded = await prisma.$transaction(async (tx) => {
    // All automated refund paths share this row lock. A rollback releases it without
    // leaving a claimed-but-unpaid refund. The receipt commits in the same transaction as the balance and ledger.
    const rows = await tx.$queryRaw<{ id: string; refundProcessed: boolean }[]>`SELECT id, "refundProcessed" FROM "Message" WHERE id = ${messageId} FOR UPDATE`;
    if (!rows.length) throw new Error("SMS refund message not found");
    if (rows[0].refundProcessed) return false;

    const enterprise = await tx.enterpriseAccount.findUnique({ where: { userId: message.userId }, include: { credit: true } });
    const enterpriseCredit = message.channel === "smpp" && enterprise?.credit;
    let creditsBefore = 0;
    if (enterpriseCredit) {
      // Serialize releases across different messages on the same credit account too.
      await tx.$queryRaw`SELECT id FROM "EnterpriseCredit" WHERE "enterpriseId" = ${enterprise.id} FOR UPDATE`;
      const current = await tx.enterpriseCredit.findUniqueOrThrow({ where: { enterpriseId: enterprise.id } });
      await tx.enterpriseCredit.update({
        where: { enterpriseId: enterprise.id },
        data: { usedCredit: { decrement: Math.min(cost, current.usedCredit.toNumber()) } },
      });
    } else {
      const credit = await tx.smsCredit.upsert({ where: { userId: message.userId }, update: { balance: { increment: credits } }, create: { userId: message.userId, balance: credits } });
      creditsBefore = credit.balance - credits;
    }
    await tx.transaction.create({
      data: {
        userId: message.userId, type: "REFUND", amount: cost, currency,
        credits: enterpriseCredit ? 0 : credits, description: reason, status: "completed",
        metadata: { messageId, instrument: enterpriseCredit ? "enterprise_credit" : "sms_credit", creditsBefore, creditsAfter: enterpriseCredit ? 0 : creditsBefore + credits },
      },
    });
    await tx.message.update({ where: { id: messageId }, data: { refundProcessed: true } });
    return enterpriseCredit ? "enterprise_credit" : "sms_credit";
  });
  if (refunded === "sms_credit") {
    await reverseSmsCommission(message.userId, message.smsUnits, countryCode, messageId)
      .catch(() => console.error("[sms] commission refund requires reconciliation", messageId));
  }
}
