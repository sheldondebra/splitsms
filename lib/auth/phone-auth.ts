import { randomBytes } from "crypto";

/** Placeholder until user completes profile after first OTP signup */
export const PLACEHOLDER_PROFILE_NAME = "SMS User";

export function generateOtpOnlyPassword() {
  return randomBytes(32).toString("base64url");
}

export function userNeedsProfileCompletion(fullName: string) {
  return fullName.trim() === PLACEHOLDER_PROFILE_NAME;
}

/** Mask phone for display: +233 20 *** 4567 */
export function maskPhoneForDisplay(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone;
  const last4 = digits.slice(-4);
  const prefix = phone.startsWith("+") ? phone.slice(0, Math.min(8, phone.length - 4)) : digits.slice(0, 3);
  return `${prefix} *** ${last4}`;
}
