import type { SendParams, SendResult, SmsProviderAdapter } from "./types";

export async function sendViaTwilio(params: SendParams): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = params.from || process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !from)
    return { success: false, error: "Twilio not configured" };

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const body = new URLSearchParams({
    To: params.to,
    From: from,
    Body: params.body,
  });

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
