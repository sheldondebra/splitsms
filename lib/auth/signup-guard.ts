import { headers } from "next/headers";
import { consumeRateLimitSlot, rateLimitKey } from "@/lib/auth/rate-limit";
import { shouldBlockAuthBot } from "@/lib/auth/bot-guard";
import {
  RECAPTCHA_SIGNUP_ACTION,
  parseRecaptchaMinScore,
  recaptchaEnforcement,
  signupCaptchaKind,
  verifyRecaptchaToken,
} from "@/lib/auth/recaptcha";
import {
  HONEYPOT_FIELD,
  HONEYPOT_FIELD_LEGACY,
  isHoneypotTripped,
  recaptchaSiteKey,
  turnstileSiteKey,
} from "@/lib/auth/signup-guard-shared";

export { HONEYPOT_FIELD } from "@/lib/auth/signup-guard-shared";

export type AuthGuardError = "rate_limit" | "captcha" | "blocked";
export type AuthGuardResult = { ok: true } | { ok: false; error: AuthGuardError };

function isTurnstileEnabled(): boolean {
  return Boolean(turnstileSiteKey() && process.env.TURNSTILE_SECRET_KEY?.trim());
}

async function verifyRecaptcha(token: string, ip: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secret) return false;

  const result = await verifyRecaptchaToken({
    token,
    ip,
    secret,
    minScore: parseRecaptchaMinScore(process.env.RECAPTCHA_MIN_SCORE),
    expectedAction: RECAPTCHA_SIGNUP_ACTION,
  });
  return result.ok;
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
  recaptchaToken?: FormDataEntryValue | null;
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

/** Bot / captcha only — does not consume rate-limit slots. */
export async function assertSignupBotAllowed(input: GuardInput): Promise<AuthGuardResult> {
  if (rejectObviousBot(input)) return { ok: false, error: "blocked" };

  const { ip, userAgent } = await readRequestMeta();
  if (shouldBlockAuthBot(userAgent)) return { ok: false, error: "blocked" };

  const recaptchaMode = recaptchaEnforcement({
    siteKey: recaptchaSiteKey(),
    secret: process.env.RECAPTCHA_SECRET_KEY,
    production: process.env.NODE_ENV === "production",
  });
  const challenge = signupCaptchaKind(recaptchaMode, isTurnstileEnabled());

  if (!challenge && recaptchaMode === "misconfigured") {
    return { ok: false, error: "captcha" };
  }

  if (challenge === "recaptcha") {
    const token = String(input.recaptchaToken ?? "").trim();
    if (!token) return { ok: false, error: "captcha" };
    const valid = await verifyRecaptcha(token, ip);
    if (!valid) return { ok: false, error: "captcha" };
  } else if (challenge === "turnstile") {
    const token = String(input.turnstileToken ?? "").trim();
    if (!token) return { ok: false, error: "captcha" };
    const valid = await verifyTurnstile(token, ip);
    if (!valid) return { ok: false, error: "captcha" };
  }

  return { ok: true };
}

/** Lightweight bot checks for OTP sends (no captcha). */
export async function assertOtpBotAllowed(input: GuardInput): Promise<AuthGuardResult> {
  if (rejectObviousBot(input)) return { ok: false, error: "blocked" };

  const { userAgent } = await readRequestMeta();
  if (shouldBlockAuthBot(userAgent)) return { ok: false, error: "blocked" };

  return { ok: true };
}

/**
 * Limit new account creations per IP.
 * Generous enough for typos/retries; still slows bot farms.
 */
export async function consumeSignupIpSlot(): Promise<AuthGuardResult> {
  const { ip } = await readRequestMeta();
  const limit = await consumeRateLimitSlot(rateLimitKey("signup_ip", ip), {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    lockoutMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return { ok: false, error: "rate_limit" };
  return { ok: true };
}

/** Limit OTP sends per IP (signup + login) to reduce SMS abuse. */
export async function consumeOtpIpSlot(): Promise<AuthGuardResult> {
  const { ip } = await readRequestMeta();
  const limit = await consumeRateLimitSlot(rateLimitKey("otp_ip", ip), {
    maxAttempts: 6,
    windowMs: 15 * 60 * 1000,
    lockoutMs: 30 * 60 * 1000,
  });
  if (!limit.allowed) return { ok: false, error: "rate_limit" };
  return { ok: true };
}

/** @deprecated Prefer assertSignupBotAllowed + consumeSignupIpSlot after validation. */
export async function assertSignupAllowed(input: GuardInput): Promise<AuthGuardResult> {
  const bot = await assertSignupBotAllowed(input);
  if (!bot.ok) return bot;

  return consumeSignupIpSlot();
}

/** @deprecated Prefer assertOtpBotAllowed + consumeOtpIpSlot after validation. */
export async function assertOtpRequestAllowed(input: GuardInput): Promise<AuthGuardResult> {
  const bot = await assertOtpBotAllowed(input);
  if (!bot.ok) return bot;

  return consumeOtpIpSlot();
}

export function readSignupGuardFields(formData: FormData) {
  const honeypot =
    formData.get(HONEYPOT_FIELD) ?? formData.get(HONEYPOT_FIELD_LEGACY);
  return {
    honeypot,
    turnstileToken: formData.get("cf-turnstile-response"),
    recaptchaToken: formData.get("g-recaptcha-response"),
  };
}
