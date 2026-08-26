/** High-signal throwaway inboxes used by signup bots. Subdomains of these count too. */
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "10minutemail.com",
  "discarded.me",
  "dispostable.com",
  "emailondeck.com",
  "fakeinbox.com",
  "getnada.com",
  "grr.la",
  "guerrillamail.com",
  "guerrillamail.net",
  "inboxbear.com",
  "jetable.org",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "mintemail.com",
  "moakt.com",
  "mytrashmail.com",
  "sharklasers.com",
  "spamgourmet.com",
  "temp-mail.org",
  "tempail.com",
  "tempmail.com",
  "throwawaymail.com",
  "tmpmail.org",
  "trashmail.com",
  "trashmail.de",
  "wegwerfemail.de",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "mailinator.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "sharklasers.com",
  "10minutemail.net",
  "throwaway.email",
  "tempmailo.com",
  "trashmailer.com",
  "getairmail.com",
  "mailcatch.com",
  "mohmal.com",
  "crazymailing.com",
  "jetable.com",
  "temp-mail.io",
  "emailfake.com",
  "fakemailgenerator.com",
]);

export type PublicOtpPurpose = "signup" | "login" | "reset";
export type SignupIdentityBlock = "invalid_phone" | "disposable_email";

function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 0) return "";
  return email.slice(at + 1).trim().toLowerCase();
}

export function isDisposableEmail(email: string): boolean {
  const domain = emailDomain(email);
  if (!domain) return false;
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;
  for (const blocked of DISPOSABLE_EMAIL_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) return true;
  }
  return false;
}

/** E.164 signup check that does not depend on libphonenumber metadata loading. */
export function isAcceptableSignupPhone(phone: string, countryCode?: string | null): boolean {
  const raw = phone.trim();
  if (!/^\+[1-9]\d{7,14}$/.test(raw)) return false;
  if (raw.startsWith("+233") || countryCode?.toUpperCase() === "GH") {
    return /^\+233[2-5]\d{8}$/.test(raw);
  }
  return true;
}

export function signupIdentityBlockReason(input: {
  phone: string;
  countryCode?: string | null;
  email?: string | null;
}): SignupIdentityBlock | null {
  if (!isAcceptableSignupPhone(input.phone, input.countryCode)) return "invalid_phone";
  const email = input.email?.trim();
  if (email && isDisposableEmail(email)) return "disposable_email";
  return null;
}

/** Public OTP without an explicit purpose is login — never silent signup. */
export function resolvePublicOtpPurpose(purpose: string | undefined | null): PublicOtpPurpose {
  if (purpose === "signup" || purpose === "login" || purpose === "reset") return purpose;
  return "login";
}

