"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth/session";
import { processPendingMessagesBatch } from "@/lib/queue/process-pending-batch";
import { syncPendingMnotifyDeliveries } from "@/lib/sms/sync-mnotify-dlr";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

export async function adminProcessPendingSmsAction(formData: FormData) {
  const session = await requireAdmin();
  const limit = Math.min(100, Math.max(1, Number(formData.get("limit") ?? 50)));

  const sms = await processPendingMessagesBatch(limit);
  const dlr = await syncPendingMnotifyDeliveries(Math.min(limit, 30)).catch(() => ({
    campaigns: 0,
    rowsUpdated: 0,
  }));

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "SMS_PENDING_PROCESSED",
      entityType: "Message",
      entityId: "batch",
      metadata: { ...sms, dlr },
    },
  });

  void import("@/lib/slack/notify")
    .then(({ notifySlackSmsBatchResult }) =>
      notifySlackSmsBatchResult({
        processed: sms.processed,
        sent: sms.sent,
        failed: sms.failed,
        remaining: sms.remaining,
        source: "admin",
        failedSamples: sms.failedSamples,
      }),
    )
    .catch(() => undefined);

  revalidatePath("/admin/operations");
  const q = new URLSearchParams({
    processed: String(sms.processed),
    sent: String(sms.sent),
    failed: String(sms.failed),
    remaining: String(sms.remaining),
  });
  redirect(`/admin/operations?${q.toString()}`);
}
