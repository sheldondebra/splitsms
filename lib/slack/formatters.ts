import type { SlackNotifyAction, SlackNotifyField } from "@/lib/slack/message-layout";

/** Shared Slack emoji icons for consistent alert styling. */
export const SLACK = {
  brand: ":large_blue_circle:",
  approve: ":white_check_mark:",
  deny: ":x:",
  ban: ":no_entry_sign:",
  open: ":arrow_right:",
  inbox: ":inbox_tray:",
  member: ":bust_in_silhouette:",
  phone: ":iphone:",
  email: ":e-mail:",
  senderId: ":identification_card:",
  country: ":earth_africa:",
  carrier: ":satellite:",
  registrar: ":office:",
  payment: ":moneybag:",
  wallet: ":credit_card:",
  ticket: ":ticket:",
  message: ":speech_balloon:",
  clock: ":clock3:",
  lock: ":lock:",
  admin: ":gear:",
  warning: ":warning:",
  success: ":tada:",
  failed: ":rotating_light:",
  sms: ":envelope:",
  queue: ":hourglass_flowing_sand:",
  refresh: ":arrows_counterclockwise:",
  resubmit: ":repeat:",
  process: ":zap:",
  view: ":mag:",
  support: ":lifebuoy:",
  security: ":shield:",
  note: ":memo:",
  amount: ":money_with_wings:",
} as const;

export function providerIcon(provider: string): string {
  if (provider === "MNOTIFY") return ":flag-gh:";
  if (provider === "TWILIO") return ":phone:";
  if (provider === "INFOBIP") return ":globe_with_meridians:";
  return SLACK.carrier;
}

export function providerLabel(provider: string): string {
  if (provider === "MNOTIFY") return "mNotify";
  if (provider === "TWILIO") return "Twilio";
  if (provider === "INFOBIP") return "Infobip";
  return provider;
}

export function slackField(label: string, value: string, icon?: string): SlackNotifyField {
  return { label: icon ? `${icon} ${label}` : label, value };
}

export function slackAction(
  label: string,
  url: string,
  opts?: { style?: "primary" | "danger"; icon?: string },
): SlackNotifyAction {
  return {
    label: opts?.icon ? `${opts.icon} ${label}` : label,
    url,
    style: opts?.style,
  };
}

export function slackSummary(parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" · ");
}

export function slackQuote(text: string): string {
  return `> ${text}`;
}

export function slackCode(value: string): string {
  return `\`${value}\``;
}
