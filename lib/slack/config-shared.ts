export const SLACK_OFFICE_CONFIG_KEY = "slack_office_config";

export type SlackOfficeConfig = {
  enabled: boolean;
  /** Slack Incoming Webhook URL (https://hooks.slack.com/services/…) */
  webhookUrl: string;
  /** Support inbox threads — requires bot token + Events API */
  supportThreadsEnabled: boolean;
  supportBotToken: string;
  supportChannelId: string;
  supportSigningSecret: string;
  notifyUserRegistration: boolean;
  notifyUserLogin: boolean;
  notifySenderIdRequests: boolean;
  notifyOfflinePayments: boolean;
  notifyOnlinePayments: boolean;
  notifySupportTickets: boolean;
  notifyAuthFailures: boolean;
  notifyStuckSms: boolean;
  notifySmsFailures: boolean;
  notifySmsBatchResults: boolean;
  updatedAt?: string;
};

export function defaultSlackOfficeConfig(): SlackOfficeConfig {
  return {
    enabled: false,
    webhookUrl: "",
    supportThreadsEnabled: false,
    supportBotToken: "",
    supportChannelId: "",
    supportSigningSecret: "",
    notifyUserRegistration: true,
    notifyUserLogin: false,
    notifySenderIdRequests: true,
    notifyOfflinePayments: true,
    notifyOnlinePayments: true,
    notifySupportTickets: true,
    notifyAuthFailures: true,
    notifyStuckSms: true,
    notifySmsFailures: true,
    notifySmsBatchResults: true,
  };
}

export function isSlackConfigured(config: SlackOfficeConfig) {
  return Boolean(config.enabled && config.webhookUrl.startsWith("https://hooks.slack.com/"));
}

export function isSlackSupportThreadsConfigured(config: SlackOfficeConfig) {
  return Boolean(
    config.enabled &&
      config.supportThreadsEnabled &&
      config.supportBotToken.startsWith("xoxb-") &&
      config.supportChannelId.startsWith("C") &&
      config.supportSigningSecret.length >= 8,
  );
}

export function maskSlackSecret(value: string) {
  if (!value) return "";
  if (value.length <= 12) return "••••••••";
  return `${value.slice(0, 28)}…${value.slice(-6)}`;
}

export function slackEventsUrlHint() {
  return "/api/slack/events";
}
