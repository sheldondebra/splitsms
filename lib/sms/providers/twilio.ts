import { loadTwilioSettings } from "@/lib/sms/provider-credentials";
import type { SendParams, SendResult, SmsProviderAdapter } from "./types";

function isAlphanumericSender(from: string) {
  return Boolean(from) && !from.startsWith("+") && !/^\d+$/.test(from);
}

export async function sendViaTwilio(params: SendParams): Promise<SendResult> {
  const cfg = await loadTwilioSettings();
  const sid = cfg.accountSid;
  const token = cfg.authToken;
  const from = params.from || cfg.fromNumber;
  if (!cfg.enabled || !sid || !token) {
    return { success: false, error: "Twilio not configured" };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const body = new URLSearchParams({
    To: params.to,
    Body: params.body,
  });

  if (
    cfg.messagingServiceSid &&
    params.from &&
    isAlphanumericSender(params.from)
  ) {
    body.set("MessagingServiceSid", cfg.messagingServiceSid);
  } else if (from) {
    body.set("From", from);
  } else {
    return { success: false, error: "Twilio from number or sender not configured" };
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  const data = (await res.json()) as { sid?: string; message?: string };
  if (!res.ok) return { success: false, error: data?.message ?? "Twilio send failed" };
  return { success: true, providerRef: data.sid };
}

export const twilioAdapter: SmsProviderAdapter = {
  type: "TWILIO",
  send: sendViaTwilio,
};
