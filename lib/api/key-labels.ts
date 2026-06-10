/** Strip legacy rotation suffixes so labels do not stack "(rotated) (rotated)". */
export function normalizeApiKeyBaseLabel(label: string): string {
  let base = label.trim();
  if (!base) return "API key";

  // Legacy: "Name (rotated) (rotated)"
  while (/\s*\(rotated\)\s*$/i.test(base)) {
    base = base.replace(/\s*\(rotated\)\s*$/i, "").trim();
  }

  // "Name · v3" or "Name · v12"
  base = base.replace(/\s*·\s*v\d+\s*$/i, "").trim();

  // "Name (retired …)" from a previous rotate
  base = base.replace(/\s*·\s*retired\b.*$/i, "").trim();

  return base || "API key";
}

/** Label for a key that was replaced — dated, no "rotated" wording. */
export function retiredApiKeyLabel(baseLabel: string, at = new Date()): string {
  const base = normalizeApiKeyBaseLabel(baseLabel);
  const date = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(at);
  return `${base} · retired ${date}`;
}

/** Clean display for keys saved before label logic was fixed. */
export function displayApiKeyLabel(label: string): string {
  if (/\(rotated\)/i.test(label)) {
    return normalizeApiKeyBaseLabel(label);
  }
  return label;
}
