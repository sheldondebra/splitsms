import type { SlackBlock } from "@/lib/slack/client";
import {
  providerIcon,
  providerLabel,
  SLACK,
  slackAction,
  slackCode,
  slackField,
  slackQuote,
  slackSummary,
} from "@/lib/slack/formatters";
import {
  buildSlackNotification,
  type SlackNotifyStatus,
} from "@/lib/slack/message-layout";
import { buildSlackActionUrl, buildSlackGoUrl } from "@/lib/slack/quick-actions";

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
    status: "warning",
    title: "New sender ID request",
    summary: slackQuote(
      slackSummary([
        `${SLACK.senderId} *${input.value}*`,
        `${SLACK.country} ${input.countryCode}`,
        `${SLACK.member} ${input.memberName}`,
      ]),
    ),
    fields: [
      slackField("Sender ID", slackCode(input.value), SLACK.senderId),
      slackField("Member", input.memberName, SLACK.member),
      slackField("Phone", input.memberPhone, SLACK.phone),
      ...(input.memberEmail ? [slackField("Email", input.memberEmail, SLACK.email)] : []),
      slackField("Next step", "Review name, then approve or deny", SLACK.warning),
    ],
    actions: [
      slackAction("Approve", buildSlackActionUrl("sender_approve", input.senderId), {
        style: "primary",
        icon: SLACK.approve,
      }),
      slackAction("Deny", buildSlackActionUrl("sender_deny", input.senderId), {
        style: "danger",
        icon: SLACK.deny,
      }),
      slackAction("Ban ID", buildSlackActionUrl("sender_ban", input.senderId), {
        style: "danger",
        icon: SLACK.ban,
      }),
      slackAction("Open queue", buildSlackGoUrl("/admin/sender-ids?tab=pending"), {
        icon: SLACK.inbox,
      }),
    ],
  });
}

export function slackSenderIdAdminActionBlocks(input: {
  actionLabel: string;
  value: string;
  memberName: string;
  memberPhone?: string;
  countryCode: string;
  actorName: string;
  note?: string;
  outcome?: "approved" | "pending_carriers" | "submitted";
  senderRecordId: string;
}): SlackBlock[] {
  const status: SlackNotifyStatus =
    input.outcome === "approved"
      ? "success"
      : input.actionLabel.toLowerCase().includes("denied") ||
          input.actionLabel.toLowerCase().includes("blocked")
        ? "failure"
        : "info";

  const outcomeHint =
    input.outcome === "pending_carriers"
      ? `${SLACK.queue} Awaiting carrier / registrar approval`
      : input.outcome === "approved"
        ? `${SLACK.success} Live — member notified by email & SMS`
        : null;

  return buildSlackNotification({
    category: "sender_ids",
    status,
    title: input.actionLabel,
    summary: slackQuote(
      slackSummary([
        `${SLACK.senderId} *${input.value}*`,
        `${SLACK.country} ${input.countryCode}`,
        outcomeHint,
      ]),
    ),
    fields: [
      slackField("Sender ID", slackCode(input.value), SLACK.senderId),
      slackField("Member", input.memberName, SLACK.member),
      ...(input.memberPhone ? [slackField("Phone", input.memberPhone, SLACK.phone)] : []),
      slackField("Action by", input.actorName, SLACK.admin),
      ...(input.note ? [slackField("Note", input.note, SLACK.note)] : []),
    ],
    actions: [
      slackAction("Sender IDs", buildSlackGoUrl("/admin/sender-ids?tab=pending"), {
        style: "primary",
        icon: SLACK.inbox,
      }),
      slackAction("All senders", buildSlackGoUrl("/admin/sender-ids?tab=all"), {
        icon: SLACK.view,
      }),
    ],
  });
}

export function slackSenderIdDocumentUploadedBlocks(input: {
  senderRecordId: string;
  value: string;
  countryCode: string;
  memberName: string;
  memberPhone?: string;
  docTypeLabel: string;
}): SlackBlock[] {
  return buildSlackNotification({
    category: "sender_ids",
    status: "info",
    title: "Verification document uploaded",
    summary: slackQuote(
      slackSummary([
        `${SLACK.senderId} *${input.value}*`,
        `${SLACK.country} ${input.countryCode}`,
        `${SLACK.inbox} ${input.docTypeLabel}`,
      ]),
    ),
    fields: [
      slackField("Sender ID", slackCode(input.value), SLACK.senderId),
      slackField("Document", input.docTypeLabel, SLACK.inbox),
      slackField("Member", input.memberName, SLACK.member),
      ...(input.memberPhone ? [slackField("Phone", input.memberPhone, SLACK.phone)] : []),
    ],
    actions: [
      slackAction("Review sender IDs", buildSlackGoUrl("/admin/sender-ids?tab=pending"), {
        style: "primary",
        icon: SLACK.view,
      }),
    ],
  });
}

export function slackSenderIdProviderDecisionBlocks(input: {
  value: string;
  memberName: string;
  memberPhone?: string;
  countryCode: string;
  provider: string;
  decision: "approved" | "denied" | "failed";
  providerStatus?: string | null;
  senderRecordId: string;
}): SlackBlock[] {
  const icon = providerIcon(input.provider);
  const label = providerLabel(input.provider);
  const title =
    input.decision === "approved"
      ? `${label} approved sender ID`
      : input.decision === "denied"
        ? `${label} denied sender ID`
        : `${label} registration failed`;

  const nextStep =
    input.decision === "approved"
      ? "Confirm approval on SplitSMS if not done yet"
      : input.decision === "denied"
        ? "Review name or purpose, then re-submit or deny member"
        : "Check carrier dashboard and re-submit";

  return buildSlackNotification({
    category: "sender_ids",
    status: input.decision === "approved" ? "success" : "failure",
    title,
    summary: slackQuote(
      slackSummary([
        `${icon} *${label}*`,
        `${SLACK.senderId} *${input.value}*`,
        `${SLACK.country} ${input.countryCode}`,
      ]),
    ),
    fields: [
      slackField("Carrier", label, icon),
      slackField("Sender ID", slackCode(input.value), SLACK.senderId),
      slackField("Member", input.memberName, SLACK.member),
      ...(input.memberPhone ? [slackField("Phone", input.memberPhone, SLACK.phone)] : []),
      ...(input.providerStatus
        ? [slackField("Carrier response", input.providerStatus, SLACK.message)]
        : []),
      slackField("Suggested next step", nextStep, SLACK.open),
    ],
    actions: [
      slackAction("Review sender", buildSlackGoUrl("/admin/sender-ids?tab=all"), {
        style: input.decision === "approved" ? "primary" : "danger",
        icon: SLACK.view,
      }),
      slackAction("Pending queue", buildSlackGoUrl("/admin/sender-ids?tab=pending"), {
        icon: SLACK.inbox,
      }),
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
    status: "warning",
    title: "Offline top-up needs review",
    summary: slackQuote(
      slackSummary([
        `${SLACK.amount} *${input.currency} ${input.amount}*`,
        `${SLACK.member} ${input.memberName}`,
      ]),
    ),
    fields: [
      slackField("Amount", `*${input.currency} ${input.amount}*`, SLACK.payment),
      slackField("Member", input.memberName, SLACK.member),
      slackField("Phone", input.memberPhone, SLACK.phone),
      ...(input.reference ? [slackField("Reference", slackCode(input.reference), SLACK.note)] : []),
      ...(input.note ? [slackField("Member note", input.note, SLACK.message)] : []),
      slackField("Action needed", "Credit wallet or deny the request", SLACK.warning),
    ],
    actions: [
      slackAction("Credit wallet", buildSlackActionUrl("payment_credit", input.paymentId), {
        style: "primary",
        icon: SLACK.approve,
      }),
      slackAction("Deny", buildSlackActionUrl("payment_deny", input.paymentId), {
        style: "danger",
        icon: SLACK.deny,
      }),
      slackAction("Payments", buildSlackGoUrl("/admin/payments"), { icon: SLACK.wallet }),
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
    status: "success",
    title: "Payment received",
    summary: slackQuote(
      slackSummary([
        `${SLACK.success} *${input.currency} ${input.amount}* credited`,
        `${SLACK.member} ${input.memberName}`,
      ]),
    ),
    fields: [
      slackField("Amount", `*${input.currency} ${input.amount}*`, SLACK.payment),
      slackField("Member", input.memberName, SLACK.member),
      slackField("Method", input.method.replace(/_/g, " "), SLACK.wallet),
    ],
    actions: [
      slackAction("View payment", buildSlackGoUrl("/admin/payments"), {
        style: "primary",
        icon: SLACK.view,
      }),
      slackAction("Members", buildSlackGoUrl("/admin/members"), { icon: SLACK.member }),
    ],
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
    status: "success",
    title: "New member registered",
    summary: slackQuote(
      slackSummary([`${SLACK.success} Welcome`, `${SLACK.member} *${input.fullName}*`]),
    ),
    fields: [
      slackField("Name", input.fullName, SLACK.member),
      slackField("Phone", input.phone, SLACK.phone),
      ...(input.email ? [slackField("Email", input.email, SLACK.email)] : []),
    ],
    actions: [
      slackAction("View profile", buildSlackGoUrl(`/admin/members/${input.userId}`), {
        style: "primary",
        icon: SLACK.view,
      }),
      slackAction("All members", buildSlackGoUrl("/admin/members"), { icon: SLACK.inbox }),
    ],
  });
}

export function slackUserLoginBlocks(input: {
  fullName: string;
  phone: string;
  userId: string;
}): SlackBlock[] {
  return buildSlackNotification({
    category: "members",
    status: "info",
    title: "Member signed in",
    summary: slackQuote(`${SLACK.member} *${input.fullName}* · ${input.phone}`),
    fields: [
      slackField("Name", input.fullName, SLACK.member),
      slackField("Phone", input.phone, SLACK.phone),
    ],
    actions: [
      slackAction("View profile", buildSlackGoUrl(`/admin/members/${input.userId}`), {
        style: "primary",
        icon: SLACK.view,
      }),
    ],
  });
}

export function slackAuthFailureBlocks(input: { identifier: string }): SlackBlock[] {
  return buildSlackNotification({
    category: "security",
    status: "failure",
    title: "Failed login attempt",
    summary: slackQuote(`${SLACK.security} Unsuccessful sign-in for ${slackCode(input.identifier)}`),
    fields: [
      slackField("Identifier", slackCode(input.identifier), SLACK.security),
      slackField("Suggested action", "Check for brute force or notify member", SLACK.warning),
    ],
    actions: [
      slackAction("Members admin", buildSlackGoUrl("/admin/members"), {
        style: "primary",
        icon: SLACK.view,
      }),
    ],
  });
}

export function slackStuckSmsBlocks(input: {
  delayedCount: number;
  pendingTotal: number;
  oldestAgeMinutes: number;
}): SlackBlock[] {
  return buildSlackNotification({
    category: "operations",
    status: "warning",
    title: "SMS queue delayed",
    summary: slackQuote(
      `${SLACK.queue} *${input.delayedCount}* message${input.delayedCount === 1 ? "" : "s"} waiting over 5 minutes`,
    ),
    metrics: [
      { label: "Delayed", value: String(input.delayedCount), tone: "bad" },
      { label: "In queue", value: String(input.pendingTotal), tone: "neutral" },
      { label: "Oldest wait", value: `~${input.oldestAgeMinutes} min`, tone: "bad" },
    ],
    fields: [
      slackField("Impact", "Members may not receive OTPs, receipts, or campaigns on time", SLACK.warning),
      slackField("Fix", "Open Operations and run *Process pending now*", SLACK.process),
    ],
    actions: [
      slackAction("Operations", buildSlackGoUrl("/admin/operations"), {
        style: "primary",
        icon: SLACK.process,
      }),
      slackAction("Messages", buildSlackGoUrl("/admin/messages?status=PENDING"), {
        icon: SLACK.sms,
      }),
    ],
  });
}

export function slackSmsFailedBlocks(input: {
  messageId: string;
  recipient: string;
  senderId: string;
  memberName: string;
  failureReason?: string | null;
  countryCode?: string | null;
}): SlackBlock[] {
  const previewReason = input.failureReason?.trim() || "Unknown provider error";

  return buildSlackNotification({
    category: "operations",
    status: "failure",
    title: "SMS delivery failed",
    summary: slackQuote(
      slackSummary([
        `${SLACK.failed} To ${slackCode(input.recipient)}`,
        input.countryCode ? `${SLACK.country} ${input.countryCode}` : null,
      ]),
    ),
    fields: [
      slackField("Member", input.memberName, SLACK.member),
      slackField("Recipient", slackCode(input.recipient), SLACK.phone),
      slackField("Sender ID", input.senderId, SLACK.senderId),
      ...(input.countryCode ? [slackField("Route", input.countryCode, SLACK.country)] : []),
      slackField("Reason", previewReason.slice(0, 500), SLACK.message),
    ],
    actions: [
      slackAction("View message", buildSlackGoUrl(`/admin/messages?highlight=${input.messageId}`), {
        style: "primary",
        icon: SLACK.view,
      }),
      slackAction("Operations", buildSlackGoUrl("/admin/operations"), { icon: SLACK.admin }),
    ],
  });
}

export function slackSmsBatchResultBlocks(input: {
  processed: number;
  sent: number;
  failed: number;
  remaining: number;
  source: "cron" | "admin";
  failedSamples?: Array<{
    recipient: string;
    memberName: string;
    reason?: string | null;
  }>;
}): SlackBlock[] {
  const allOk = input.failed === 0 && input.processed > 0;
  const sourceLabel = input.source === "admin" ? "Manual run" : "Scheduled cron";

  const fields =
    input.failedSamples && input.failedSamples.length > 0
      ? input.failedSamples.slice(0, 3).flatMap((sample, index) => [
          slackField(
            `Failure ${index + 1}`,
            `${sample.memberName} → ${slackCode(sample.recipient)}`,
            SLACK.failed,
          ),
          ...(sample.reason ? [slackField("Reason", sample.reason.slice(0, 200), SLACK.message)] : []),
        ])
      : [
          slackField("Source", sourceLabel, SLACK.admin),
          slackField(
            "Summary",
            allOk
              ? "All pending messages in this batch were sent"
              : input.failed > 0
                ? "Some messages failed — review failures below"
                : "Batch completed",
            allOk ? SLACK.success : SLACK.queue,
          ),
        ];

  return buildSlackNotification({
    category: "operations",
    status: allOk ? "success" : input.failed > 0 ? "failure" : "info",
    title: allOk ? "Pending SMS processed" : "SMS batch finished",
    summary: slackQuote(
      slackSummary([
        `${SLACK.sms} *${input.processed}* processed`,
        `${SLACK.approve} ${input.sent} sent`,
        input.failed > 0 ? `${SLACK.deny} ${input.failed} failed` : null,
      ]),
    ),
    metrics: [
      { label: "Sent", value: String(input.sent), tone: input.sent > 0 ? "good" : "neutral" },
      { label: "Failed", value: String(input.failed), tone: input.failed > 0 ? "bad" : "good" },
      { label: "Remaining", value: String(input.remaining), tone: input.remaining > 0 ? "neutral" : "good" },
      { label: "Processed", value: String(input.processed), tone: "neutral" },
    ],
    fields,
    actions: [
      slackAction("Operations", buildSlackGoUrl("/admin/operations"), {
        style: input.failed > 0 ? "primary" : undefined,
        icon: SLACK.admin,
      }),
      ...(input.failed > 0
        ? [
            slackAction("View failures", buildSlackGoUrl("/admin/messages?status=FAILED"), {
              style: "danger",
              icon: SLACK.view,
            }),
          ]
        : []),
    ],
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
    status: "warning",
    title: input.reference ? `Ticket ${input.reference}` : "New support ticket",
    summary: slackQuote(
      slackSummary([
        `${SLACK.ticket} *${input.subject}*`,
        `${SLACK.member} ${input.memberName}`,
      ]),
    ),
    fields: [
      ...(input.reference ? [slackField("Ticket", input.reference, SLACK.ticket)] : []),
      slackField("Status", input.status.replace(/_/g, " "), SLACK.queue),
      slackField("Member", input.memberName, SLACK.member),
      ...(input.memberPhone ? [slackField("Phone", input.memberPhone, SLACK.phone)] : []),
      ...(input.memberEmail ? [slackField("Email", input.memberEmail, SLACK.email)] : []),
      slackField("Message", preview, SLACK.message),
    ],
    actions: [
      slackAction("In progress", buildSlackActionUrl("ticket_in_progress", input.ticketId), {
        style: "primary",
        icon: SLACK.process,
      }),
      slackAction("Resolved", buildSlackActionUrl("ticket_resolved", input.ticketId), {
        icon: SLACK.approve,
      }),
      slackAction("Close", buildSlackActionUrl("ticket_closed", input.ticketId), {
        style: "danger",
        icon: SLACK.deny,
      }),
      slackAction("Inbox", buildSlackGoUrl("/admin/support"), { icon: SLACK.inbox }),
    ],
    ...(input.threaded
      ? {}
      : {
          dashboardPath: buildSlackGoUrl("/admin/support"),
          dashboardLabel: ":inbox_tray: Open support inbox",
        }),
  });
}

export function slackLowBalanceBlocks(input: {
  title: string;
  summary: string;
  provider: string;
  display: string;
  threshold: number;
  queuedMessages?: number;
  action: string;
}): SlackBlock[] {
  const isCoverage = input.provider === "SplitSMS";

  return buildSlackNotification({
    category: "operations",
    status: "warning",
    title: input.title,
    summary: slackQuote(`${SLACK.warning} ${input.summary}`),
    metrics: [
      {
        label: isCoverage ? "Queued" : "Balance",
        value: isCoverage && input.queuedMessages != null ? String(input.queuedMessages) : input.display,
        tone: "bad",
      },
      {
        label: isCoverage ? "Credits left" : "Threshold",
        value: isCoverage ? input.display.split("/")[1]?.trim() ?? input.display : `< ${input.threshold}`,
        tone: "bad",
      },
    ],
    fields: [
      slackField("Provider", input.provider, providerIcon(isCoverage ? "MNOTIFY" : input.provider.toUpperCase())),
      slackField("Current", input.display, SLACK.wallet),
      slackField("Action needed", input.action, SLACK.open),
    ],
    actions: [
      slackAction("Provider balances", buildSlackGoUrl("/admin/providers"), {
        style: "primary",
        icon: SLACK.wallet,
      }),
      slackAction("Operations", buildSlackGoUrl("/admin/operations"), { icon: SLACK.admin }),
    ],
  });
}
