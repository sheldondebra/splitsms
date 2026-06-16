import type { SmartFormThemeSettings } from "@/lib/smart-forms/types";

export const DEFAULT_FORM_BACKGROUND = "#f4f4f5";

export function resolveFormBackground(themeSettings?: SmartFormThemeSettings): string {
  const raw = themeSettings?.backgroundColor?.trim();
  if (!raw) return DEFAULT_FORM_BACKGROUND;
  return raw;
}
