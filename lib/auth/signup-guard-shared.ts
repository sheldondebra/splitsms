/** Client-safe signup anti-spam constants (no server-only imports). */

/**
 * Obscure honeypot name — avoid "company" / "website" / "url" which password
 * managers and browser autofill often fill, causing false bot blocks.
 */
export const HONEYPOT_FIELD = "ss_hp_field";

/** Legacy autofill-prone name still accepted so older clients don't break. */
export const HONEYPOT_FIELD_LEGACY = "company_website";

export function turnstileSiteKey(): string | undefined {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || undefined;
}

export function recaptchaSiteKey(): string | undefined {
  return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() || undefined;
}

export type PublicCaptchaConfig =
  | { provider: "recaptcha"; siteKey: string }
  | { provider: "turnstile"; siteKey: string }
  | { provider: null; siteKey: null };

/**
 * Widget config from runtime env. Cloud Run / Docker set NEXT_PUBLIC_* at
 * container start, but Next inlines those into the client bundle at build —
 * so the signup page must pass this from a server component.
 */
export function publicCaptchaConfig(input?: {
  recaptchaSiteKey?: string;
  turnstileSiteKey?: string;
}): PublicCaptchaConfig {
  const recaptcha = (input?.recaptchaSiteKey ?? recaptchaSiteKey())?.trim();
  if (recaptcha) return { provider: "recaptcha", siteKey: recaptcha };
  const turnstile = (input?.turnstileSiteKey ?? turnstileSiteKey())?.trim();
  if (turnstile) return { provider: "turnstile", siteKey: turnstile };
  return { provider: null, siteKey: null };
}

/** Which visible captcha widget to show on auth forms (reCAPTCHA preferred). */
export function authCaptchaProvider(): "recaptcha" | "turnstile" | null {
  return publicCaptchaConfig().provider;
}

export function isHoneypotTripped(value: FormDataEntryValue | null | undefined): boolean {
  return Boolean(String(value ?? "").trim());
}
