import { prisma } from "@/lib/db";
import { countSmsUnits, normalizePhones } from "@/lib/sms/units";
import { deductSmsCredits } from "@/lib/sms/billing";
import { getSmsSendQueue } from "@/lib/queue/sms-queue";
import { processMessageJob } from "@/lib/queue/process-message";
import { processSandboxMessage } from "@/lib/api/sandbox";
import type { ApiContext } from "@/lib/api/context";
import { apiError, apiSuccess } from "@/lib/api/errors";

export type SendSmsInput = {
  sender: string;
  message: string;
  recipients: string[];
  countryCode: string;
};

export async function apiSendMessages(ctx: ApiContext, input: SendSmsInput) {
  const recipientList = normalizePhones(input.recipients.join("\n"));
  if (recipientList.length === 0) {
    return apiError("INVALID_REQUEST", "No valid recipients", 400);
  }

  const units = countSmsUnits(input.message);
  const totalUnits = units * recipientList.length;
  const currency = ctx.user.wallet?.currency ?? "GHS";

  let costPerUnit = 0;
  if (!ctx.isSandbox) {
    const pricing = await prisma.smsPricing.findFirst({
      where: { country: { code: input.countryCode } },
    });
    costPerUnit = pricing?.memberPrice.toNumber() ?? 0.05;
    const totalCost = costPerUnit * totalUnits;
    try {
      await deductSmsCredits(
        ctx.user.id,
        totalUnits,
        totalCost,
        currency,
        `API send ${recipientList.length} recipients`,
      );
    } catch {
      return apiError("INSUFFICIENT_CREDITS", "Insufficient SMS credits", 402);
    }
  }

  const campaign = await prisma.campaign.create({
    data: {
      userId: ctx.user.id,
      name: `API ${new Date().toISOString()}`,
      senderId: input.sender,
      message: input.message,
      countryCode: input.countryCode,
      recipientCount: recipientList.length,
      status: "SENDING",
    },
  });

  const ids: string[] = [];
  const queue = getSmsSendQueue();

  for (const recipient of recipientList) {
    const message = await prisma.message.create({
      data: {
        userId: ctx.user.id,
        campaignId: campaign.id,
        recipient,
        body: input.message,
        senderId: input.sender,
        countryCode: input.countryCode,
        smsUnits: units,
        cost: ctx.isSandbox ? 0 : costPerUnit * units,
        status: "PENDING",
        isSandbox: ctx.isSandbox,
      },
    });
    ids.push(message.id);

    if (ctx.isSandbox) {
      await processSandboxMessage(message.id);
    } else if (queue) {
      await queue.add("send", { messageId: message.id, countryCode: input.countryCode });
    } else {
      await processMessageJob(message.id, input.countryCode);
    }
  }

  if (!ctx.isSandbox) {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "COMPLETED" },
    });
  }

  return apiSuccess({
    campaign_id: campaign.id,
    message_ids: ids,
    queued: !ctx.isSandbox,
    sandbox: ctx.isSandbox,
    recipients: recipientList.length,
  });
}
