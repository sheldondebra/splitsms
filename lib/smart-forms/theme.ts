import type { SmartFormThemeSettings } from "@/lib/smart-forms/types";

export const DEFAULT_FORM_BACKGROUND = "#f4f4f5";

export function resolveFormBackground(themeSettings?: SmartFormThemeSettings): string {
  const raw = themeSettings?.backgroundColor?.trim();
  if (!raw) return DEFAULT_FORM_BACKGROUND;
  return raw;
}

/** True when the page wash is dark enough that the form card should sit as paper on navy. */
export function isDarkFormBackground(color: string): boolean {
  const hex = color.trim().replace("#", "");
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(hex)) return false;
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
  const n = Number.parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 < 90;
}
