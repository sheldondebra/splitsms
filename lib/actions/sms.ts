"use server";

import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import { after } from "next/server";
import { prisma, warmDatabaseConnection } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import {
  getMemberAccountForUser,
  isMemberSuspended,
  memberHasFeature,
} from "@/lib/admin/member-account";
import { ResellerAccessError } from "@/lib/reseller/access";
import { countSmsUnits, normalizePhones, isGsm7 } from "@/lib/sms/units";
import { deductSmsCredits } from "@/lib/sms/billing";
import { enqueueSmsJobsInline } from "@/lib/queue/enqueue-sms";
import { resolveMessagePriority } from "@/lib/enterprise/priority";
import { resolveApprovedSenderForUser } from "@/lib/sender-ids/validate-send";
import { redirect } from "next/navigation";

export type SendSmsResult =
  | {
      ok: true;
      recipientCount: number;
      campaignId: string;
      creditsUsed: number;
      scheduled?: false;
    }
  | {
      ok: true;
      recipientCount: number;
      campaignId: string;
      scheduled: true;
      scheduledAt: string;
      estimatedCredits: number;
    }
  | { ok: false; error: string };

export type SaveSendDraftResult =
  | { ok: true; draftId: string }
  | { ok: false; error: string };

async function resolveDraftSenderId(userId: string, senderIdRaw: string) {
  const trimmed = senderIdRaw.trim();
  if (!trimmed) return "";

  const owned = await prisma.senderId.findFirst({
    where: { userId, value: trimmed },
    select: { value: true },
  });
  return owned?.value ?? trimmed;
}

async function promoteDraftCampaign(
  userId: string,
  draftId: string | undefined,
  data: Parameters<typeof prisma.campaign.create>[0]["data"],
) {
  if (draftId) {
    const draft = await prisma.campaign.findFirst({
      where: { id: draftId, userId, status: "DRAFT" },
      select: { id: true },
    });
    if (draft) {
      return prisma.campaign.update({
        where: { id: draft.id },
        data,
      });
    }
  }

  return prisma.campaign.create({ data });
}

export async function saveSendDraftAction(formData: FormData): Promise<SaveSendDraftResult> {
  const session = await getSession();
  if (!session) redirect("/login");

  const draftId = String(formData.get("draftId") ?? "").trim() || undefined;
  const senderIdRaw = String(formData.get("senderId") ?? "");
  const body = String(formData.get("body") ?? "");
  const recipientsRaw = String(formData.get("recipients") ?? "");
  const countryCode = String(formData.get("countryCode") ?? DEFAULT_COUNTRY_CODE);
  const scheduleRaw = String(formData.get("scheduledAt") ?? "");
  const draftName = String(formData.get("draftName") ?? "").trim();

  if (!body.trim() && !recipientsRaw.trim()) {
    return { ok: false, error: "empty" };
  }

  const senderId = await resolveDraftSenderId(session.userId, senderIdRaw);
  if (!senderId) {
    return { ok: false, error: "sender" };
  }

  const recipients = normalizePhones(recipientsRaw);
  const units = body.trim() ? countSmsUnits(body) : 0;
  const pricing = await prisma.smsPricing.findFirst({
    where: { country: { code: countryCode }, isActive: true },
  });
  const costPerUnit = pricing?.memberPrice.toNumber() ?? 0.05;
  const totalUnits = units * recipients.length;
  const estimatedCost = totalUnits > 0 ? costPerUnit * totalUnits : null;

  const scheduledAt = scheduleRaw ? new Date(scheduleRaw) : null;
  const scheduledForLater = Boolean(scheduledAt && scheduledAt > new Date());
  const name =
    draftName ||
    `Draft · ${new Date().toLocaleString("en-GB", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`;

  const data = {
    name,
    senderId,
    message: body,
    recipientsText: recipientsRaw,
    recipientCount: recipients.length,
    estimatedCost,
    countryCode,
    scheduledAt: scheduledForLater ? scheduledAt : null,
    status: "DRAFT" as const,
  };

  if (draftId) {
    const existing = await prisma.campaign.findFirst({
      where: { id: draftId, userId: session.userId, status: "DRAFT" },
      select: { id: true },
    });
    if (!existing) {
      return { ok: false, error: "notfound" };
    }

    await prisma.campaign.update({
      where: { id: draftId },
      data,
    });
    return { ok: true, draftId };
  }

  const campaign = await prisma.campaign.create({
    data: {
      userId: session.userId,
      ...data,
    },
  });

  return { ok: true, draftId: campaign.id };
}

export async function sendSmsAction(formData: FormData): Promise<SendSmsResult> {
  const session = await getSession();
  if (!session) redirect("/login");

  const account = await getMemberAccountForUser(session.userId);
  if (isMemberSuspended(account) || !memberHasFeature(account, "featureBulkSms")) {
    return { ok: false, error: "access" };
  }

  const senderIdRaw = String(formData.get("senderId") ?? "");
  const body = String(formData.get("body") ?? "");
  const recipientsRaw = String(formData.get("recipients") ?? "");
  const countryCode = String(formData.get("countryCode") ?? DEFAULT_COUNTRY_CODE);
  const scheduleRaw = String(formData.get("scheduledAt") ?? "");
  const draftId = String(formData.get("draftId") ?? "").trim() || undefined;

  const recipients = normalizePhones(recipientsRaw);
  if (!body || recipients.length === 0) {
    return { ok: false, error: "invalid" };
  }

  let senderId: string;
  try {
    senderId = await resolveApprovedSenderForUser(session.userId, senderIdRaw);
  } catch {
    return { ok: false, error: "sender" };
  }

  const units = countSmsUnits(body);
  const pricing = await prisma.smsPricing.findFirst({
    where: { country: { code: countryCode }, isActive: true },
    include: { country: true },
  });
  const costPerUnit = pricing?.memberPrice.toNumber() ?? 0.05;
  const totalUnits = units * recipients.length;
  const totalCost = costPerUnit * totalUnits;

  const scheduledAt = scheduleRaw ? new Date(scheduleRaw) : null;
  const isScheduled = Boolean(scheduledAt && scheduledAt > new Date());

  if (isScheduled && scheduledAt) {
    const campaign = await promoteDraftCampaign(session.userId, draftId, {
      userId: session.userId,
      name: `Scheduled send ${scheduledAt.toISOString()}`,
      senderId,
      message: body,
      recipientsText: recipientsRaw,
      recipientCount: recipients.length,
      estimatedCost: totalCost,
      countryCode,
      status: "SCHEDULED",
      scheduledAt,
    });

    return {
      ok: true,
      recipientCount: recipients.length,
      campaignId: campaign.id,
      scheduled: true,
      scheduledAt: scheduledAt.toISOString(),
      estimatedCredits: totalUnits,
    };
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });
  const currency = wallet?.currency ?? "GHS";

  const campaign = await promoteDraftCampaign(session.userId, draftId, {
    userId: session.userId,
    name: `Quick send · ${new Date().toLocaleString("en-GB", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    senderId,
    message: body,
    status: "SENDING",
    recipientCount: recipients.length,
    estimatedCost: totalCost,
    countryCode,
    recipientsText: recipientsRaw,
  });

  const priority = resolveMessagePriority({ channel: "dashboard", body });

  const messages = await prisma.message.createManyAndReturn({
    data: recipients.map((recipient) => ({
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
    })),
    select: { id: true },
  });

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
    await prisma.campaign.delete({ where: { id: campaign.id } });
    if (e instanceof ResellerAccessError) {
      return { ok: false, error: e.code.toLowerCase() };
    }
    return { ok: false, error: "credits" };
  }

  const dispatchJobs = messages.map((msg) => ({
    messageId: msg.id,
    countryCode,
    priority,
  }));

  after(async () => {
    await warmDatabaseConnection().catch(() => undefined);
    await enqueueSmsJobsInline(dispatchJobs);
  });

  return {
    ok: true,
    recipientCount: recipients.length,
    campaignId: campaign.id,
    creditsUsed: totalUnits,
  };
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
