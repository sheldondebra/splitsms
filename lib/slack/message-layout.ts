import type { SlackBlock } from "@/lib/slack/client";
import { SLACK } from "@/lib/slack/formatters";

export type SlackNotifyCategory =
  | "action_required"
  | "members"
  | "operations"
  | "payments"
  | "sender_ids"
  | "support"
  | "security";

export type SlackNotifyStatus = "success" | "failure" | "warning" | "info";

const CATEGORY_META: Record<
  SlackNotifyCategory,
  { emoji: string; label: string; accent: string }
> = {
  action_required: { emoji: ":rotating_light:", label: "Action required", accent: "Needs your review" },
  members: { emoji: ":bust_in_silhouette:", label: "Members", accent: "Account activity" },
  operations: { emoji: ":satellite:", label: "SMS delivery", accent: "Queue & sending" },
  payments: { emoji: ":credit_card:", label: "Payments", accent: "Wallet activity" },
  sender_ids: { emoji: ":identification_card:", label: "Sender IDs", accent: "Registration queue" },
  support: { emoji: ":lifebuoy:", label: "Support", accent: "Customer inbox" },
  security: { emoji: ":shield:", label: "Security", accent: "Auth alert" },
};

const STATUS_META: Record<SlackNotifyStatus, { emoji: string; label: string }> = {
  success: { emoji: ":white_check_mark:", label: "Success" },
  failure: { emoji: ":x:", label: "Failed" },
  warning: { emoji: ":warning:", label: "Attention" },
  info: { emoji: ":information_source:", label: "Update" },
};

export type SlackNotifyField = { label: string; value: string };

export type SlackNotifyMetric = {
  label: string;
  value: string;
  tone?: "good" | "bad" | "neutral";
};

export type SlackNotifyAction = {
  label: string;
  url: string;
  style?: "primary" | "danger";
};

export type SlackNotificationInput = {
  category: SlackNotifyCategory;
  title: string;
  /** Optional outcome badge shown next to the category line */
  status?: SlackNotifyStatus;
  summary?: string;
  /** Compact stat row (e.g. sent / failed counts) */
  metrics?: SlackNotifyMetric[];
  fields?: SlackNotifyField[];
  actions?: SlackNotifyAction[];
  /** Admin page path — rendered as secondary “Open dashboard” link when no actions */
  dashboardPath?: string;
  dashboardLabel?: string;
};

function slackContext(text: string): SlackBlock {
  return {
    type: "context",
    elements: [{ type: "mrkdwn", text }],
  };
}

function slackDivider(): SlackBlock {
  return { type: "divider" };
}

function metricTone(tone?: SlackNotifyMetric["tone"]) {
  if (tone === "good") return ":large_green_circle:";
  if (tone === "bad") return ":red_circle:";
  return ":white_circle:";
}

function slackMetricsSection(metrics: SlackNotifyMetric[]): SlackBlock {
  return {
    type: "section",
    fields: metrics.slice(0, 8).map((m) => ({
      type: "mrkdwn",
      text: `${metricTone(m.tone)} *${m.label}*\n${m.value}`,
    })),
  };
}

function slackFieldsSection(fields: SlackNotifyField[]): SlackBlock {
  return {
    type: "section",
    fields: fields.slice(0, 10).map((f) => ({
      type: "mrkdwn",
      text: `*${f.label}*\n${f.value}`,
    })),
  };
}

function slackActionButtons(actions: SlackNotifyAction[]): SlackBlock {
  return {
    type: "actions",
    elements: actions.slice(0, 4).map((a) => ({
      type: "button",
      text: { type: "plain_text", text: a.label.slice(0, 75), emoji: true },
      url: a.url,
      ...(a.style ? { style: a.style } : {}),
    })),
  };
}

function formatSlackTimestamp() {
  return new Date().toLocaleString("en-GB", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function titleWithStatus(title: string, status?: SlackNotifyStatus) {
  if (!status) return title;
  return `${STATUS_META[status].emoji} ${title}`;
}

/** Consistent SplitSMS alert layout for Slack incoming webhooks. */
export function buildSlackNotification(input: SlackNotificationInput): SlackBlock[] {
  const meta = CATEGORY_META[input.category];
  const statusLine = input.status
    ? ` · ${STATUS_META[input.status].emoji} *${STATUS_META[input.status].label}*`
    : "";

  const blocks: SlackBlock[] = [
    slackContext(
      `${SLACK.brand} *SplitSMS Admin* · ${meta.emoji} ${meta.label}${statusLine}`,
    ),
    {
      type: "header",
      text: {
        type: "plain_text",
        text: titleWithStatus(input.title, input.status).slice(0, 150),
        emoji: true,
      },
    },
  ];

  if (input.summary) {
    blocks.push(slackDivider());
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: input.summary },
    });
  }

  if (input.metrics?.length) {
    blocks.push(slackMetricsSection(input.metrics));
  }

  if (input.fields?.length) {
    if (!input.metrics?.length) blocks.push(slackDivider());
    blocks.push(slackFieldsSection(input.fields));
  }

  const hasActions = Boolean(input.actions?.length);
  const hasDashboard = Boolean(input.dashboardPath);

  if (hasActions || hasDashboard) {
    blocks.push(slackDivider());
  }

  if (hasActions) {
    blocks.push(slackActionButtons(input.actions!));
    blocks.push(
      slackContext(
        `${SLACK.lock} *One-tap admin actions* · Sign in once, then the button runs securely`,
      ),
    );
  }

  if (hasDashboard) {
    blocks.push(
      slackContext(
        `${SLACK.open} <${input.dashboardPath}|${input.dashboardLabel ?? "Open in admin dashboard"}>`,
      ),
    );
  }

  blocks.push(
    slackContext(
      `${SLACK.clock} ${formatSlackTimestamp()} UTC · _${meta.accent}_`,
    ),
  );

  return blocks;
}
