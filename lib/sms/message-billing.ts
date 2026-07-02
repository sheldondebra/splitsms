import { prisma } from "@/lib/db";
import { releaseEnterpriseCredit } from "@/lib/enterprise/credit";
import { refundSmsCredits } from "@/lib/sms/billing";
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

async function billableCreditsForMessage(message: RefundableMessage) {
  const price = await resolveSmsPriceForUser(
    message.userId,
    message.countryCode ?? "GH",
  );
  return message.smsUnits * price.creditsPerSms;
}

/** Refund the billing instrument that was charged for this message. */
export async function refundMessageBilling(
  message: RefundableMessage,
  currency: string,
  reason: string,
) {
  const cost = message.cost?.toNumber() ?? 0;
  const countryCode = message.countryCode ?? "GH";
  const enterprise = await prisma.enterpriseAccount.findUnique({
    where: { userId: message.userId },
    include: { credit: true },
  });

  const billedViaEnterpriseCredit =
    message.channel === "smpp" && Boolean(enterprise?.credit);

  if (billedViaEnterpriseCredit && enterprise) {
    await releaseEnterpriseCredit(enterprise.id, cost);
    return;
  }

  const credits = await billableCreditsForMessage(message);
  await refundSmsCredits(message.userId, credits, cost, currency, reason);
  await reverseSmsCommission(message.userId, message.smsUnits, countryCode, message.id);
}
