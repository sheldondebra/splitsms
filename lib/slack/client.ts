import { loadSlackOfficeConfig, type SlackOfficeConfig } from "@/lib/slack/config";
import { SLACK, slackAction } from "@/lib/slack/formatters";
import { buildSlackNotification } from "@/lib/slack/message-layout";
import { buildSlackGoUrl } from "@/lib/slack/quick-actions";

export type SlackBlock = Record<string, unknown>;

export type SlackPostMessageInput = {
  text: string;
  blocks?: SlackBlock[];
};

export type SlackPostMessageResult = { ok: true } | { ok: false; error: string };

export async function postSlackMessage(
  input: SlackPostMessageInput,
  config?: SlackOfficeConfig,
): Promise<SlackPostMessageResult> {
  const cfg = config ?? (await loadSlackOfficeConfig());
  if (!cfg.enabled || !cfg.webhookUrl.startsWith("https://hooks.slack.com/")) {
    return { ok: false, error: "slack_not_configured" };
  }

  try {
    const res = await fetch(cfg.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: input.text,
        unfurl_links: false,
        unfurl_media: false,
        ...(input.blocks?.length ? { blocks: input.blocks } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: body || `slack_webhook_${res.status}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "slack_network_error" };
  }
}

export async function testSlackConnection(config?: SlackOfficeConfig) {
  const blocks = buildSlackNotification({
    category: "operations",
    status: "success",
    title: "Slack connection verified",
    summary: `> ${SLACK.success} SplitSMS can post alerts to this channel with one-tap admin actions.`,
    metrics: [
      { label: "Delivery", value: "Incoming Webhook", tone: "good" },
      { label: "Actions", value: "Signed admin links", tone: "neutral" },
    ],
    actions: [
      slackAction("Open admin", buildSlackGoUrl("/admin"), { style: "primary", icon: SLACK.admin }),
      slackAction("Operations", buildSlackGoUrl("/admin/operations"), { icon: SLACK.process }),
      slackAction("Sender IDs", buildSlackGoUrl("/admin/sender-ids"), { icon: SLACK.senderId }),
    ],
  });

  return postSlackMessage(
    {
      text: "SplitSMS Slack alerts connected successfully.",
      blocks,
    },
    config,
  );
}
