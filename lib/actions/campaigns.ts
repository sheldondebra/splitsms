"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { normalizePhones, countSmsUnits } from "@/lib/sms/units";
import { estimateCampaignCost } from "@/lib/sms/message-preview";
import { dispatchCampaign } from "@/lib/campaigns/dispatch";
import type { CampaignRecurrence } from "@/lib/generated/prisma/client";
import { resolveApprovedSenderForUser } from "@/lib/sender-ids/validate-send";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createCampaignAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const name = String(formData.get("name") ?? "Campaign");
  const senderIdRaw = String(formData.get("senderId") ?? "");
  const message = String(formData.get("message") ?? "");
  const countryCode = String(formData.get("countryCode") ?? "GH");
  const contactGroupId = String(formData.get("contactGroupId") ?? "") || undefined;
  const scheduleRaw = String(formData.get("scheduledAt") ?? "");
  const recipientsRaw = String(formData.get("recipients") ?? "");
  const timezone = String(formData.get("timezone") ?? "UTC");
  const recurrence = (String(formData.get("recurrence") ?? "NONE") ||
    "NONE") as CampaignRecurrence;
  const recurrenceDays = Number(formData.get("recurrenceDays") ?? 0) || undefined;
  const recurrenceEndRaw = String(formData.get("recurrenceEndAt") ?? "");

  let recipientCount = 0;
  if (contactGroupId) {
    recipientCount = await prisma.contactGroupMember.count({
      where: { groupId: contactGroupId },
    });
  } else {
    recipientCount = normalizePhones(recipientsRaw).length;
  }

  if (!message || recipientCount === 0) {
    redirect("/dashboard/campaigns/new?error=invalid");
  }

  let senderId: string;
  try {
    senderId = await resolveApprovedSenderForUser(session.userId, senderIdRaw);
  } catch {
    redirect("/dashboard/campaigns/new?error=sender");
  }

  const pricing = await prisma.smsPricing.findFirst({
    where: { country: { code: countryCode } },
  });
  const costPerUnit = pricing?.memberPrice.toNumber() ?? 0.05;
  const { estimatedCost, totalUnits } = estimateCampaignCost(
    message,
    recipientCount,
    costPerUnit,
  );

  const scheduledAt = scheduleRaw ? new Date(scheduleRaw) : null;
  const isScheduled = scheduledAt && scheduledAt > new Date();
  const recurrenceEndAt = recurrenceEndRaw ? new Date(recurrenceEndRaw) : undefined;

  const campaign = await prisma.campaign.create({
    data: {
      userId: session.userId,
      name,
      senderId,
      message,
      contactGroupId,
      recipientsText: contactGroupId ? undefined : recipientsRaw,
      recipientCount,
      estimatedCost,
      countryCode,
      timezone,
      recurrence: recurrence !== "NONE" ? recurrence : "NONE",
      recurrenceDays: recurrence === "CUSTOM_DAYS" ? recurrenceDays : undefined,
      recurrenceEndAt,
      status: isScheduled ? "SCHEDULED" : "SENDING",
      scheduledAt: scheduledAt ?? undefined,
    },
  });

  if (isScheduled) {
    redirect(`/dashboard/campaigns?scheduled=${campaign.id}`);
  }

  const result = await dispatchCampaign(campaign.id);
  if (!result.ok) {
    if (result.reason === "insufficient_credits") {
      redirect("/dashboard/campaigns/new?error=credits");
    }
    redirect("/dashboard/campaigns/new?error=invalid");
  }

  redirect(`/dashboard/reports?campaign=${campaign.id}`);
}

export async function pauseCampaignAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const id = String(formData.get("id"));
  await prisma.campaign.updateMany({
    where: { id, userId: session.userId, status: "SCHEDULED" },
    data: { status: "PAUSED" },
  });
  revalidatePath("/dashboard/campaigns");
  redirect("/dashboard/campaigns");
}

export async function resumeCampaignAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const id = String(formData.get("id"));
  await prisma.campaign.updateMany({
    where: { id, userId: session.userId, status: "PAUSED" },
    data: { status: "SCHEDULED" },
  });
  revalidatePath("/dashboard/campaigns");
  redirect("/dashboard/campaigns");
}

export async function cancelCampaignAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const id = String(formData.get("id"));
  await prisma.campaign.updateMany({
    where: {
      id,
      userId: session.userId,
      status: { in: ["SCHEDULED", "PAUSED", "DRAFT"] },
    },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/dashboard/campaigns");
  redirect("/dashboard/campaigns");
}
