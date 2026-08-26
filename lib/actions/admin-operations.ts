"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { warmDatabaseConnection } from "@/lib/db";
import { getRealSession as getSession, isAdminRole, isSuperAdmin } from "@/lib/auth/session";
import { processPendingMessagesBatch } from "@/lib/queue/process-pending-batch";
import { SMS_CRON_BATCH_LIMIT } from "@/lib/queue/sms-dispatch-config";
import { enqueueSmsJobsInline } from "@/lib/queue/enqueue-sms";
import { syncPendingMnotifyDeliveries } from "@/lib/sms/sync-mnotify-dlr";
import { processDueScheduledCampaigns } from "@/lib/campaigns/scheduler";
import { syncAllSendingCampaigns } from "@/lib/campaigns/sync-status";
import { fetchAllSmsProviderBalances } from "@/lib/sms/provider-balances";
import { maybeNotifyLowBalanceAlerts } from "@/lib/admin/balance-alerts";
import { maybeNotifySlackStuckSms } from "@/lib/admin/sms-stuck-alert";
import { syncAllSenderIdsFromProviders } from "@/lib/sender-ids/provider-sync";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || !isSuperAdmin(session.role)) redirect("/admin");
  return session;
}

async function logAdminSmsAction(
  session: { userId: string },
  action: string,
  metadata: object,
) {
  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action,
      entityType: "Message",
      entityId: "batch",
      metadata: metadata as Parameters<typeof prisma.auditLog.create>[0]["data"]["metadata"],
    },
  });
}

export type AdminSystemSyncTask = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

export type AdminSystemSyncState = {
  status: "idle" | "success" | "error";
  message: string;
  submittedAt?: number;
  tasks: AdminSystemSyncTask[];
  summary?: {
    pendingProcessed: number;
    sent: number;
    failed: number;
    remaining: number;
    deliveryRowsUpdated: number;
    scheduledProcessed: number;
    resumedPaused: number;
    providerBalancesChecked: number;
    senderIdsChecked?: number;
    senderIdsApproved?: number;
    senderIdsPending?: number;
  };
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

export async function adminProcessPendingSmsAction(formData: FormData) {
  const session = await requireAdmin();
  const limit = Math.min(200, Math.max(1, Number(formData.get("limit") ?? SMS_CRON_BATCH_LIMIT)));
  const returnTo = String(formData.get("returnTo") ?? "/admin/operations").trim() || "/admin/operations";
  const maxRounds = Math.min(5, Math.max(1, Number(formData.get("rounds") ?? 3)));

  await warmDatabaseConnection().catch(() => undefined);

  let totalProcessed = 0;
  let totalSent = 0;
  let totalFailed = 0;
  let remaining = 0;
  const failedSamples: Array<{ recipient: string; memberName: string; reason?: string | null }> = [];

  for (let round = 0; round < maxRounds; round++) {
    const sms = await processPendingMessagesBatch(limit);
    totalProcessed += sms.processed;
    totalSent += sms.sent;
    totalFailed += sms.failed;
    remaining = sms.remaining;
    for (const sample of sms.failedSamples) {
      if (failedSamples.length < 5) failedSamples.push(sample);
    }
    if (sms.processed === 0 || sms.remaining === 0) break;
  }

  const dlr = await syncPendingMnotifyDeliveries(Math.min(limit, 30)).catch(() => ({
    campaigns: 0,
    rowsUpdated: 0,
  }));

  const result = {
    processed: totalProcessed,
    sent: totalSent,
    failed: totalFailed,
    remaining,
    rounds: maxRounds,
    dlr,
    failedSamples,
  };

  await logAdminSmsAction(session, "SMS_PENDING_PROCESSED", result);

  void import("@/lib/slack/notify")
    .then(({ notifySlackSmsBatchResult }) =>
      notifySlackSmsBatchResult({
        processed: totalProcessed,
        sent: totalSent,
        failed: totalFailed,
        remaining,
        source: "admin",
        failedSamples,
      }),
    )
    .catch(() => undefined);

  revalidatePath("/admin/operations");
  revalidatePath("/admin/messages");

  const q = new URLSearchParams({
    processed: String(totalProcessed),
    sent: String(totalSent),
    failed: String(totalFailed),
    remaining: String(remaining),
  });
  redirect(`${returnTo}?${q.toString()}`);
}

async function runAdminSystemSync(session: { userId: string }) {
  const limit = 200;
  const maxRounds = 5;
  const tasks: AdminSystemSyncTask[] = [];

  await warmDatabaseConnection().catch(() => undefined);

  let resumedPaused = 0;
  try {
    const result = await prisma.campaign.updateMany({
      where: {
        status: "PAUSED",
        scheduledAt: { lte: new Date() },
      },
      data: { status: "SCHEDULED" },
    });
    resumedPaused = result.count;
    tasks.push({
      id: "paused",
      label: "Due paused campaigns",
      ok: true,
      detail: `${resumedPaused} resumed`,
    });
  } catch (error) {
    tasks.push({
      id: "paused",
      label: "Due paused campaigns",
      ok: false,
      detail: errorMessage(error),
    });
  }

  let scheduledProcessed = 0;
  try {
    const scheduled = await processDueScheduledCampaigns(50);
    scheduledProcessed = scheduled.processed;
    tasks.push({
      id: "scheduled",
      label: "Scheduled campaigns",
      ok: true,
      detail: `${scheduledProcessed} started`,
    });
  } catch (error) {
    tasks.push({
      id: "scheduled",
      label: "Scheduled campaigns",
      ok: false,
      detail: errorMessage(error),
    });
  }

  let totalProcessed = 0;
  let totalSent = 0;
  let totalFailed = 0;
  let remaining = 0;
  const failedSamples: Array<{ recipient: string; memberName: string; reason?: string | null }> = [];

  try {
    for (let round = 0; round < maxRounds; round++) {
      const sms = await processPendingMessagesBatch(limit);
      totalProcessed += sms.processed;
      totalSent += sms.sent;
      totalFailed += sms.failed;
      remaining = sms.remaining;
      for (const sample of sms.failedSamples) {
        if (failedSamples.length < 5) failedSamples.push(sample);
      }
      if (sms.processed === 0 || sms.remaining === 0) break;
    }
    tasks.push({
      id: "pending-sms",
      label: "Pending SMS",
      ok: true,
      detail: `${totalProcessed} processed, ${totalSent} sent, ${totalFailed} failed`,
    });
  } catch (error) {
    tasks.push({
      id: "pending-sms",
      label: "Pending SMS",
      ok: false,
      detail: errorMessage(error),
    });
  }

  let dlr = { campaigns: 0, rowsUpdated: 0 };
  try {
    dlr = await syncPendingMnotifyDeliveries(200);
    tasks.push({
      id: "delivery",
      label: "In-transit delivery reports",
      ok: true,
      detail: `${dlr.rowsUpdated} updated across ${dlr.campaigns} campaign checks`,
    });
  } catch (error) {
    tasks.push({
      id: "delivery",
      label: "In-transit delivery reports",
      ok: false,
      detail: errorMessage(error),
    });
  }

  let balances: Awaited<ReturnType<typeof fetchAllSmsProviderBalances>> = [];
  try {
    balances = await fetchAllSmsProviderBalances();
    const { recordProviderBalances } = await import("@/lib/sms/provider-balance-history");
    await recordProviderBalances(balances, "system-sync").catch(() => undefined);
    const failed = balances.filter((balance) => balance.status === "error").length;
    tasks.push({
      id: "balances",
      label: "Provider balances",
      ok: failed === 0,
      detail:
        failed === 0
          ? `${balances.length} provider balances checked`
          : `${failed} of ${balances.length} provider balances failed`,
    });
  } catch (error) {
    tasks.push({
      id: "balances",
      label: "Provider balances",
      ok: false,
      detail: errorMessage(error),
    });
  }

  let sendingCampaigns = 0;
  try {
    sendingCampaigns = await syncAllSendingCampaigns(100);
    tasks.push({
      id: "campaign-status",
      label: "Campaign status refresh",
      ok: true,
      detail: `${sendingCampaigns} sending campaign${sendingCampaigns === 1 ? "" : "s"} checked`,
    });
  } catch (error) {
    tasks.push({
      id: "campaign-status",
      label: "Campaign status refresh",
      ok: false,
      detail: errorMessage(error),
    });
  }

  let senderIdSync = {
    checked: 0,
    synced: 0,
    errors: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  };
  try {
    senderIdSync = await syncAllSenderIdsFromProviders(200);
    tasks.push({
      id: "sender-ids",
      label: "Sender ID carrier status",
      ok: senderIdSync.errors === 0,
      detail:
        senderIdSync.checked === 0
          ? "No submitted sender IDs to check"
          : `${senderIdSync.synced} synced · ${senderIdSync.approved} approved · ${senderIdSync.pending} pending${
              senderIdSync.rejected ? ` · ${senderIdSync.rejected} denied` : ""
            }${senderIdSync.errors ? ` · ${senderIdSync.errors} failed` : ""}`,
    });
  } catch (error) {
    tasks.push({
      id: "sender-ids",
      label: "Sender ID carrier status",
      ok: false,
      detail: errorMessage(error),
    });
  }

  let stuckAlert: { notified: boolean; delayedCount: number; deduped?: boolean } = {
    notified: false,
    delayedCount: 0,
  };
  try {
    stuckAlert = await maybeNotifySlackStuckSms();
    tasks.push({
      id: "stuck-alerts",
      label: "Stuck SMS alert check",
      ok: true,
      detail:
        stuckAlert.delayedCount > 0
          ? `${stuckAlert.delayedCount} delayed SMS detected`
          : "No delayed SMS detected",
    });
  } catch (error) {
    tasks.push({
      id: "stuck-alerts",
      label: "Stuck SMS alert check",
      ok: false,
      detail: errorMessage(error),
    });
  }

  let balanceAlerts: Awaited<ReturnType<typeof maybeNotifyLowBalanceAlerts>> = {
    checked: 0,
    alerts: 0,
    notified: 0,
    sent: [],
  };
  try {
    balanceAlerts = await maybeNotifyLowBalanceAlerts();
    tasks.push({
      id: "balance-alerts",
      label: "Low-balance alert check",
      ok: true,
      detail: `${balanceAlerts.checked} checked, ${balanceAlerts.alerts} alert${balanceAlerts.alerts === 1 ? "" : "s"}`,
    });
  } catch (error) {
    tasks.push({
      id: "balance-alerts",
      label: "Low-balance alert check",
      ok: false,
      detail: errorMessage(error),
    });
  }

  const result = {
    resumedPaused,
    scheduledProcessed,
    pendingProcessed: totalProcessed,
    sent: totalSent,
    failed: totalFailed,
    remaining,
    deliveryRowsUpdated: dlr.rowsUpdated,
    deliveryCampaignsChecked: dlr.campaigns,
    sendingCampaignsChecked: sendingCampaigns,
    providerBalancesChecked: balances.length,
    senderIdsChecked: senderIdSync.checked,
    senderIdsApproved: senderIdSync.approved,
    senderIdsPending: senderIdSync.pending,
    balanceAlerts,
    stuckAlert,
    failedSamples,
    tasks,
  };

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "SYSTEM_SYNC_TRIGGERED",
      entityType: "System",
      entityId: "global",
      metadata: result as Parameters<typeof prisma.auditLog.create>[0]["data"]["metadata"],
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/operations");
  revalidatePath("/admin/messages");
  revalidatePath("/admin/campaigns");
  revalidatePath("/admin/providers");
  revalidatePath("/admin/routes");
  revalidatePath("/admin/mnotify");
  revalidatePath("/admin/sender-ids");

  return result;
}

export async function adminSystemSyncAction(formData: FormData) {
  const session = await requireSuperAdmin();
  const returnTo = String(formData.get("returnTo") ?? "/admin").trim() || "/admin";
  const result = await runAdminSystemSync(session);

  const q = new URLSearchParams({
    systemSync: "1",
    processed: String(result.pendingProcessed),
    sent: String(result.sent),
    failed: String(result.failed),
    remaining: String(result.remaining),
    dlr: String(result.deliveryRowsUpdated),
    scheduled: String(result.scheduledProcessed),
    resumed: String(result.resumedPaused),
    balances: String(result.providerBalancesChecked),
  });
  redirect(`${returnTo}?${q.toString()}`);
}

export async function adminSystemSyncStateAction(
  _previousState: AdminSystemSyncState,
  formData: FormData,
): Promise<AdminSystemSyncState> {
  void _previousState;
  void formData;

  try {
    const session = await requireSuperAdmin();
    const result = await runAdminSystemSync(session);
    const failedTasks = result.tasks.filter((task) => !task.ok);
    return {
      status: failedTasks.length > 0 ? "error" : "success",
      message:
        failedTasks.length > 0
          ? `System sync finished with ${failedTasks.length} issue${failedTasks.length === 1 ? "" : "s"}.`
          : "System sync complete.",
      submittedAt: Date.now(),
      tasks: result.tasks,
      summary: {
        pendingProcessed: result.pendingProcessed,
        sent: result.sent,
        failed: result.failed,
        remaining: result.remaining,
        deliveryRowsUpdated: result.deliveryRowsUpdated,
        scheduledProcessed: result.scheduledProcessed,
        resumedPaused: result.resumedPaused,
        providerBalancesChecked: result.providerBalancesChecked,
        senderIdsChecked: result.senderIdsChecked,
        senderIdsApproved: result.senderIdsApproved,
        senderIdsPending: result.senderIdsPending,
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: errorMessage(error),
      submittedAt: Date.now(),
      tasks: [
        {
          id: "system-sync",
          label: "System sync",
          ok: false,
          detail: errorMessage(error),
        },
      ],
    };
  }
}

/** Re-queue failed messages after provider issues are fixed (e.g. mNotify top-up). */
export async function adminRetryFailedSmsAction(formData: FormData) {
  const session = await requireAdmin();
  const limit = Math.min(500, Math.max(1, Number(formData.get("limit") ?? 200)));
  const campaignId = String(formData.get("campaignId") ?? "").trim() || undefined;
  const returnTo = String(formData.get("returnTo") ?? "/admin/messages").trim() || "/admin/messages";

  const failed = await prisma.message.findMany({
    where: {
      status: "FAILED",
      isSandbox: false,
      ...(campaignId ? { campaignId } : {}),
    },
    orderBy: { failedAt: "asc" },
    take: limit,
    select: {
      id: true,
      countryCode: true,
      priority: true,
      userId: true,
      smsUnits: true,
      cost: true,
    },
  });

  if (failed.length === 0) {
    redirect(`${returnTo}?retried=0`);
  }

  const byUser = new Map<string, typeof failed>();
  for (const msg of failed) {
    const list = byUser.get(msg.userId) ?? [];
    list.push(msg);
    byUser.set(msg.userId, list);
  }

  const { deductSmsCredits } = await import("@/lib/sms/billing");
  const { createNotification } = await import("@/lib/notifications");
  const { sendEmail } = await import("@/lib/email");
  const { sendPlatformAlertSms } = await import("@/lib/sms/platform-notify");
  const { getSiteUrl } = await import("@/lib/site-config");
  const {
    insufficientCreditsRetryEmailContent,
    failedMessagesRetryEmailContent,
  } = await import("@/lib/email/templates");

  const retryable: typeof failed = [];
  let creditsBlockedUsers = 0;
  let creditsBlockedMessages = 0;
  let notifiedShortfall = 0;

  for (const [userId, messages] of byUser) {
    const unitsNeeded = messages.reduce((s, m) => s + m.smsUnits, 0);
    const costNeeded = messages.reduce((s, m) => s + (m.cost?.toNumber() ?? 0), 0);
    const [wallet, credit, user] = await Promise.all([
      prisma.wallet.findUnique({ where: { userId } }),
      prisma.smsCredit.findUnique({ where: { userId }, select: { balance: true } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true, email: true, phone: true },
      }),
    ]);
    const balance = credit?.balance ?? 0;

    try {
      await deductSmsCredits(
        userId,
        unitsNeeded,
        costNeeded,
        wallet?.currency ?? "GHS",
        `Admin retry ${messages.length} failed messages`,
        messages[0]?.countryCode ?? "GH",
      );
      retryable.push(...messages);

      if (user?.email?.trim()) {
        const content = await failedMessagesRetryEmailContent({
          memberName: user.fullName,
          messageCount: messages.length,
          dashboardUrl: `${getSiteUrl()}/dashboard/reports`,
        });
        await sendEmail({
          to: user.email.trim(),
          toName: user.fullName,
          subject: content.subject,
          text: content.text,
          html: content.html,
        }).catch(() => undefined);
      }
    } catch {
      creditsBlockedUsers += 1;
      creditsBlockedMessages += messages.length;

      const title = "Not enough SMS credits";
      const message =
        `Retry blocked — your account does not have enough SMS credits for a re-send. ` +
        `${messages.length.toLocaleString()} failed message${messages.length === 1 ? "" : "s"} ` +
        `need about ${unitsNeeded.toLocaleString()} credit${unitsNeeded === 1 ? "" : "s"} ` +
        `(you have ${balance.toLocaleString()}). Top up credits or ask support to retry a smaller batch.`;

      await createNotification(userId, "LOW_BALANCE", title, message, {
        href: "/dashboard/wallet",
        ctaLabel: "Top up wallet",
        creditsNeeded: unitsNeeded,
        balance,
        messagesBlocked: messages.length,
        source: "admin_retry_blocked",
      }).catch(() => undefined);

      if (user?.email?.trim()) {
        const content = await insufficientCreditsRetryEmailContent({
          memberName: user.fullName,
          balance,
          messagesBlocked: messages.length,
          creditsNeeded: unitsNeeded,
          topupUrl: `${getSiteUrl()}/dashboard/wallet`,
        });
        const emailed = await sendEmail({
          to: user.email.trim(),
          toName: user.fullName,
          subject: content.subject,
          text: content.text,
          html: content.html,
        }).catch(() => ({ ok: false as const }));
        if (emailed.ok) notifiedShortfall += 1;
      }

      if (user?.phone) {
        const smsText =
          `SplitSMS: Retry blocked — not enough SMS credits to resend ` +
          `${messages.length} message${messages.length === 1 ? "" : "s"}. ` +
          `Balance ${balance}. Top up: ${getSiteUrl()}/dashboard/wallet`;
        await sendPlatformAlertSms(user.phone, smsText.slice(0, 160)).catch(() => undefined);
      }
    }
  }

  if (retryable.length > 0) {
    await prisma.message.updateMany({
      where: { id: { in: retryable.map((m) => m.id) } },
      data: { status: "PENDING", failureReason: null, failedAt: null },
    });

    await warmDatabaseConnection().catch(() => undefined);
    await enqueueSmsJobsInline(
      retryable.map((msg) => ({
        messageId: msg.id,
        countryCode: msg.countryCode ?? "GH",
        priority: msg.priority,
      })),
    );

    await logAdminSmsAction(session, "SMS_FAILED_RETRIED", {
      count: retryable.length,
      campaignId: campaignId ?? null,
      creditsBlockedUsers,
      creditsBlockedMessages,
      notifiedShortfall,
    });
  } else if (creditsBlockedUsers > 0) {
    await logAdminSmsAction(session, "SMS_FAILED_RETRY_CREDITS_BLOCKED", {
      creditsBlockedUsers,
      creditsBlockedMessages,
      notifiedShortfall,
      campaignId: campaignId ?? null,
    });
  }

  revalidatePath("/admin/messages");
  revalidatePath("/admin/operations");

  const qs = new URLSearchParams();
  qs.set("retried", String(retryable.length));
  if (creditsBlockedUsers > 0) {
    qs.set("credits_blocked", String(creditsBlockedUsers));
    qs.set("credits_messages", String(creditsBlockedMessages));
    qs.set("notified", String(notifiedShortfall));
  }
  if (retryable.length === 0 && creditsBlockedUsers > 0) {
    qs.set("error", "credits");
  }

  redirect(`${returnTo}?${qs.toString()}`);
}
