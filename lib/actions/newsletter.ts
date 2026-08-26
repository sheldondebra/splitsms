"use server";

import { subscribeNewsletter } from "@/lib/newsletter/subscribe";
import { assertNewsletterBotAllowed, newsletterFormTokens } from "@/lib/newsletter/guard";

export type NewsletterFormState =
  | { ok: true }
  | { ok: false; message: string }
  | null;

const MESSAGES: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  disposable: "Use a lasting work or personal inbox — throwaway addresses are blocked.",
  too_fast: "Take a second and try again.",
  honeypot: "Could not subscribe right now.",
  rate_limit: "Too many tries from this network. Wait a bit and try again.",
  captcha: "Could not verify this browser. Refresh and try again.",
  blocked: "Could not subscribe right now.",
};

export async function subscribeNewsletterAction(
  _prev: NewsletterFormState,
  formData: FormData,
): Promise<NewsletterFormState> {
  const tokens = newsletterFormTokens(formData);
  const bot = await assertNewsletterBotAllowed({
    recaptchaToken: tokens.recaptchaToken,
    turnstileToken: tokens.turnstileToken,
  });
  if (!bot.ok) {
    return { ok: false, message: MESSAGES[bot.error] ?? MESSAGES.blocked };
  }

  const result = await subscribeNewsletter({
    email: String(formData.get("email") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    source: "footer",
    honeypot: tokens.honeypot ? String(tokens.honeypot) : "",
    startedAt: tokens.startedAt,
    ip: bot.ip,
    sendWelcome: true,
  });

  if (!result.ok) {
    return { ok: false, message: MESSAGES[result.error] ?? MESSAGES.blocked };
  }

  return { ok: true };
}
