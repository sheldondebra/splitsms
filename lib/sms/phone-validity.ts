import { isValidPhoneNumber } from "libphonenumber-js";

/** Whether a stored phone looks deliverable (E.164 / national with country). */
export function isValidStoredPhone(phone: string, countryCode?: string | null): boolean {
  const raw = phone.trim();
  if (!raw) return false;

  try {
    if (raw.startsWith("+")) return isValidPhoneNumber(raw);
    const cc = (countryCode ?? "").toUpperCase();
    if (cc.length === 2) return isValidPhoneNumber(raw, cc as never);
    // Ghana local formats often stored without +
    if (/^0\d{9}$/.test(raw.replace(/\s/g, ""))) return isValidPhoneNumber(raw, "GH");
    if (/^233\d{9}$/.test(raw.replace(/\D/g, ""))) {
      return isValidPhoneNumber(`+${raw.replace(/\D/g, "")}`);
    }
    return isValidPhoneNumber(`+${raw.replace(/\D/g, "")}`);
  } catch {
    return false;
  }
}
