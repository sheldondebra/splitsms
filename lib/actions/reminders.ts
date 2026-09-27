"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { estimateCampaignCost } from "@/lib/sms/message-preview";
import { resolveApprovedSenderForUser } from "@/lib/sender-ids/validate-send";
import { isFeatureEnabled } from "@/lib/platform/features";
import type { CampaignRecurrence } from "@/lib/generated/prisma/client";
import {
  REMINDER_NAME_PREFIX,
  reminderCampaignName,
  subtractDays,
} from "@/lib/reminders/types";

async function resolveAudience(opts: {
  userId: string;
  audience: string;
  contactGroupId: string;
  recipientsRaw: string;
  countryCode: string;
}) {
  if (opts.audience === "group" && opts.contactGroupId) {
    const group = await prisma.contactGroup.findFirst({
      where: { id: opts.contactGroupId, userId: opts.userId },
      include: { _count: { select: { members: true } } },
    });
    if (!group || group._count.members < 1) return null;
    return {
      contactGroupId: group.id,
      recipientsText: undefined as string | undefined,
      recipientCount: group._count.members,
    };
  }

  if (opts.audience === "all") {
    const contacts = await prisma.contact.findMany({
      where: { userId: opts.userId },
      select: { phone: true, countryCode: true },
      take: 50_000,
    });
    const { normalizeOnePhone } = await import("@/lib/sms/units");
    const { isValidPhoneNumber } = await import("libphonenumber-js");
    const phones: string[] = [];
    const seen = new Set<string>();
    for (const c of contacts) {
      const phone = normalizeOnePhone(c.phone, c.countryCode ?? opts.countryCode);
      try {
        if (!phone || !isValidPhoneNumber(phone) || seen.has(phone)) continue;
      } catch {
        continue;
      }
      seen.add(phone);
      phones.push(phone);
    }
    if (phones.length < 1) return null;
    return {
      contactGroupId: undefined as string | undefined,
      recipientsText: phones.join("\n"),
      recipientCount: phones.length,
    };
  }

  const { parseRecipientPhones } = await import("@/lib/sms/units");
  const parsed = parseRecipientPhones(opts.recipientsRaw, opts.countryCode);
  if (parsed.valid.length < 1) return null;
  return {
    contactGroupId: undefined as string | undefined,
    recipientsText: parsed.valid.join("\n"),
    recipientCount: parsed.valid.length,
  };
}

export async function createReminderAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!(await isFeatureEnabled("bulk_sms"))) {
    redirect("/dashboard/reminders?error=feature");
  }

  const title = String(formData.get("title") ?? "").trim() || "Reminder";
  const senderIdRaw = String(formData.get("senderId") ?? "");
  const countryCode = String(formData.get("countryCode") ?? "GH");
  const timezone = String(formData.get("timezone") ?? "Africa/Accra");
  const audience = String(formData.get("audience") ?? "numbers");
  const contactGroupId = String(formData.get("contactGroupId") ?? "");
  const recipientsRaw = String(formData.get("recipients") ?? "");
  const dueAtRaw = String(formData.get("dueAt") ?? "");
  const repeat = String(formData.get("repeat") ?? "once"); // once | monthly
  const earlyEnabled = String(formData.get("earlyEnabled") ?? "") === "1";
  const earlyDays = Math.max(0, Number(formData.get("earlyDays") ?? 0) || 0);
  const earlyMessage = String(formData.get("earlyMessage") ?? "").trim();
  const dueMessage = String(formData.get("dueMessage") ?? "").trim();
  const recurrenceEndRaw = String(formData.get("recurrenceEndAt") ?? "");

  if (!dueMessage || !dueAtRaw) {
    redirect("/dashboard/reminders/new?error=invalid");
  }

  const dueAt = new Date(dueAtRaw);
  if (Number.isNaN(dueAt.getTime()) || dueAt <= new Date()) {
    redirect("/dashboard/reminders/new?error=schedule");
  }

  if (earlyEnabled) {
    if (earlyDays < 1 || !earlyMessage) {
      redirect("/dashboard/reminders/new?error=early");
    }
  }

  let senderId: string;
  try {
    senderId = await resolveApprovedSenderForUser(session.userId, senderIdRaw);
  } catch {
    redirect("/dashboard/reminders/new?error=sender");
  }

  const audienceResolved = await resolveAudience({
    userId: session.userId,
    audience,
    contactGroupId,
    recipientsRaw,
    countryCode,
  });
  if (!audienceResolved) {
    redirect("/dashboard/reminders/new?error=recipients");
  }

  const pricing = await prisma.smsPricing.findFirst({
    where: { country: { code: countryCode } },
  });
  const costPerUnit = pricing?.memberPrice.toNumber() ?? 0.05;

  const recurrence: CampaignRecurrence =
    repeat === "monthly" ? "MONTHLY" : "NONE";
  const recurrenceEndAt = recurrenceEndRaw ? new Date(recurrenceEndRaw) : undefined;

  async function createLeg(opts: {
    kind: "early" | "due";
    message: string;
    scheduledAt: Date;
  }) {
    if (opts.scheduledAt <= new Date()) {
      redirect("/dashboard/reminders/new?error=schedule");
    }
    const { estimatedCost } = estimateCampaignCost(
      opts.message,
      audienceResolved!.recipientCount,
      costPerUnit,
    );
    return prisma.campaign.create({
      data: {
        userId: session!.userId,
        name: reminderCampaignName(title, opts.kind),
        senderId,
        message: opts.message,
        contactGroupId: audienceResolved!.contactGroupId,
        recipientsText: audienceResolved!.recipientsText,
        recipientCount: audienceResolved!.recipientCount,
        estimatedCost,
        countryCode,
        timezone,
        recurrence,
        recurrenceEndAt,
        status: "SCHEDULED",
        scheduledAt: opts.scheduledAt,
      },
    });
  }

  if (earlyEnabled) {
    const earlyAt = subtractDays(dueAt, earlyDays);
    await createLeg({
      kind: "early",
      message: earlyMessage,
      scheduledAt: earlyAt,
    });
  }

  await createLeg({
    kind: "due",
    message: dueMessage,
    scheduledAt: dueAt,
  });

  revalidatePath("/dashboard/reminders");
  revalidatePath("/dashboard/campaigns");
  redirect("/dashboard/reminders?created=1");
}

export async function cancelReminderAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const id = String(formData.get("id") ?? "");
  await prisma.campaign.updateMany({
    where: {
      id,
      userId: session.userId,
      name: { startsWith: REMINDER_NAME_PREFIX },
      status: { in: ["SCHEDULED", "PAUSED", "DRAFT"] },
    },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/dashboard/reminders");
  redirect("/dashboard/reminders");
}

export async function pauseReminderAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const id = String(formData.get("id") ?? "");
  await prisma.campaign.updateMany({
    where: {
      id,
      userId: session.userId,
      name: { startsWith: REMINDER_NAME_PREFIX },
      status: "SCHEDULED",
    },
    data: { status: "PAUSED" },
  });
  revalidatePath("/dashboard/reminders");
  redirect("/dashboard/reminders");
}

export async function resumeReminderAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  const id = String(formData.get("id") ?? "");
  await prisma.campaign.updateMany({
    where: {
      id,
      userId: session.userId,
      name: { startsWith: REMINDER_NAME_PREFIX },
      status: "PAUSED",
    },
    data: { status: "SCHEDULED" },
  });
  revalidatePath("/dashboard/reminders");
  redirect("/dashboard/reminders");
}
