export function normalizeSenderIdValue(raw: string) {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function validateSenderIdValue(value: string): { ok: true } | { ok: false; error: string } {
  if (!value) return { ok: false, error: "Sender ID is required" };
  if (value.length > 11) return { ok: false, error: "Sender ID must be 11 characters or fewer" };
  if (!/[A-Z]/.test(value)) return { ok: false, error: "Sender ID must include at least one letter" };
  return { ok: true };
}
