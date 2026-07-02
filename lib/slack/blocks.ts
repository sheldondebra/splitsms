import { buildSlackActionUrl, buildSlackGoUrl } from "@/lib/slack/quick-actions";
import { buildSlackNotification } from "@/lib/slack/message-layout";
import type { SlackBlock } from "@/lib/slack/client";

export function slackSenderIdRequestBlocks(input: {
  senderId: string;
  value: string;
  countryCode: string;
  memberName: string;
  memberPhone: string;
  memberEmail?: string | null;
}): SlackBlock[] {
  return buildSlackNotification({
    category: "action_required",
    title: "Sender ID awaiting approval",
    summary: `\`${input.value}\` · ${input.countryCode}`,
    fields: [
      { label: "Member", value: input.memberName },
      { label: "Phone", value: input.memberPhone },
      ...(input.memberEmail ? [{ label: "Email", value: input.memberEmail }] : []),
    ],
    actions: [
      { label: "Approve", url: buildSlackActionUrl("sender_approve", input.senderId), style: "primary" },
      { label: "Deny", url: buildSlackActionUrl("sender_deny", input.senderId), style: "danger" },
      { label: "Ban ID", url: buildSlackActionUrl("sender_ban", input.senderId), style: "danger" },
      {
        label: "Open queue",
        url: buildSlackGoUrl("/admin/sender-ids?tab=pending"),
      },
    ],
  });
}

export function slackOfflinePaymentBlocks(input: {
  paymentId: string;
  memberName: string;
  memberPhone: string;
  amount: string;
  currency: string;
  reference?: string | null;
  note?: string | null;
}): SlackBlock[] {
  return buildSlackNotification({
    category: "action_required",
    title: "Offline top-up pending review",
    summary: `*${input.currency} ${input.amount}* from ${input.memberName}`,
    fields: [
      { label: "Member", value: input.memberName },
      { label: "Phone", value: input.memberPhone },
      ...(input.reference ? [{ label: "Reference", value: `\`${input.reference}\`` }] : []),
      ...(input.note ? [{ label: "Note", value: input.note }] : []),
    ],
    actions: [
      {
        label: "Credit wallet",
        url: buildSlackActionUrl("payment_credit", input.paymentId),
        style: "primary",
      },
      { label: "Deny", url: buildSlackActionUrl("payment_deny", input.paymentId), style: "danger" },
      { label: "Open payments", url: buildSlackGoUrl("/admin/payments") },
    ],
  });
}

export function slackOnlinePaymentBlocks(input: {
  paymentId: string;
  memberName: string;
  amount: string;
  currency: string;
  method: string;
}): SlackBlock[] {
  return buildSlackNotification({
    category: "payments",
    title: "Payment received",
    fields: [
      { label: "Member", value: input.memberName },
      { label: "Amount", value: `${input.currency} ${input.amount}` },
      { label: "Method", value: input.method },
    ],
    dashboardPath: buildSlackGoUrl("/admin/payments"),
    dashboardLabel: "View in payments dashboard",
  });
}

export function slackUserRegistrationBlocks(input: {
  fullName: string;
  phone: string;
  email?: string | null;
  userId: string;
}): SlackBlock[] {
  return buildSlackNotification({
    category: "members",
    title: "New member registered",
    fields: [
      { label: "Name", value: input.fullName },
      { label: "Phone", value: input.phone },
      ...(input.email ? [{ label: "Email", value: input.email }] : []),
    ],
    dashboardPath: buildSlackGoUrl(`/admin/members/${input.userId}`),
    dashboardLabel: "View member profile",
  });
}

export function slackUserLoginBlocks(input: {
  fullName: string;
  phone: string;
  userId: string;
}): SlackBlock[] {
  return buildSlackNotification({
    category: "members",
    title: "Member signed in",
    fields: [
      { label: "Name", value: input.fullName },
      { label: "Phone", value: input.phone },
    ],
    dashboardPath: buildSlackGoUrl(`/admin/members/${input.userId}`),
    dashboardLabel: "View member profile",
  });
}

export function slackAuthFailureBlocks(input: { identifier: string }): SlackBlock[] {
  return buildSlackNotification({
    category: "security",
    title: "Failed login attempt",
    fields: [{ label: "Identifier", value: `\`${input.identifier}\`` }],
    dashboardPath: buildSlackGoUrl("/admin/members"),
    dashboardLabel: "Open members admin",
  });
}

export function slackSupportTicketBlocks(input: {
  ticketId: string;
  reference: string | null;
  subject: string;
  memberName: string;
  memberPhone?: string;
  memberEmail?: string | null;
  message: string;
  status: string;
  threaded?: boolean;
}): SlackBlock[] {
  const preview =
    input.message.length > 280 ? `${input.message.slice(0, 277)}…` : input.message;

  return buildSlackNotification({
    category: "support",
    title: input.reference ? `Ticket ${input.reference}` : "New support ticket",
    summary: input.subject,
    fields: [
      ...(input.reference ? [{ label: "Ticket", value: input.reference }] : []),
      { label: "Status", value: input.status.replace(/_/g, " ") },
      { label: "Member", value: input.memberName },
      ...(input.memberPhone ? [{ label: "Phone", value: input.memberPhone }] : []),
      ...(input.memberEmail ? [{ label: "Email", value: input.memberEmail }] : []),
      { label: "Message", value: preview },
    ],
    actions: [
      {
        label: "In progress",
        url: buildSlackActionUrl("ticket_in_progress", input.ticketId),
        style: "primary",
      },
      {
        label: "Resolved",
        url: buildSlackActionUrl("ticket_resolved", input.ticketId),
      },
      {
        label: "Close",
        url: buildSlackActionUrl("ticket_closed", input.ticketId),
        style: "danger",
      },
      {
        label: "Open inbox",
        url: buildSlackGoUrl("/admin/support"),
      },
    ],
    ...(input.threaded
      ? {}
      : {
          dashboardPath: buildSlackGoUrl("/admin/support"),
          dashboardLabel: "Open support inbox",
        }),
  });
}
