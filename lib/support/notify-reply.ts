import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { sendPlatformAlertSms } from "@/lib/sms/platform-notify";
import { getSiteUrl, siteName } from "@/lib/site-config";
import { formatTicketNumber } from "@/lib/support/chat";

export async function notifyMemberSupportReply(ticketId: string, replyBody: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { id: true, fullName: true, phone: true, email: true } },
    },
  });
  if (!ticket) return;

  const ref = formatTicketNumber(ticket.id, ticket.createdAt);
  const supportUrl = `${getSiteUrl()}/dashboard/support`;
  const preview =
    replyBody.length > 160 ? `${replyBody.slice(0, 157)}...` : replyBody;

  await createNotification(
    ticket.user.id,
    "SYSTEM",
    `Support reply on ${ref}`,
    preview,
    { kind: "support_reply", ticketId, ticketRef: ref },
  );

  const tasks: Promise<unknown>[] = [];

  if (ticket.user.email) {
    const subject = `${siteName} support reply — ${ref}`;
    const text = `Hi ${ticket.user.fullName},

Our team replied to your support request "${ticket.subject}" (${ref}):

${replyBody}

View the conversation: ${supportUrl}

— ${siteName}`;
    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #171717; max-width: 520px; margin: 0 auto; padding: 24px;">
  <p style="font-size: 15px;">Hi ${ticket.user.fullName},</p>
  <p style="font-size: 14px; color: #525252;">Our team replied to <strong>${ticket.subject}</strong> (${ref}):</p>
  <blockquote style="margin: 16px 0; padding: 12px 16px; border-left: 3px solid #ea580c; background: #fafafa; font-size: 14px; white-space: pre-wrap;">${replyBody.replace(/</g, "&lt;")}</blockquote>
  <p style="font-size: 13px;"><a href="${supportUrl}">Open support in your dashboard</a></p>
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
  <p style="font-size: 12px; color: #a3a3a3;">${siteName}</p>
</body>
</html>`.trim();
    tasks.push(
      sendEmail({ to: ticket.user.email, subject, text, html }),
    );
  }

  if (ticket.user.phone) {
    tasks.push(
      sendPlatformAlertSms(
        ticket.user.phone,
        `${siteName}: Reply on ticket ${ref}. ${preview} — ${supportUrl}`,
      ),
    );
  }

  await Promise.allSettled(tasks);
}
