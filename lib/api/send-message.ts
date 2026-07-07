import { prisma, warmDatabaseConnection } from "@/lib/db";
import { after } from "next/server";
import { countSmsUnits, normalizePhones } from "@/lib/sms/units";
import { deductSmsCredits } from "@/lib/sms/billing";
import { resolveSmsPriceForUser } from "@/lib/reseller/pricing";
import { enqueueSmsJobsInline } from "@/lib/queue/enqueue-sms";
import { resolveMessagePriority } from "@/lib/enterprise/priority";
import { processSandboxMessage } from "@/lib/api/sandbox";
import type { ApiContext } from "@/lib/api/context";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { resolveApprovedSenderForUser } from "@/lib/sender-ids/validate-send";

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

  let approvedSender: string;
  try {
    approvedSender = await resolveApprovedSenderForUser(ctx.user.id, input.sender);
  } catch {
    return apiError(
      "INVALID_REQUEST",
      "Sender ID is not approved for this account",
      400,
    );
  }

  const units = countSmsUnits(input.message);
  const totalUnits = units * recipientList.length;
  const currency = ctx.user.wallet?.currency ?? "GHS";

  let costPerUnit = 0;
  let totalCost = 0;
  if (!ctx.isSandbox) {
    const price = await resolveSmsPriceForUser(ctx.user.id, input.countryCode);
    costPerUnit = price.sellPrice;
    totalCost = costPerUnit * totalUnits;
  }

  const campaign = await prisma.campaign.create({
    data: {
      userId: ctx.user.id,
      name: `API ${new Date().toISOString()}`,
      senderId: approvedSender,
      message: input.message,
      countryCode: input.countryCode,
      recipientCount: recipientList.length,
      status: "SENDING",
    },
  });

  const messages = await prisma.$transaction(async (tx) => {
    const created = [];
    for (const recipient of recipientList) {
      created.push(
        await tx.message.create({
          data: {
            userId: ctx.user.id,
            campaignId: campaign.id,
            recipient,
            body: input.message,
            senderId: approvedSender,
            countryCode: input.countryCode,
            smsUnits: units,
            cost: ctx.isSandbox ? 0 : costPerUnit * units,
            status: "PENDING",
            isSandbox: ctx.isSandbox,
            priority: ctx.isSandbox ? "MEDIUM" : resolveMessagePriority({ channel: "api", body: input.message }),
            channel: "api",
          },
        }),
      );
    }
    return created;
  });

  if (!ctx.isSandbox) {
    try {
      await deductSmsCredits(
        ctx.user.id,
        totalUnits,
        totalCost,
        currency,
        `API send ${recipientList.length} recipients`,
        input.countryCode,
      );
    } catch {
      await prisma.campaign.delete({ where: { id: campaign.id } });
      return apiError("INSUFFICIENT_CREDITS", "Insufficient SMS credits", 402);
    }
  }

  const ids: string[] = messages.map((m) => m.id);
  const priority = resolveMessagePriority({ channel: "api", body: input.message });

  if (ctx.isSandbox) {
    for (const message of messages) {
      await processSandboxMessage(message.id);
    }
  } else {
    after(async () => {
      await warmDatabaseConnection().catch(() => undefined);
      await enqueueSmsJobsInline(
        messages.map((message) => ({
          messageId: message.id,
          countryCode: input.countryCode,
          priority,
        })),
      );
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
