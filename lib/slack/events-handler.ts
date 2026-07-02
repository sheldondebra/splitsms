import { prisma } from "@/lib/db";
import { loadSlackOfficeConfig, isSlackSupportThreadsConfigured } from "@/lib/slack/config";
import { resolveAdminIdFromSlackUser } from "@/lib/slack/bot-client";
import { staffReplyToSupportTicket } from "@/lib/support/staff-actions";

async function isDuplicateSlackEvent(eventId: string) {
  const existing = await prisma.auditLog.findFirst({
    where: { action: "SLACK_EVENT_RECEIVED", entityId: eventId },
    select: { id: true },
  });
  if (existing) return true;

  await prisma.auditLog.create({
    data: {
      action: "SLACK_EVENT_RECEIVED",
      entityType: "SlackEvent",
      entityId: eventId,
    },
  });
  return false;
}

export type SlackMessageEvent = {
  type: "message";
  user?: string;
  bot_id?: string;
  subtype?: string;
  text?: string;
  thread_ts?: string;
  ts?: string;
  channel?: string;
};

export async function handleSlackEventCallback(body: {
  type?: string;
  event?: SlackMessageEvent;
  event_id?: string;
}) {
  if (body.type !== "event_callback" || !body.event) {
    return { ok: true as const };
  }

  if (body.event_id && (await isDuplicateSlackEvent(body.event_id))) {
    return { ok: true as const, duplicate: true as const };
  }

  const config = await loadSlackOfficeConfig();
  if (!isSlackSupportThreadsConfigured(config)) {
    return { ok: true as const, ignored: "threads_disabled" as const };
  }

  const event = body.event;
  if (event.type !== "message") return { ok: true as const };
  if (event.subtype && event.subtype !== "thread_broadcast") return { ok: true as const };
  if (event.bot_id || !event.user || !event.thread_ts || !event.text?.trim()) {
    return { ok: true as const, ignored: "not_user_thread_reply" as const };
  }

  if (event.thread_ts === event.ts) {
    return { ok: true as const, ignored: "parent_message" as const };
  }

  const ticket = await prisma.supportTicket.findFirst({
    where: { slackThreadTs: event.thread_ts },
    select: { id: true },
  });
  if (!ticket) return { ok: true as const, ignored: "unknown_thread" as const };

  const adminId = await resolveAdminIdFromSlackUser(event.user, config.supportBotToken);
  if (!adminId) return { ok: false as const, error: "no_admin" as const };

  const result = await staffReplyToSupportTicket({
    ticketId: ticket.id,
    adminId,
    body: event.text.trim(),
    source: "slack",
  });

  if (!result.ok) return { ok: false as const, error: result.error };

  const { postSlackBotMessage } = await import("@/lib/slack/bot-client");
  const ticketRow = await prisma.supportTicket.findUnique({
    where: { id: ticket.id },
    select: { slackThreadTs: true, slackChannelId: true },
  });
  if (ticketRow?.slackThreadTs && ticketRow.slackChannelId) {
    await postSlackBotMessage(
      {
        channel: ticketRow.slackChannelId,
        threadTs: ticketRow.slackThreadTs,
        text: ":white_check_mark: Reply delivered to member support chat",
      },
      config,
    ).catch(() => undefined);
  }

  return { ok: true as const, ticketId: ticket.id };
}
