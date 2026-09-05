"use server";

import { revalidatePath } from "next/cache";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { sendAdminTestSms } from "@/lib/sms/admin-test-send";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) throw new Error("Unauthorized");
  return session;
}

export async function sendAdminSmsTestAction(input: {
  numbers: string;
  senderId: string;
  message: string;
}): Promise<{ ok: boolean; message: string }> {
  const session = await requireAdmin();

  const numbers = input.numbers
    .split(/[\n,;]+/)
    .map((n) => n.trim())
    .filter(Boolean);
  const senderId = input.senderId.trim();
  const body = input.message.trim();

  if (numbers.length === 0) return { ok: false, message: "Add at least one phone number." };
  if (numbers.length > 20) return { ok: false, message: "Test with at most 20 numbers at a time." };
  if (!senderId) return { ok: false, message: "Choose a sender ID." };
  if (!body) return { ok: false, message: "Write a test message." };

  const results = await Promise.all(
    numbers.map((recipientRaw) =>
      sendAdminTestSms({ adminUserId: session.userId, recipientRaw, body, senderId }),
    ),
  );

  revalidatePath("/admin/general");

  const failed = results.filter((r): r is { ok: false; recipient: string; error: string } => !r.ok);
  const sentCount = results.length - failed.length;

  if (failed.length > 0) {
    return {
      ok: sentCount > 0,
      message:
        `${sentCount} sent, ${failed.length} failed — ` +
        failed.map((f) => `${f.recipient}: ${f.error}`).join("; "),
    };
  }

  return { ok: true, message: `Sent ${sentCount} test message${sentCount === 1 ? "" : "s"}.` };
}
