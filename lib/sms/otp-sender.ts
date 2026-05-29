import { parsePhoneNumber } from "libphonenumber-js";
import { prisma } from "@/lib/db";
import { sendMnotifyOtp, isMnotifyConfigured } from "@/lib/mnotify";
import { detectCountryCode } from "@/lib/contacts/country-from-phone";
import { getProviderOrderForCountry } from "@/lib/sms/country-provider";
import {
  isInfobipConfigured,
  isTwilioConfigured,
  loadInfobipSettings,
  loadTwilioSettings,
} from "@/lib/sms/provider-credentials";
import { sendViaInfobip } from "@/lib/sms/providers/infobip";
import { sendViaTwilio } from "@/lib/sms/providers/twilio";
import type { SmsProviderType } from "@/lib/generated/prisma/client";

type SendAttempt = { ok: boolean; error?: string };

/** Prefer dial-plan country from the number, then account country. */
export function resolveOtpCountryCode(phone: string, countryCode: string): string {
  const detected = detectCountryCode(phone);
  const cc = (detected || countryCode || "GH").trim().toUpperCase();
  return cc.length === 2 ? cc : "GH";
}

function formatPhoneE164(phone: string): string {
  try {
    const parsed = parsePhoneNumber(phone);
    if (parsed?.isValid()) return parsed.format("E.164");
  } catch {
    /* fall through */
  }
  const digits = phone.replace(/\s+/g, "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0") && digits.length >= 10) return `+233${digits.slice(1)}`;
  return digits.startsWith("+") ? digits : `+${digits}`;
}

/** Provider order: member override → admin country routes → static defaults */
export async function getOtpProviderOrder(
  countryCode: string,
  userId?: string,
): Promise<SmsProviderType[]> {
  if (userId) {
    const account = await prisma.memberAccount.findUnique({
      where: { userId },
      select: { assignedProvider: true },
    });
    if (account?.assignedProvider) {
      const base = await getProviderOrderForCountry(countryCode);
      const primary = account.assignedProvider;
      return [primary, ...base.filter((p) => p !== primary)];
    }
  }
  return getProviderOrderForCountry(countryCode);
}

async function sendViaProvider(
  type: SmsProviderType,
  phone: string,
  message: string,
): Promise<SendAttempt> {
  const e164 = formatPhoneE164(phone);

  if (type === "MNOTIFY") {
    if (!(await isMnotifyConfigured())) {
      return { ok: false, error: "mNotify not configured or disabled" };
    }
    const result = await sendMnotifyOtp(phone, "", message);
    if (result.ok) return { ok: true };
    return { ok: false, error: result.error ?? "mNotify send failed" };
  }

  if (type === "TWILIO") {
    const cfg = await loadTwilioSettings();
    if (!isTwilioConfigured(cfg)) {
      return { ok: false, error: "Twilio not configured or disabled" };
    }
    const from = cfg.fromNumber || "SplitSMS";
    const result = await sendViaTwilio({
      to: e164,
      from,
      body: message,
    });
    if (result.success) return { ok: true };
    return { ok: false, error: result.error ?? "Twilio send failed" };
  }

  if (type === "INFOBIP") {
    const cfg = await loadInfobipSettings();
    if (!isInfobipConfigured(cfg)) {
      return { ok: false, error: "Infobip not configured or disabled" };
    }
    const result = await sendViaInfobip({
      to: e164.replace(/^\+/, ""),
      from: cfg.senderId,
      body: message,
    });
    if (result.success) return { ok: true };
    return { ok: false, error: result.error ?? "Infobip send failed" };
  }

  return { ok: false, error: `Unknown provider ${type}` };
}

/** Send OTP using country routes and admin-configured provider credentials. */
export async function sendOtpSms(
  phone: string,
  code: string,
  countryCode: string,
  body?: string,
  userId?: string,
) {
  const message =
    body ?? `Your SplitSMS verification code is ${code}. Valid for 10 minutes.`;

  const routeCountry = resolveOtpCountryCode(phone, countryCode);
  const order = await getOtpProviderOrder(routeCountry, userId);
  const failures: string[] = [];

  for (const provider of order) {
    const attempt = await sendViaProvider(provider, phone, message);
    if (attempt.ok) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[OTP] Sent via ${provider} to ${phone} (${routeCountry})`);
      }
      return;
    }
    failures.push(`${provider}: ${attempt.error ?? "failed"}`);
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[DEV OTP] ${phone} (${routeCountry}): ${code}`);
    console.warn(`[DEV OTP] All providers failed:`, failures.join("; "));
    return;
  }

  throw new Error(
    `No OTP SMS provider available for ${routeCountry}. Tried: ${failures.join("; ")}`,
  );
}
