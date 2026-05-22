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

export function normalizePhones(input: string): string[] {
  const raw = input
    .split(/[\n,;]+/)
    .map((s) => s.trim().replace(/\s+/g, ""))
    .filter(Boolean);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of raw) {
    const normalized = p.startsWith("+") ? p : `+${p.replace(/^0+/, "")}`;
    if (seen.has(normalized)) continue;
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}
