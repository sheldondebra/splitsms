import { prisma } from "@/lib/db";
import { countSmsUnits } from "@/lib/sms/units";
import { deductSmsCredits } from "@/lib/sms/billing";
import { personalizeMessage } from "@/lib/sms/personalize";
import { enqueueSmsJob } from "@/lib/queue/enqueue-sms";
import { resolveMessagePriority } from "@/lib/enterprise/priority";
import { createNotification } from "@/lib/notifications";
import { emitCampaignCompleted } from "@/lib/webhooks/events";
import {
  computeNextScheduledAt,
  shouldScheduleRecurrence,
} from "@/lib/campaigns/recurrence";
import type { CampaignRecurrence } from "@/lib/generated/prisma/client";

export type CampaignRecipient = {
  phone: string;
  name?: string | null;
  countryCode?: string | null;
  email?: string | null;
};

export async function resolveCampaignRecipients(
  campaignId: string,
  recipientsRaw?: string,
): Promise<CampaignRecipient[]> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      contactGroup: {
        include: { members: { include: { contact: true } } },
      },
      messages: { select: { recipient: true, body: true } },
    },
  });
  if (!campaign) return [];

  if (campaign.contactGroup) {
    return campaign.contactGroup.members.map((m) => ({
      phone: m.contact.phone,
      name: m.contact.name,
      countryCode: m.contact.countryCode ?? campaign.countryCode,
      email: m.contact.email,
    }));
  }

  if (campaign.messages.length > 0) {
    return campaign.messages.map((m) => ({
      phone: m.recipient,
      countryCode: campaign.countryCode,
    }));
  }

  if (recipientsRaw || campaign.recipientsText) {
    const { normalizePhones } = await import("@/lib/sms/units");
    const raw = recipientsRaw ?? campaign.recipientsText ?? "";
    return normalizePhones(raw).map((phone) => ({
      phone,
      countryCode: campaign.countryCode,
    }));
  }

  return [];
}

export async function dispatchCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });
  if (!campaign || !["SCHEDULED", "SENDING"].includes(campaign.status)) {
    return { ok: false as const, reason: "invalid_status" };
  }

  const recipients = await resolveCampaignRecipients(campaignId);
  if (recipients.length === 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "CANCELLED" },
    });
    return { ok: false as const, reason: "no_recipients" };
  }

  const countryCode = campaign.countryCode;
  const pricing = await prisma.smsPricing.findFirst({
    where: { country: { code: countryCode } },
  });
  const costPerUnit = pricing?.memberPrice.toNumber() ?? 0.05;
  const wallet = await prisma.wallet.findUnique({ where: { userId: campaign.userId } });
  const currency = wallet?.currency ?? "GHS";

  let totalUnits = 0;
  const bodies: { recipient: string; body: string; units: number }[] = [];
  for (const r of recipients) {
    const body = personalizeMessage(campaign.message, {
      name: r.name,
      phone: r.phone,
      country: r.countryCode,
      email: r.email,
    });
    const units = countSmsUnits(body);
    totalUnits += units;
    bodies.push({ recipient: r.phone, body, units });
  }

  const totalCost = costPerUnit * totalUnits;

  try {
    await deductSmsCredits(
      campaign.userId,
      totalUnits,
      totalCost,
      currency,
      `Campaign: ${campaign.name}`,
    );
  } catch {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "CANCELLED" },
    });
    await createNotification(
      campaign.userId,
      "SMS_FAILED",
      "Campaign failed",
      `"${campaign.name}" could not send — insufficient SMS credits.`,
      { campaignId },
    );
    return { ok: false as const, reason: "insufficient_credits" };
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "SENDING", recipientCount: recipients.length },
  });

  const priority = resolveMessagePriority({
    channel: "campaign",
    campaignName: campaign.name,
    body: campaign.message,
  });

  for (const item of bodies) {
    const msg = await prisma.message.create({
      data: {
        userId: campaign.userId,
        campaignId: campaign.id,
        recipient: item.recipient,
        body: item.body,
        countryCode,
        senderId: campaign.senderId,
        smsUnits: item.units,
        cost: costPerUnit * item.units,
        status: "PENDING",
        priority,
        channel: "campaign",
      },
    });
    await enqueueSmsJob(msg.id, countryCode, priority);
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "COMPLETED" },
  });

  await createNotification(
    campaign.userId,
    "CAMPAIGN_COMPLETED",
    "Campaign completed",
    `"${campaign.name}" finished sending to ${recipients.length} recipients.`,
    { campaignId },
  );

  await emitCampaignCompleted(campaign.userId, {
    id: campaign.id,
    name: campaign.name,
    recipientCount: recipients.length,
  });

  await maybeScheduleRecurrence(campaign);

  return { ok: true as const, sent: recipients.length };
}

async function maybeScheduleRecurrence(campaign: {
  id: string;
  userId: string;
  name: string;
  senderId: string;
  message: string;
  contactGroupId: string | null;
  countryCode: string;
  recurrence: CampaignRecurrence;
  recurrenceDays: number | null;
  recurrenceEndAt: Date | null;
  timezone: string;
  scheduledAt: Date | null;
}) {
  if (campaign.recurrence === "NONE") return;

  const base = campaign.scheduledAt ?? new Date();
  const nextAt = computeNextScheduledAt(base, campaign.recurrence, campaign.recurrenceDays);
  if (!nextAt || !shouldScheduleRecurrence(campaign.recurrence, campaign.recurrenceEndAt, nextAt)) {
    return;
  }

  await prisma.campaign.create({
    data: {
      userId: campaign.userId,
      name: `${campaign.name} (recurring)`,
      senderId: campaign.senderId,
      message: campaign.message,
      contactGroupId: campaign.contactGroupId ?? undefined,
      countryCode: campaign.countryCode,
      timezone: campaign.timezone,
      recurrence: campaign.recurrence,
      recurrenceDays: campaign.recurrenceDays ?? undefined,
      recurrenceEndAt: campaign.recurrenceEndAt ?? undefined,
      parentCampaignId: campaign.id,
      status: "SCHEDULED",
      scheduledAt: nextAt,
    },
  });

  await createNotification(
    campaign.userId,
    "SYSTEM",
    "Recurring campaign scheduled",
    `Next run of "${campaign.name}" is scheduled for ${nextAt.toISOString()}.`,
    { parentCampaignId: campaign.id },
  );
}
