import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { maintenanceNoticeEmailContent } from "@/lib/email/templates";
import { sendMnotifyQuickSms, getMnotifyConfig } from "@/lib/mnotify";
import type { MaintenanceConfig } from "@/lib/admin/maintenance";

const MAX_RECIPIENTS = 500;
const SMS_BATCH_SIZE = 100;
const EMAIL_BATCH_SIZE = 25;

export async function notifyMembersOfMaintenance(params: {
  event: "start" | "end";
  config: MaintenanceConfig;
  notifyEmail: boolean;
  notifySms: boolean;
}): Promise<{ emailsSent: number; smsSent: number; audienceSize: number }> {
  const { event, config, notifyEmail, notifySms } = params;
  if (!notifyEmail && !notifySms) return { emailsSent: 0, smsSent: 0, audienceSize: 0 };

  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    select: { fullName: true, email: true, phone: true },
    take: MAX_RECIPIENTS,
  });

  let emailsSent = 0;
  let smsSent = 0;

  if (notifyEmail) {
    const { subject, text, html } = await maintenanceNoticeEmailContent({
      subject: event === "start" ? config.startEmailSubject : config.endEmailSubject,
      bodyText: event === "start" ? config.startEmailBody : config.endEmailBody,
      headline: event === "start" ? "Scheduled maintenance" : "We're back online",
    });

    const withEmail = members.filter((m): m is typeof m & { email: string } => Boolean(m.email));
    for (let i = 0; i < withEmail.length; i += EMAIL_BATCH_SIZE) {
      const batch = withEmail.slice(i, i + EMAIL_BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((m) =>
          sendEmail({ to: m.email, toName: m.fullName ?? undefined, subject, text, html }),
        ),
      );
      emailsSent += results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
    }
  }

  if (notifySms) {
    const smsBody = event === "start" ? config.startSmsBody : config.endSmsBody;
    const { defaultSender } = await getMnotifyConfig();
    const phones = [...new Set(members.map((m) => m.phone).filter(Boolean))] as string[];
    for (let i = 0; i < phones.length; i += SMS_BATCH_SIZE) {
      const batch = phones.slice(i, i + SMS_BATCH_SIZE);
      const result = await sendMnotifyQuickSms({
        recipients: batch,
        sender: defaultSender || "SplitSMS",
        message: smsBody,
      });
      if (result.ok) smsSent += batch.length;
    }
  }

  return { emailsSent, smsSent, audienceSize: members.length };
}
