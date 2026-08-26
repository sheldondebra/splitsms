const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NEWSLETTER_MIN_SUBMIT_MS = 1200;
export const NEWSLETTER_WELCOME_SLUG = "newsletter-welcome";

export type NewsletterValidateError =
  | "invalid_email"
  | "honeypot"
  | "too_fast"
  | "disposable";

export function normalizeNewsletterEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidNewsletterEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254;
}

export function parseNewsletterEmails(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(/[\s,;]+/)) {
    const email = normalizeNewsletterEmail(part);
    if (isValidNewsletterEmail(email)) seen.add(email);
  }
  return [...seen];
}

export function validateNewsletterSubmission(input: {
  email: string;
  honeypot?: string | null;
  startedAt?: string | null;
  now?: number;
  isDisposable?: (email: string) => boolean;
}): { ok: true; email: string } | { ok: false; error: NewsletterValidateError } {
  if (String(input.honeypot ?? "").trim()) {
    return { ok: false, error: "honeypot" };
  }

  const email = normalizeNewsletterEmail(input.email);
  if (!isValidNewsletterEmail(email)) {
    return { ok: false, error: "invalid_email" };
  }

  if (input.isDisposable?.(email)) {
    return { ok: false, error: "disposable" };
  }

  const started = Number(input.startedAt ?? "");
  const now = input.now ?? Date.now();
  if (Number.isFinite(started) && started > 0 && now - started < NEWSLETTER_MIN_SUBMIT_MS) {
    return { ok: false, error: "too_fast" };
  }

  return { ok: true, email };
}
