import { prisma } from "@/lib/db";
import {
  supportTicketAdminAlertContent,
  supportTicketCreatedMemberContent,
  supportTicketReplyMemberContent,
  supportTicketStatusMemberContent,
} from "@/lib/email/templates";
import { sendEmail } from "@/lib/email";
import { loadGeneralOfficeConfig } from "@/lib/general-office/config";
import { createNotification } from "@/lib/notifications";
import { sendPlatformAlertSms } from "@/lib/sms/platform-notify";
import { getSiteUrl, siteName } from "@/lib/site-config";
import { formatTicketNumber } from "@/lib/support/chat";

type AlertRecipient = { email?: string; phone?: string; name?: string };

async function resolveAdminAlertRecipients(): Promise<AlertRecipient[]> {
  const config = await loadGeneralOfficeConfig();
  const recipients: AlertRecipient[] = [];

  for (const email of config.notifyEmails) {
    recipients.push({ email });
  }
  for (const phone of config.notifyPhones) {
    recipients.push({ phone });
  }

  if (config.notifyAdminUsers) {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { email: true, phone: true, fullName: true },
    });
    for (const admin of admins) {
      recipients.push({
        email: admin.email ?? undefined,
        phone: admin.phone,
        name: admin.fullName,
      });
    }
  }

  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  return recipients.filter((r) => {
    if (r.email) {
      const key = r.email.toLowerCase();
      if (seenEmails.has(key)) return false;
      seenEmails.add(key);
    }
    if (r.phone) {
      if (seenPhones.has(r.phone)) return false;
      seenPhones.add(r.phone);
    }
    return Boolean(r.email || r.phone);
  });
}

function ticketRefOrFallback(reference: number | null): string | null {
  return formatTicketNumber(reference) ?? null;
}

async function loadTicketForNotify(ticketId: string) {
  return prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { id: true, fullName: true, phone: true, email: true } },
    },
  });
}

export async function notifyMemberSupportTicketCreated(ticketId: string) {
  const ticket = await loadTicketForNotify(ticketId);
  if (!ticket) return;

  const ref = ticketRefOrFallback(ticket.reference);
  if (!ref) return;

  const supportUrl = `${getSiteUrl()}/dashboard/support`;
  const preview =
    ticket.message.length > 160 ? `${ticket.message.slice(0, 157)}...` : ticket.message;

  await createNotification(
    ticket.user.id,
    "SYSTEM",
    `Support ticket ${ref} opened`,
    preview,
    { kind: "support_ticket_created", ticketId, ticketRef: ref },
  );

  const tasks: Promise<unknown>[] = [];
  const content = supportTicketCreatedMemberContent({
    memberName: ticket.user.fullName,
    ticketRef: ref,
    subject: ticket.subject,
    message: ticket.message,
    supportUrl,
  });

  if (ticket.user.email) {
    tasks.push(
      sendEmail({
        to: ticket.user.email,
        subject: content.subject,
        text: content.text,
        html: content.html,
      }),
    );
  }

  if (ticket.user.phone) {
    tasks.push(
      sendPlatformAlertSms(
        ticket.user.phone,
        `${siteName}: Ticket ${ref} received. We'll reply soon — ${supportUrl}`,
      ),
    );
  }

  await Promise.allSettled(tasks);
}

export async function notifyAdminsNewSupportTicket(ticketId: string) {
  const ticket = await loadTicketForNotify(ticketId);
  if (!ticket) return;

  const ref = ticketRefOrFallback(ticket.reference);
  if (!ref) return;

  const adminUrl = `${getSiteUrl()}/admin/support`;
  const smsText = `${siteName}: New ticket ${ref} from ${ticket.user.fullName}. Review: ${adminUrl}`;
  const { subject, text, html } = supportTicketAdminAlertContent({
    ticketRef: ref,
    subject: ticket.subject,
    message: ticket.message,
    memberName: ticket.user.fullName,
    memberPhone: ticket.user.phone,
    memberEmail: ticket.user.email,
    adminUrl,
  });

  const recipients = await resolveAdminAlertRecipients();
  await Promise.allSettled(
    recipients.map(async (r) => {
      if (r.email) {
        await sendEmail({ to: r.email, toName: r.name, subject, text, html });
      }
      if (r.phone) {
        await sendPlatformAlertSms(r.phone, smsText);
      }
    }),
  );
}

export async function notifyMemberSupportReply(ticketId: string, replyBody: string) {
  const ticket = await loadTicketForNotify(ticketId);
  if (!ticket) return;

  const ref = ticketRefOrFallback(ticket.reference) ?? "your ticket";
  const supportUrl = `${getSiteUrl()}/dashboard/support`;
  const preview =
    replyBody.length > 160 ? `${replyBody.slice(0, 157)}...` : replyBody;

  await createNotification(
    ticket.user.id,
    "SYSTEM",
    `Reply on ${ref}`,
    preview,
    { kind: "support_reply", ticketId, ticketRef: ref },
  );

  const tasks: Promise<unknown>[] = [];
  const content = supportTicketReplyMemberContent({
    memberName: ticket.user.fullName,
    ticketRef: ref,
    subject: ticket.subject,
    replyBody,
    supportUrl,
  });

  if (ticket.user.email) {
    tasks.push(
      sendEmail({
        to: ticket.user.email,
        subject: content.subject,
        text: content.text,
        html: content.html,
      }),
    );
  }

  if (ticket.user.phone) {
    tasks.push(
      sendPlatformAlertSms(
        ticket.user.phone,
        `${siteName}: Reply on ${ref}. ${preview} — ${supportUrl}`,
      ),
    );
  }

  await Promise.allSettled(tasks);
}

export async function notifyMemberSupportStatusUpdated(ticketId: string, status: string) {
  const ticket = await loadTicketForNotify(ticketId);
  if (!ticket) return;

  const ref = ticketRefOrFallback(ticket.reference);
  if (!ref) return;

  const supportUrl = `${getSiteUrl()}/dashboard/support`;
  const statusLabel = status.replace("_", " ").toLowerCase();

  await createNotification(
    ticket.user.id,
    "SYSTEM",
    `Ticket ${ref} ${statusLabel}`,
    `"${ticket.subject}" was marked ${statusLabel}.`,
    { kind: "support_status_updated", ticketId, ticketRef: ref, status },
  );

  const tasks: Promise<unknown>[] = [];
  const content = supportTicketStatusMemberContent({
    memberName: ticket.user.fullName,
    ticketRef: ref,
    subject: ticket.subject,
    status,
    supportUrl,
  });

  if (ticket.user.email) {
    tasks.push(
      sendEmail({
        to: ticket.user.email,
        subject: content.subject,
        text: content.text,
        html: content.html,
      }),
    );
  }

  if (ticket.user.phone) {
    tasks.push(
      sendPlatformAlertSms(
        ticket.user.phone,
        `${siteName}: Ticket ${ref} is ${statusLabel}. ${supportUrl}`,
      ),
    );
  }

  await Promise.allSettled(tasks);
}

export async function notifySupportTicketOpened(ticketId: string) {
  await Promise.allSettled([
    notifyMemberSupportTicketCreated(ticketId),
    notifyAdminsNewSupportTicket(ticketId),
  ]);
}
