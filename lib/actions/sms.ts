"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { countSmsUnits, normalizePhones, isGsm7 } from "@/lib/sms/units";
import { deductSmsCredits } from "@/lib/sms/billing";
import { getSmsSendQueue, type SmsSendJob } from "@/lib/queue/sms-queue";
import { processMessageJob } from "@/lib/queue/process-message";
import { redirect } from "next/navigation";

export async function sendSmsAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const senderId = String(formData.get("senderId") ?? "");
  const body = String(formData.get("body") ?? "");
  const recipientsRaw = String(formData.get("recipients") ?? "");
  const countryCode = String(formData.get("countryCode") ?? "GH");

  const recipients = normalizePhones(recipientsRaw);
  if (!senderId || !body || recipients.length === 0) {
    redirect("/dashboard/send?error=invalid");
  }

  const units = countSmsUnits(body);
  const pricing = await prisma.smsPricing.findFirst({
    where: { country: { code: countryCode }, isActive: true },
    include: { country: true },
  });
  const costPerUnit = pricing?.memberPrice.toNumber() ?? 0.05;
  const totalUnits = units * recipients.length;
  const totalCost = costPerUnit * totalUnits;

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
  const currency = wallet?.currency ?? "GHS";

  try {
    await deductSmsCredits(
      session.userId,
      totalUnits,
      totalCost,
      currency,
      `Bulk send ${recipients.length} recipients`,
    );
  } catch {
    redirect("/dashboard/send?error=credits");
  }

  const campaign = await prisma.campaign.create({
    data: {
      userId: session.userId,
      name: `Quick send ${new Date().toISOString()}`,
      senderId,
      message: body,
      status: "SENDING",
      recipientCount: recipients.length,
      estimatedCost: totalCost,
    },
  });

  const messages = await prisma.$transaction(async (tx) => {
    const created = [];
    for (const recipient of recipients) {
      created.push(
        await tx.message.create({
          data: {
            userId: session.userId,
            campaignId: campaign.id,
            recipient,
            body,
            countryCode,
            senderId,
            smsUnits: units,
            cost: costPerUnit * units,
            status: "PENDING",
          },
        }),
      );
    }
    return created;
  });

  const queue = getSmsSendQueue();
  for (const msg of messages) {
    const job: SmsSendJob = { messageId: msg.id, countryCode };
    if (queue) {
      await queue.add("send", job, { removeOnComplete: true });
    } else {
      await processMessageJob(msg.id, countryCode);
    }
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: "COMPLETED" },
  });

  redirect(`/dashboard/reports?campaign=${campaign.id}`);
}

export async function getSmsEstimate(body: string, recipientCount: number, countryCode: string) {
  const units = countSmsUnits(body);
  const pricing = await prisma.smsPricing.findFirst({
    where: { country: { code: countryCode } },
  });
  const costPerUnit = pricing?.memberPrice.toNumber() ?? 0.05;
  return {
    units,
    encoding: isGsm7(body) ? "GSM-7" : "UCS-2",
    totalUnits: units * recipientCount,
    estimatedCost: costPerUnit * units * recipientCount,
  };
}
