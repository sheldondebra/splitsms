import { prisma } from "@/lib/db";
import { countSmsUnits } from "@/lib/sms/units";
import { deductSmsCredits } from "@/lib/sms/billing";
import { enqueueSmsJob } from "@/lib/queue/enqueue-sms";
import { chargeEnterpriseCredit } from "@/lib/enterprise/credit";
import type { SmppAccount } from "@/lib/generated/prisma/client";

export async function handleSmppSubmit(
  account: SmppAccount & {
    enterprise: {
      id: string;
      userId: string;
      dedicatedRouteId: string | null;
      credit: { creditLimit: { toNumber(): number }; usedCredit: { toNumber(): number } } | null;
    };
  },
  params: {
    sourceAddr: string;
    destAddr: string;
    shortMessage: string;
    clientIp?: string | null;
  },
) {
  const userId = account.enterprise.userId;
  const body = params.shortMessage;
  const recipient = params.destAddr.replace(/\D/g, "").length > 0 ? params.destAddr : params.destAddr;
  const countryCode = "GH";
  const units = countSmsUnits(body);

  const pricing = await prisma.smsPricing.findFirst({
    where: { country: { code: countryCode } },
  });
  const costPerUnit = pricing?.memberPrice.toNumber() ?? 0.05;
  const cost = costPerUnit * units;

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  const currency = wallet?.currency ?? "GHS";

  if (account.enterprise.credit) {
    const charged = await chargeEnterpriseCredit(account.enterprise.id, cost);
    if (!charged.ok) {
      await prisma.smppSubmitLog.create({
        data: {
          smppAccountId: account.id,
          sourceAddr: params.sourceAddr,
          destAddr: params.destAddr,
          status: "rejected",
          errorCode: charged.reason,
        },
      });
      return { ok: false as const, error: charged.reason };
    }
  } else {
    try {
      await deductSmsCredits(userId, units, cost, currency, `SMPP to ${recipient}`);
    } catch {
      await prisma.smppSubmitLog.create({
        data: {
          smppAccountId: account.id,
          sourceAddr: params.sourceAddr,
          destAddr: params.destAddr,
          status: "rejected",
          errorCode: "insufficient_credits",
        },
      });
      return { ok: false as const, error: "insufficient_credits" };
    }
  }

  const message = await prisma.message.create({
    data: {
      userId,
      recipient,
      body,
      countryCode,
      senderId: params.sourceAddr.slice(0, 11),
      smsUnits: units,
      cost,
      status: "PENDING",
      priority: "HIGH",
      channel: "smpp",
    },
  });

  await prisma.smppSubmitLog.create({
    data: {
      smppAccountId: account.id,
      messageId: message.id,
      sourceAddr: params.sourceAddr,
      destAddr: params.destAddr,
      status: "accepted",
    },
  });

  await enqueueSmsJob(message.id, countryCode, "HIGH");

  return { ok: true as const, messageId: message.id };
}
