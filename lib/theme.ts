export const THEME_COOKIE = "splitsms-theme";

export type Theme = "light" | "dark" | "system";

export const THEMES: Theme[] = ["light", "dark", "system"];

/** Server-safe: only light/dark on <html> (system resolved on client). */
export function resolveThemeClass(stored: string | undefined): "light" | "dark" {
  if (stored === "dark") return "dark";
  return "light";
}

export function parseTheme(value: string | undefined): Theme | undefined {
  if (value === "light" || value === "dark" || value === "system") return value;
  return undefined;
}
