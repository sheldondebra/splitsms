"use server";

import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import {
  getMemberAccountForUser,
  isMemberSuspended,
  memberHasFeature,
} from "@/lib/admin/member-account";
import { ResellerAccessError } from "@/lib/reseller/access";
import { countSmsUnits, normalizePhones, isGsm7 } from "@/lib/sms/units";
import { deductSmsCredits } from "@/lib/sms/billing";
import { enqueueSmsJob } from "@/lib/queue/enqueue-sms";
import { resolveMessagePriority } from "@/lib/enterprise/priority";
import { redirect } from "next/navigation";

export async function sendSmsAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const account = await getMemberAccountForUser(session.userId);
  if (isMemberSuspended(account) || !memberHasFeature(account, "featureBulkSms")) {
    redirect("/dashboard/send?error=access");
  }

  const senderId = String(formData.get("senderId") ?? "");
  const body = String(formData.get("body") ?? "");
  const recipientsRaw = String(formData.get("recipients") ?? "");
  const countryCode = String(formData.get("countryCode") ?? DEFAULT_COUNTRY_CODE);

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
      countryCode,
    );
  } catch (e) {
    if (e instanceof ResellerAccessError) {
      redirect(`/dashboard/send?error=${e.code.toLowerCase()}`);
    }
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

  const priority = resolveMessagePriority({ channel: "dashboard", body });

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
            priority,
            channel: "dashboard",
          },
        }),
      );
    }
    return created;
  });

  for (const msg of messages) {
    await enqueueSmsJob(msg.id, countryCode, priority);
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: "COMPLETED" },
  });

  redirect(`/dashboard/reports?campaign=${campaign.id}&sent=1`);
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
