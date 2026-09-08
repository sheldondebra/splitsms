"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { sendAdminTestSms } from "@/lib/sms/admin-test-send";
import { syncUserPendingMnotifyDeliveries } from "@/lib/sms/sync-mnotify-dlr";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) throw new Error("Unauthorized");
  return session;
}

export type AdminSmsTestSentEntry = { id: string; recipient: string };

export async function sendAdminSmsTestAction(input: {
  numbers: string;
  senderId: string;
  message: string;
}): Promise<{ ok: boolean; message: string; sent: AdminSmsTestSentEntry[] }> {
  const session = await requireAdmin();

  const numbers = input.numbers
    .split(/[\n,;]+/)
    .map((n) => n.trim())
    .filter(Boolean);
  const senderId = input.senderId.trim();
  const body = input.message.trim();

  if (numbers.length === 0) return { ok: false, message: "Add at least one phone number.", sent: [] };
  if (numbers.length > 20) return { ok: false, message: "Test with at most 20 numbers at a time.", sent: [] };
  if (!senderId) return { ok: false, message: "Choose a sender ID.", sent: [] };
  if (!body) return { ok: false, message: "Write a test message.", sent: [] };

  const results = await Promise.all(
    numbers.map((recipientRaw) =>
      sendAdminTestSms({ adminUserId: session.userId, recipientRaw, body, senderId }),
    ),
  );

  revalidatePath("/admin/general");

  const failed = results.filter((r): r is { ok: false; recipient: string; error: string } => !r.ok);
  const sent = results.filter(
    (r): r is { ok: true; messageId: string; recipient: string } => r.ok,
  );

  if (failed.length > 0) {
    return {
      ok: sent.length > 0,
      message:
        `${sent.length} sent, ${failed.length} failed — ` +
        failed.map((f) => `${f.recipient}: ${f.error}`).join("; "),
      sent: sent.map((s) => ({ id: s.messageId, recipient: s.recipient })),
    };
  }

  return {
    ok: true,
    message: `Sent ${sent.length} test message${sent.length === 1 ? "" : "s"}.`,
    sent: sent.map((s) => ({ id: s.messageId, recipient: s.recipient })),
  };
}

export type AdminSmsTestLiveStatus = {
  id: string;
  status: string;
  sentAt: string | null;
  deliveredAt: string | null;
  failureReason: string | null;
};

/** Actively pulls fresh delivery reports, then returns current status for the given test messages. */
export async function pollAdminSmsTestStatusAction(
  messageIds: string[],
): Promise<AdminSmsTestLiveStatus[]> {
  const session = await requireAdmin();
  if (messageIds.length === 0) return [];

  await syncUserPendingMnotifyDeliveries(session.userId, 40).catch(() => undefined);

  const rows = await prisma.message.findMany({
    where: { id: { in: messageIds }, userId: session.userId },
    select: { id: true, status: true, sentAt: true, deliveredAt: true, failureReason: true },
  });

  return rows.map((r) => ({
    id: r.id,
    status: r.status,
    sentAt: r.sentAt ? r.sentAt.toISOString() : null,
    deliveredAt: r.deliveredAt ? r.deliveredAt.toISOString() : null,
    failureReason: r.failureReason,
  }));
}
