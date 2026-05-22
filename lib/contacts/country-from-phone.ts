import { parsePhoneNumber } from "libphonenumber-js";

export function detectCountryCode(phone: string): string | undefined {
  try {
    const parsed = parsePhoneNumber(phone);
    return parsed?.country;
  } catch {
    return undefined;
  }
}
