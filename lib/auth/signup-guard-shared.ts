/** Client-safe signup anti-spam constants (no server-only imports). */

export const HONEYPOT_FIELD = "company_website";

export function turnstileSiteKey(): string | undefined {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || undefined;
}

export function isHoneypotTripped(value: FormDataEntryValue | null | undefined): boolean {
  return Boolean(String(value ?? "").trim());
}
