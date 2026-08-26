export const THEME_COOKIE = "splitsms-theme";

export type Theme = "light" | "dark" | "system";

export const THEMES: Theme[] = ["light", "dark", "system"];

/** Runs before paint so the server layout does not need cookies() (keeps HTML cacheable). */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]*)/);var t=m?decodeURIComponent(m[1]):"";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var c=d?"dark":"light";var e=document.documentElement;e.classList.remove("light","dark");e.classList.add(c);e.style.colorScheme=c;}catch(e){}})();`;

/** Server-safe: only light/dark on <html> (system resolved on client). */
export function resolveThemeClass(stored: string | undefined): "light" | "dark" {
  if (stored === "dark") return "dark";
  return "light";
}

export function parseTheme(value: string | undefined): Theme | undefined {
  if (value === "light" || value === "dark" || value === "system") return value;
  return undefined;
}
