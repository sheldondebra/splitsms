import { prisma } from "@/lib/db";
import { formatTicketNumber } from "@/lib/support/chat";
import { loadSlackOfficeConfig, isSlackSupportThreadsConfigured } from "@/lib/slack/config";
import { postSlackBotMessage } from "@/lib/slack/bot-client";
import { slackSupportTicketBlocks } from "@/lib/slack/blocks";
import { postSlackMessage } from "@/lib/slack/client";

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export async function openSupportTicketThread(ticketId: string) {
  const config = await loadSlackOfficeConfig();
  if (!isSlackSupportThreadsConfigured(config)) {
    return { ok: false as const, error: "threads_not_configured" as const };
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { user: { select: { fullName: true, phone: true, email: true } } },
  });
  if (!ticket) return { ok: false as const, error: "notfound" as const };

  if (ticket.slackThreadTs) {
    return { ok: true as const, threadTs: ticket.slackThreadTs };
  }

  const ref = formatTicketNumber(ticket.reference);
  const blocks = slackSupportTicketBlocks({
    ticketId: ticket.id,
    reference: ref ?? null,
    subject: ticket.subject,
    memberName: ticket.user.fullName,
    memberPhone: ticket.user.phone,
    memberEmail: ticket.user.email,
    message: ticket.message,
    status: ticket.status,
    threaded: true,
  });

  const posted = await postSlackBotMessage(
    {
      channel: config.supportChannelId,
      text: `New support ticket${ref ? ` ${ref}` : ""}: ${ticket.subject}`,
      blocks,
    },
    config,
  );

  if (!posted.ok) return { ok: false as const, error: posted.error };

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      slackThreadTs: posted.ts,
      slackChannelId: posted.channel,
    },
  });

  await postSlackBotMessage(
    {
      channel: posted.channel,
      threadTs: posted.ts,
      text: ticket.message,
    },
    config,
  );

  return { ok: true as const, threadTs: posted.ts };
}

export async function postStaffReplyToSupportThread(ticketId: string, body: string) {
  const config = await loadSlackOfficeConfig();
  if (!isSlackSupportThreadsConfigured(config)) return;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { slackThreadTs: true, slackChannelId: true },
  });
  if (!ticket?.slackThreadTs || !ticket.slackChannelId) return;

  await postSlackBotMessage(
    {
      channel: ticket.slackChannelId,
      threadTs: ticket.slackThreadTs,
      text: `:speech_balloon: *Support reply sent to member*\n${body}`,
    },
    config,
  );
}

export async function postSupportStatusToThread(
  ticketId: string,
  status: string,
  adminId: string,
) {
  const config = await loadSlackOfficeConfig();
  if (!isSlackSupportThreadsConfigured(config)) return;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { slackThreadTs: true, slackChannelId: true },
  });
  if (!ticket?.slackThreadTs || !ticket.slackChannelId) return;

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { fullName: true },
  });

  await postSlackBotMessage(
    {
      channel: ticket.slackChannelId,
      threadTs: ticket.slackThreadTs,
      text: `:label: Status → *${statusLabel(status)}*${admin ? ` · ${admin.fullName}` : ""}`,
    },
    config,
  );
}

export async function notifySlackSupportTicketWithFallback(ticketId: string) {
  const config = await loadSlackOfficeConfig();
  if (!config.enabled || !config.notifySupportTickets) return;

  if (isSlackSupportThreadsConfigured(config)) {
    await openSupportTicketThread(ticketId);
    return;
  }

  if (!config.webhookUrl.startsWith("https://hooks.slack.com/")) return;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { user: { select: { fullName: true, phone: true } } },
  });
  if (!ticket) return;

  const ref = formatTicketNumber(ticket.reference);

  await postSlackMessage(
    {
      text: `New support ticket: ${ticket.subject}`,
      blocks: slackSupportTicketBlocks({
        ticketId: ticket.id,
        reference: ref ?? null,
        subject: ticket.subject,
        memberName: ticket.user.fullName,
        memberPhone: ticket.user.phone,
        message: ticket.message,
        status: ticket.status,
        threaded: false,
      }),
    },
    config,
  );
}
