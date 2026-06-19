/** Client-safe sender ID formatting and length rules (no DB / server-only imports). */

export const SENDER_ID_MIN_LENGTH = 3;
export const SENDER_ID_MAX_LENGTH = 11;

export function normalizeSenderIdValue(raw: string) {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function validateSenderIdFormat(
  value: string,
): { ok: true } | { ok: false; error: string; code: "invalid" } {
  if (!value) {
    return { ok: false, error: "Sender ID is required", code: "invalid" };
  }
  if (value.length < SENDER_ID_MIN_LENGTH) {
    return {
      ok: false,
      error: `Sender ID must be at least ${SENDER_ID_MIN_LENGTH} characters`,
      code: "invalid",
    };
  }
  if (value.length > SENDER_ID_MAX_LENGTH) {
    return {
      ok: false,
      error: `Sender ID must be ${SENDER_ID_MAX_LENGTH} characters or fewer`,
      code: "invalid",
    };
  }
  if (!/[A-Z]/.test(value)) {
    return {
      ok: false,
      error: "Sender ID must include at least one letter",
      code: "invalid",
    };
  }
  return { ok: true };
}

/** @deprecated Use validateSenderIdForRegistration for full checks. */
export function validateSenderIdValue(
  value: string,
): { ok: true } | { ok: false; error: string } {
  return validateSenderIdFormat(value);
}
