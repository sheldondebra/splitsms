import { loadSlackOfficeConfig, type SlackOfficeConfig } from "@/lib/slack/config";
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
    category: "action_required",
    title: "SplitSMS Slack alerts are live",
    summary: "Your team can approve sender IDs, credit wallets, and open the admin dashboard from Slack.",
    fields: [
      { label: "Delivery", value: "Incoming Webhook" },
      { label: "Actions", value: "Signed admin links · sign in once" },
    ],
    actions: [
      {
        label: "Open admin",
        url: buildSlackGoUrl("/admin"),
        style: "primary",
      },
    ],
  });

  return postSlackMessage(
    {
      text: "SplitSMS Slack alerts connected.",
      blocks,
    },
    config,
  );
}
