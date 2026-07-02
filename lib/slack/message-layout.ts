import type { SlackBlock } from "@/lib/slack/client";

export type SlackNotifyCategory =
  | "action_required"
  | "members"
  | "payments"
  | "sender_ids"
  | "support"
  | "security";

const CATEGORY_META: Record<
  SlackNotifyCategory,
  { emoji: string; label: string; accent: string }
> = {
  action_required: { emoji: ":rotating_light:", label: "Action required", accent: "Approve in one click" },
  members: { emoji: ":bust_in_silhouette:", label: "Members", accent: "New activity" },
  payments: { emoji: ":credit_card:", label: "Payments", accent: "Wallet activity" },
  sender_ids: { emoji: ":identification_card:", label: "Sender IDs", accent: "Registration queue" },
  support: { emoji: ":lifebuoy:", label: "Support", accent: "Inbox" },
  security: { emoji: ":shield:", label: "Security", accent: "Auth alert" },
};

export type SlackNotifyField = { label: string; value: string };

export type SlackNotifyAction = {
  label: string;
  url: string;
  style?: "primary" | "danger";
};

export type SlackNotificationInput = {
  category: SlackNotifyCategory;
  title: string;
  summary?: string;
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
      text: { type: "plain_text", text: a.label, emoji: true },
      url: a.url,
      ...(a.style ? { style: a.style } : {}),
    })),
  };
}

/** Consistent SplitSMS alert layout for Slack incoming webhooks. */
export function buildSlackNotification(input: SlackNotificationInput): SlackBlock[] {
  const meta = CATEGORY_META[input.category];
  const blocks: SlackBlock[] = [
    slackContext(`*SplitSMS* · ${meta.emoji} ${meta.label} · ${meta.accent}`),
    {
      type: "header",
      text: { type: "plain_text", text: input.title, emoji: true },
    },
  ];

  if (input.summary) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: input.summary },
    });
  }

  if (input.fields?.length) {
    blocks.push(slackFieldsSection(input.fields));
  }

  if (input.actions?.length) {
    blocks.push(slackDivider());
    blocks.push(slackActionButtons(input.actions));
    blocks.push(
      slackContext(
        ":lock: Secure admin links · Sign in once, then the action runs automatically",
      ),
    );
  } else if (input.dashboardPath) {
    blocks.push(slackDivider());
    blocks.push(
      slackContext(
        `:point_right: <${input.dashboardPath}|${input.dashboardLabel ?? "Open in admin dashboard"}>`,
      ),
    );
  }

  return blocks;
}
