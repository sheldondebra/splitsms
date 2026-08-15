"use server";

import { prisma, warmDatabaseConnection } from "@/lib/db";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { enqueueSmsJob } from "@/lib/queue/enqueue-sms";
import { revalidatePath } from "next/cache";

export async function adminRetryLiveMessageAction(
  messageId: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return { ok: false, error: "Unauthorized" };
  }

  const id = messageId.trim();
  if (!id) return { ok: false, error: "Missing message id" };

  const msg = await prisma.message.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      countryCode: true,
      priority: true,
      userId: true,
      smsUnits: true,
      cost: true,
      isSandbox: true,
      recipient: true,
    },
  });

  if (!msg || msg.isSandbox) {
    return { ok: false, error: "Message not found" };
  }
  if (msg.status !== "FAILED") {
    return { ok: false, error: `Only failed messages can be retried (now ${msg.status})` };
  }

  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId: msg.userId } });
    const { deductSmsCredits } = await import("@/lib/sms/billing");
    await deductSmsCredits(
      msg.userId,
      msg.smsUnits,
      msg.cost?.toNumber() ?? 0,
      wallet?.currency ?? "GHS",
      `Admin live retry to ${msg.recipient}`,
      msg.countryCode ?? "GH",
    );
  } catch {
    return { ok: false, error: "Member has insufficient credits to retry" };
  }

  await prisma.message.update({
    where: { id: msg.id },
    data: { status: "PENDING", failureReason: null, failedAt: null },
  });

  await warmDatabaseConnection().catch(() => undefined);
  await enqueueSmsJob(msg.id, msg.countryCode ?? "GH", msg.priority);

  revalidatePath("/admin/live-update");
  revalidatePath("/admin/messages");

  return { ok: true, message: "Message re-queued for delivery" };
}

export async function adminRetryLiveCampaignFailedAction(
  campaignId: string,
): Promise<{ ok: true; retried: number } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return { ok: false, error: "Unauthorized" };
  }

  const id = campaignId.trim();
  if (!id) return { ok: false, error: "Missing campaign id" };

  const failed = await prisma.message.findMany({
    where: { campaignId: id, status: "FAILED", isSandbox: false },
    take: 200,
    select: {
      id: true,
      userId: true,
      smsUnits: true,
      cost: true,
      countryCode: true,
      priority: true,
    },
  });

  if (failed.length === 0) {
    return { ok: true, retried: 0 };
  }

  const userId = failed[0]!.userId;
  const unitsNeeded = failed.reduce((s, m) => s + m.smsUnits, 0);
  const costNeeded = failed.reduce((s, m) => s + (m.cost?.toNumber() ?? 0), 0);

  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    const { deductSmsCredits } = await import("@/lib/sms/billing");
    await deductSmsCredits(
      userId,
      unitsNeeded,
      costNeeded,
      wallet?.currency ?? "GHS",
      `Admin live retry ${failed.length} campaign messages`,
      failed[0]?.countryCode ?? "GH",
    );
  } catch {
    return { ok: false, error: "Member has insufficient credits to retry" };
  }

  await prisma.message.updateMany({
    where: { id: { in: failed.map((m) => m.id) } },
    data: { status: "PENDING", failureReason: null, failedAt: null },
  });

  const { enqueueSmsJobsInline } = await import("@/lib/queue/enqueue-sms");
  await warmDatabaseConnection().catch(() => undefined);
  await enqueueSmsJobsInline(
    failed.map((msg) => ({
      messageId: msg.id,
      countryCode: msg.countryCode ?? "GH",
      priority: msg.priority,
    })),
  );

  revalidatePath("/admin/live-update");
  return { ok: true, retried: failed.length };
}
