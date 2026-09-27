/** Validate a single recipient phone (aligned with normalizePhones in units.ts). */

import { parseRecipientPhones, resolvePhoneRegion } from "@/lib/sms/units";

export type RecipientPhoneCheck = {
  valid: boolean;
  normalized: string;
  display: string;
};

export function validateRecipientPhone(
  raw: string,
  defaultCountry?: string | null,
): RecipientPhoneCheck {
  const trimmed = raw.trim().replace(/\s+/g, "");
  if (!trimmed) {
    return { valid: false, normalized: "", display: "" };
  }

  const region = resolvePhoneRegion(defaultCountry);
  const { valid: list } = parseRecipientPhones(trimmed, region);
  if (list.length === 1) {
    const normalized = list[0]!;
    return {
      valid: true,
      normalized,
      display: normalized.startsWith("+") ? normalized.slice(1) : normalized,
    };
  }

  return {
    valid: false,
    normalized: "",
    display: trimmed,
  };
}

export function splitRecipientInput(text: string): string[] {
  return text
    .split(/[\n,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
