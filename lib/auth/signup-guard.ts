import { headers } from "next/headers";
import { consumeRateLimitSlot, rateLimitKey } from "@/lib/auth/rate-limit";
import { shouldBlockAuthBot } from "@/lib/auth/bot-guard";
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

  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== "unknown") body.set("remoteip", ip);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

type GuardInput = {
  honeypot?: FormDataEntryValue | null;
  turnstileToken?: FormDataEntryValue | null;
};

async function readRequestMeta() {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  return { ip, userAgent: h.get("user-agent") };
}

/** Sync checks first — no I/O. */
function rejectObviousBot(input: GuardInput): boolean {
  if (isHoneypotTripped(input.honeypot)) return true;
  return false;
}

async function runSignupBotChecks(input: GuardInput): Promise<{ ok: true } | { ok: false }> {
  if (rejectObviousBot(input)) return { ok: false };

  const { ip, userAgent } = await readRequestMeta();
  if (shouldBlockAuthBot(userAgent)) return { ok: false };

  if (isTurnstileEnabled()) {
    const token = String(input.turnstileToken ?? "").trim();
    if (!token) return { ok: false };
    const valid = await verifyTurnstile(token, ip);
    if (!valid) return { ok: false };
  }

  return { ok: true };
}

async function runOtpBotChecks(input: GuardInput): Promise<{ ok: true } | { ok: false }> {
  if (rejectObviousBot(input)) return { ok: false };

  const { userAgent } = await readRequestMeta();
  if (shouldBlockAuthBot(userAgent)) return { ok: false };

  return { ok: true };
}

/** Limit new signups per IP to slow bot farms. */
export async function assertSignupAllowed(
  input: GuardInput,
): Promise<{ ok: true } | { ok: false; error: "rate_limit" }> {
  const bot = await runSignupBotChecks(input);
  if (!bot.ok) return { ok: false, error: "rate_limit" };

  const { ip } = await readRequestMeta();
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
  const bot = await runOtpBotChecks(input);
  if (!bot.ok) return { ok: false, error: "rate_limit" };

  const { ip } = await readRequestMeta();
  const limit = await consumeRateLimitSlot(rateLimitKey("otp_ip", ip), {
    maxAttempts: 8,
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
