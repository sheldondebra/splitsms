import { sendMnotifyOtp, isMnotifyConfigured } from "@/lib/mnotify";
import { sendViaTwilio } from "@/lib/sms/providers/twilio";
import { getProviderOrderForCountry } from "@/lib/sms/country-provider";
import type { SmsProviderType } from "@/lib/generated/prisma/client";

async function sendViaProvider(
  type: SmsProviderType,
  phone: string,
  code: string,
  message: string,
): Promise<boolean> {
  if (type === "MNOTIFY") {
    if (!(await isMnotifyConfigured())) return false;
    try {
      const result = await sendMnotifyOtp(phone, code, message);
      return result.ok;
    } catch {
      return false;
    }
  }

  if (type === "TWILIO") {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      return false;
    }
    try {
      const from = process.env.TWILIO_FROM_NUMBER ?? "SplitSMS";
      await sendViaTwilio({
        to: phone,
        from,
        body: message.includes(code) ? message : `${message} ${code}`,
      });
      return true;
    } catch {
      return false;
    }
  }

  if (type === "INFOBIP") {
    if (!process.env.INFOBIP_API_KEY) return false;
    try {
      const { infobipAdapter } = await import("@/lib/sms/providers/infobip");
      const result = await infobipAdapter.send({
        to: phone,
        from: process.env.INFOBIP_SENDER_ID ?? "SplitSMS",
        body: message.includes(code) ? message : `${message} ${code}`,
      });
      return result.success;
    } catch {
      return false;
    }
  }

  return false;
}

/** Send OTP using the country's configured SMS route (e.g. GH → mNotify, US → Twilio) */
export async function sendOtpSms(
  phone: string,
  code: string,
  countryCode: string,
  body?: string,
) {
  const message =
    body ?? `Your SplitSMS verification code is ${code}. Valid for 10 minutes.`;

  const order = await getProviderOrderForCountry(countryCode);

  for (const provider of order) {
    const sent = await sendViaProvider(provider, phone, code, message);
    if (sent) return;
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV OTP] ${phone} (${countryCode}): ${code}`);
    return;
  }

  throw new Error(
    `No OTP SMS provider available for ${countryCode}. Configure mNotify, Twilio, or Infobip.`,
  );
}
