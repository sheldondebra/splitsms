import { sendMnotifyQuickSms, isMnotifyConfigured } from "@/lib/mnotify";

/** Operational SMS (alerts) — billed to platform mNotify account, not member wallet. */
export async function sendPlatformAlertSms(phone: string, message: string) {
  if (!(await isMnotifyConfigured())) {
    return { ok: false as const, error: "mNotify not configured" };
  }

  const { getMnotifyConfig } = await import("@/lib/mnotify");
  const { defaultSender } = await getMnotifyConfig();

  return sendMnotifyQuickSms({
    recipients: [phone],
    sender: defaultSender,
    message,
  });
}
