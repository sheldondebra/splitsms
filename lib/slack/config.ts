import { prisma } from "@/lib/db";
import {
  defaultSlackOfficeConfig,
  SLACK_OFFICE_CONFIG_KEY,
  type SlackOfficeConfig,
} from "@/lib/slack/config-shared";

function slackEnvDefaults(): Partial<SlackOfficeConfig> {
  return {
    enabled: process.env.SLACK_ENABLED === "true",
    webhookUrl: process.env.SLACK_WEBHOOK_URL?.trim() ?? "",
    supportThreadsEnabled: process.env.SLACK_SUPPORT_THREADS === "true",
    supportBotToken: process.env.SLACK_SUPPORT_BOT_TOKEN?.trim() ?? "",
    supportChannelId: process.env.SLACK_SUPPORT_CHANNEL_ID?.trim() ?? "",
    supportSigningSecret: process.env.SLACK_SUPPORT_SIGNING_SECRET?.trim() ?? "",
    notifyUserRegistration: process.env.SLACK_NOTIFY_REGISTRATION !== "false",
    notifyUserLogin: process.env.SLACK_NOTIFY_LOGIN === "true",
    notifySenderIdRequests: process.env.SLACK_NOTIFY_SENDER_IDS !== "false",
    notifyOfflinePayments: process.env.SLACK_NOTIFY_OFFLINE_PAYMENTS !== "false",
    notifyOnlinePayments: process.env.SLACK_NOTIFY_ONLINE_PAYMENTS !== "false",
    notifySupportTickets: process.env.SLACK_NOTIFY_SUPPORT !== "false",
    notifyAuthFailures: process.env.SLACK_NOTIFY_AUTH_FAILURES !== "false",
    notifyStuckSms: process.env.SLACK_NOTIFY_STUCK_SMS !== "false",
    notifySmsFailures: process.env.SLACK_NOTIFY_SMS_FAILURES !== "false",
    notifySmsBatchResults: process.env.SLACK_NOTIFY_SMS_BATCH !== "false",
    notifyLowBalances: process.env.SLACK_NOTIFY_LOW_BALANCES !== "false",
  };
}

function mergeSlackOfficeConfig(
  stored: Partial<SlackOfficeConfig> | null | undefined,
): SlackOfficeConfig {
  const base = { ...defaultSlackOfficeConfig(), ...slackEnvDefaults() };
  if (!stored) return base;

  const webhookFromStored =
    typeof stored.webhookUrl === "string" && stored.webhookUrl.trim()
      ? stored.webhookUrl.trim()
      : "";

  return {
    enabled: stored.enabled ?? base.enabled,
    webhookUrl: webhookFromStored || base.webhookUrl,
    supportThreadsEnabled: stored.supportThreadsEnabled ?? base.supportThreadsEnabled,
    supportBotToken:
      typeof stored.supportBotToken === "string" && stored.supportBotToken.trim()
        ? stored.supportBotToken.trim()
        : base.supportBotToken,
    supportChannelId:
      typeof stored.supportChannelId === "string" && stored.supportChannelId.trim()
        ? stored.supportChannelId.trim()
        : base.supportChannelId,
    supportSigningSecret:
      typeof stored.supportSigningSecret === "string" && stored.supportSigningSecret.trim()
        ? stored.supportSigningSecret.trim()
        : base.supportSigningSecret,
    notifyUserRegistration: stored.notifyUserRegistration ?? base.notifyUserRegistration,
    notifyUserLogin: stored.notifyUserLogin ?? base.notifyUserLogin,
    notifySenderIdRequests: stored.notifySenderIdRequests ?? base.notifySenderIdRequests,
    notifyOfflinePayments: stored.notifyOfflinePayments ?? base.notifyOfflinePayments,
    notifyOnlinePayments: stored.notifyOnlinePayments ?? base.notifyOnlinePayments,
    notifySupportTickets: stored.notifySupportTickets ?? base.notifySupportTickets,
    notifyAuthFailures: stored.notifyAuthFailures ?? base.notifyAuthFailures,
    notifyStuckSms: stored.notifyStuckSms ?? base.notifyStuckSms,
    notifySmsFailures: stored.notifySmsFailures ?? base.notifySmsFailures,
    notifySmsBatchResults: stored.notifySmsBatchResults ?? base.notifySmsBatchResults,
    notifyLowBalances: stored.notifyLowBalances ?? base.notifyLowBalances,
    updatedAt: stored.updatedAt,
  };
}

export {
  defaultSlackOfficeConfig,
  isSlackConfigured,
  isSlackSupportThreadsConfigured,
  maskSlackSecret,
  slackEventsUrlHint,
  SLACK_OFFICE_CONFIG_KEY,
  type SlackOfficeConfig,
} from "@/lib/slack/config-shared";

export async function loadSlackOfficeConfig(): Promise<SlackOfficeConfig> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: SLACK_OFFICE_CONFIG_KEY },
  });
  const stored = row?.value as Partial<SlackOfficeConfig> | null;
  return mergeSlackOfficeConfig(stored);
}

export async function saveSlackOfficeConfig(
  input: Partial<SlackOfficeConfig>,
  actorId?: string,
) {
  const current = await loadSlackOfficeConfig();
  const next: SlackOfficeConfig = {
    ...current,
    ...input,
    webhookUrl:
      input.webhookUrl !== undefined ? input.webhookUrl.trim() : current.webhookUrl,
    supportBotToken:
      input.supportBotToken !== undefined
        ? input.supportBotToken.trim()
        : current.supportBotToken,
    supportChannelId:
      input.supportChannelId !== undefined
        ? input.supportChannelId.trim()
        : current.supportChannelId,
    supportSigningSecret:
      input.supportSigningSecret !== undefined
        ? input.supportSigningSecret.trim()
        : current.supportSigningSecret,
    updatedAt: new Date().toISOString(),
  };

  await prisma.platformSetting.upsert({
    where: { key: SLACK_OFFICE_CONFIG_KEY },
    update: { value: next },
    create: { key: SLACK_OFFICE_CONFIG_KEY, value: next },
  });

  if (actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "SLACK_OFFICE_CONFIG_UPDATED",
        entityType: "PlatformSetting",
        entityId: SLACK_OFFICE_CONFIG_KEY,
        metadata: {
          enabled: next.enabled,
          hasWebhook: Boolean(next.webhookUrl),
          supportThreads: next.supportThreadsEnabled,
        },
      },
    });
  }

  return next;
}
