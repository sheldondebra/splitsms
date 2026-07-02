import crypto from "crypto";
import { loadSlackOfficeConfig, type SlackOfficeConfig } from "@/lib/slack/config";

export type SlackBotPostResult =
  | { ok: true; ts: string; channel: string }
  | { ok: false; error: string };

type SlackApiResponse = {
  ok: boolean;
  error?: string;
  ts?: string;
  channel?: string;
  user?: { profile?: { email?: string } };
};

export async function slackBotApi<T extends SlackApiResponse>(
  method: string,
  body: Record<string, unknown>,
  token: string,
): Promise<T> {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as T;
  if (!data.ok) {
    throw new Error(data.error ?? `slack_${method}_failed`);
  }
  return data;
}

export function verifySlackRequestSignature(
  signingSecret: string,
  signature: string | null,
  timestamp: string | null,
  rawBody: string,
): boolean {
  if (!signature?.startsWith("v0=") || !timestamp) return false;

  const ageSec = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSec) || ageSec > 60 * 5) return false;

  const base = `v0:${timestamp}:${rawBody}`;
  const digest = crypto.createHmac("sha256", signingSecret).update(base).digest("hex");
  const expected = `v0=${digest}`;

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function postSlackBotMessage(
  input: {
    channel: string;
    text: string;
    blocks?: Record<string, unknown>[];
    threadTs?: string;
  },
  config?: SlackOfficeConfig,
): Promise<SlackBotPostResult> {
  const cfg = config ?? (await loadSlackOfficeConfig());
  if (!cfg.supportBotToken?.startsWith("xoxb-")) {
    return { ok: false, error: "support_bot_not_configured" };
  }

  try {
    const data = await slackBotApi<SlackApiResponse>(
      "chat.postMessage",
      {
        channel: input.channel,
        text: input.text,
        unfurl_links: false,
        unfurl_media: false,
        ...(input.blocks?.length ? { blocks: input.blocks } : {}),
        ...(input.threadTs ? { thread_ts: input.threadTs } : {}),
      },
      cfg.supportBotToken,
    );

    if (!data.ts || !data.channel) {
      return { ok: false, error: "missing_ts" };
    }

    return { ok: true, ts: data.ts, channel: data.channel };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "slack_post_failed" };
  }
}

export async function resolveAdminIdFromSlackUser(slackUserId: string, botToken: string) {
  const { prisma } = await import("@/lib/db");

  try {
    const data = await slackBotApi<{ ok: boolean; user?: { profile?: { email?: string } } }>(
      "users.info",
      { user: slackUserId },
      botToken,
    );
    const email = data.user?.profile?.email?.trim().toLowerCase();
    if (email) {
      const admin = await prisma.user.findFirst({
        where: {
          email,
          role: { in: ["ADMIN", "SUPER_ADMIN"] },
        },
        select: { id: true },
      });
      if (admin) return admin.id;
    }
  } catch {
    // fall through
  }

  const fallback = await prisma.user.findFirst({
    where: { role: { in: ["SUPER_ADMIN", "ADMIN"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return fallback?.id ?? null;
}
