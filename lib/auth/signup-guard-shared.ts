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

/** Which visible captcha widget to show on auth forms (reCAPTCHA preferred). */
export function authCaptchaProvider(): "recaptcha" | "turnstile" | null {
  if (recaptchaSiteKey()) return "recaptcha";
  if (turnstileSiteKey()) return "turnstile";
  return null;
}

export function isHoneypotTripped(value: FormDataEntryValue | null | undefined): boolean {
  return Boolean(String(value ?? "").trim());
}
