const GSM7_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM7_EXTENDED = "^{}\\[~]|€";

export function isGsm7(text: string) {
  for (const ch of text) {
    if (!GSM7_BASIC.includes(ch) && !GSM7_EXTENDED.includes(ch)) return false;
  }
  return true;
}

export function countSmsUnits(text: string) {
  const gsm = isGsm7(text);
  const len = text.length;
  if (gsm) {
    if (len <= 160) return 1;
    return Math.ceil(len / 153);
  }
  if (len <= 70) return 1;
  return Math.ceil(len / 67);
}

/**
 * Normalize one raw phone string to E.164. Mirrors validateRecipientPhone in
 * phone-validation.ts — a Ghana-local number typed as 0XXXXXXXXX must become
 * +233XXXXXXXXX, not have its leading 0 simply stripped (that silently drops
 * the country code, producing a number that never matches provider delivery
 * reports even when the SMS itself is actually delivered).
 */
export function normalizeOnePhone(p: string): string {
  const normalized = p.replace(/[^\d+]/g, "");
  if (normalized.startsWith("+")) {
    return normalized;
  }
  if (normalized.startsWith("00")) {
    return `+${normalized.slice(2)}`;
  }
  if (normalized.startsWith("0") && normalized.length >= 10) {
    return `+233${normalized.slice(1)}`;
  }
  return `+${normalized.replace(/^0+/, "")}`;
}

export function normalizePhones(input: string): string[] {
  const raw = input
    .split(/[\n,;]+/)
    .map((s) => s.trim().replace(/\s+/g, ""))
    .filter(Boolean);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of raw) {
    const normalized = normalizeOnePhone(p);
    if (seen.has(normalized)) continue;
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}
