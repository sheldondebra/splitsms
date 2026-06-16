import { consumeRateLimitSlot, rateLimitKey } from "@/lib/auth/rate-limit";
import { getRequestIp } from "@/lib/auth/request-ip";
import {
  HONEYPOT_FIELD,
  isHoneypotTripped,
  turnstileSiteKey,
} from "@/lib/auth/signup-guard-shared";

export { HONEYPOT_FIELD } from "@/lib/auth/signup-guard-shared";

function isTurnstileEnabled(): boolean {
  return Boolean(turnstileSiteKey() && process.env.TURNSTILE_SECRET_KEY?.trim());
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (ip && ip !== "unknown") body.set("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return Boolean(data.success);
}

type GuardInput = {
  honeypot?: FormDataEntryValue | null;
  turnstileToken?: FormDataEntryValue | null;
};

async function runBotChecks(input: GuardInput): Promise<{ ok: true } | { ok: false }> {
  if (isHoneypotTripped(input.honeypot)) {
    return { ok: false };
  }

  if (isTurnstileEnabled()) {
    const token = String(input.turnstileToken ?? "").trim();
    if (!token) return { ok: false };
    const ip = await getRequestIp();
    const valid = await verifyTurnstile(token, ip);
    if (!valid) return { ok: false };
  }

  return { ok: true };
}

/** Limit new signups per IP to slow bot farms. */
export async function assertSignupAllowed(
  input: GuardInput,
): Promise<{ ok: true } | { ok: false; error: "rate_limit" }> {
  const bot = await runBotChecks(input);
  if (!bot.ok) return { ok: false, error: "rate_limit" };

  const ip = await getRequestIp();
  const limit = await consumeRateLimitSlot(rateLimitKey("signup_ip", ip), {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    lockoutMs: 2 * 60 * 60 * 1000,
  });
  if (!limit.allowed) return { ok: false, error: "rate_limit" };

  return { ok: true };
}

/** Limit OTP sends per IP (signup + login) to reduce SMS abuse. */
export async function assertOtpRequestAllowed(
  input: GuardInput,
): Promise<{ ok: true } | { ok: false; error: "rate_limit" }> {
  const bot = await runBotChecks(input);
  if (!bot.ok) return { ok: false, error: "rate_limit" };

  const ip = await getRequestIp();
  const limit = await consumeRateLimitSlot(rateLimitKey("otp_ip", ip), {
    maxAttempts: 6,
    windowMs: 15 * 60 * 1000,
    lockoutMs: 30 * 60 * 1000,
  });
  if (!limit.allowed) return { ok: false, error: "rate_limit" };

  return { ok: true };
}

export function readSignupGuardFields(formData: FormData) {
  return {
    honeypot: formData.get(HONEYPOT_FIELD),
    turnstileToken: formData.get("cf-turnstile-response"),
  };
}
