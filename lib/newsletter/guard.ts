import { headers } from "next/headers";
import { consumeRateLimitSlot, rateLimitKey } from "@/lib/auth/rate-limit";
import { shouldBlockAuthBot } from "@/lib/auth/bot-guard";
import {
  RECAPTCHA_NEWSLETTER_ACTION,
  parseRecaptchaMinScore,
  recaptchaEnforcement,
  signupCaptchaKind,
  verifyRecaptchaToken,
} from "@/lib/auth/recaptcha";
import {
  HONEYPOT_FIELD,
  HONEYPOT_FIELD_LEGACY,
  recaptchaSiteKey,
  turnstileSiteKey,
} from "@/lib/auth/signup-guard-shared";

export type NewsletterGuardError = "rate_limit" | "captcha" | "blocked";

async function requestMeta() {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown";
  return { ip, userAgent: h.get("user-agent") };
}

async function verifyTurnstile(token: string, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return true;
  const body = new URLSearchParams({ secret, response: token });
  if (ip && ip !== "unknown") body.set("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

export async function assertNewsletterBotAllowed(input: {
  recaptchaToken?: FormDataEntryValue | null;
  turnstileToken?: FormDataEntryValue | null;
}): Promise<{ ok: true; ip: string } | { ok: false; error: NewsletterGuardError }> {
  const { ip, userAgent } = await requestMeta();
  if (shouldBlockAuthBot(userAgent)) return { ok: false, error: "blocked" };

  const recaptchaMode = recaptchaEnforcement({
    siteKey: recaptchaSiteKey(),
    secret: process.env.RECAPTCHA_SECRET_KEY,
    production: process.env.NODE_ENV === "production",
  });
  const challenge = signupCaptchaKind(recaptchaMode, Boolean(turnstileSiteKey()));

  if (!challenge && recaptchaMode === "misconfigured") {
    return { ok: false, error: "captcha" };
  }

  if (challenge === "recaptcha") {
    const token = String(input.recaptchaToken ?? "").trim();
    const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();
    if (!token || !secret) return { ok: false, error: "captcha" };
    const valid = await verifyRecaptchaToken({
      token,
      ip,
      secret,
      minScore: parseRecaptchaMinScore(process.env.RECAPTCHA_MIN_SCORE),
      expectedAction: RECAPTCHA_NEWSLETTER_ACTION,
    });
    if (!valid.ok) return { ok: false, error: "captcha" };
  } else if (challenge === "turnstile") {
    const token = String(input.turnstileToken ?? "").trim();
    if (!token) return { ok: false, error: "captcha" };
    const ok = await verifyTurnstile(token, ip);
    if (!ok) return { ok: false, error: "captcha" };
  }

  const limit = await consumeRateLimitSlot(rateLimitKey("newsletter", ip), {
    maxAttempts: 5,
    windowMs: 60 * 60 * 1000,
    lockoutMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return { ok: false, error: "rate_limit" };

  return { ok: true, ip };
}

export function newsletterFormTokens(formData: FormData) {
  return {
    honeypot: formData.get(HONEYPOT_FIELD) ?? formData.get(HONEYPOT_FIELD_LEGACY),
    recaptchaToken: formData.get("g-recaptcha-response"),
    turnstileToken: formData.get("cf-turnstile-response"),
    startedAt: String(formData.get("startedAt") ?? ""),
  };
}
