/** Validate a single recipient phone (aligned with normalizePhones in units.ts). */

export type RecipientPhoneCheck = {
  valid: boolean;
  normalized: string;
  display: string;
};

export function validateRecipientPhone(raw: string): RecipientPhoneCheck {
  const trimmed = raw.trim().replace(/\s+/g, "");
  if (!trimmed) {
    return { valid: false, normalized: "", display: "" };
  }

  let normalized = trimmed.replace(/[^\d+]/g, "");
  if (normalized.startsWith("+")) {
    // keep +
  } else if (normalized.startsWith("00")) {
    normalized = `+${normalized.slice(2)}`;
  } else if (normalized.startsWith("0") && normalized.length >= 10) {
    normalized = `+233${normalized.slice(1)}`;
  } else {
    normalized = `+${normalized.replace(/^0+/, "")}`;
  }

  const valid = /^\+[1-9]\d{7,14}$/.test(normalized);
  const display = normalized.startsWith("+") ? normalized.slice(1) : trimmed;

  return { valid, normalized, display };
}

export function splitRecipientInput(text: string): string[] {
  return text
    .split(/[\n,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
