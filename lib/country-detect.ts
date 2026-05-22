const PREFIX_TO_COUNTRY: Record<string, string> = {
  "+233": "GH",
  "+234": "NG",
  "+1": "US",
  "+44": "GB",
  "+27": "ZA",
  "+254": "KE",
};

const LOCALE_TO_COUNTRY: Record<string, string> = {
  "en-GH": "GH",
  "en-NG": "NG",
  "en-US": "US",
  "en-GB": "GB",
};

export function detectCountryFromPhone(phone: string): string | null {
  const normalized = phone.trim();
  for (const prefix of Object.keys(PREFIX_TO_COUNTRY).sort(
    (a, b) => b.length - a.length,
  )) {
    if (normalized.startsWith(prefix)) return PREFIX_TO_COUNTRY[prefix];
  }
  return null;
}

export function detectCountryFromLocale(locale?: string): string {
  if (!locale) return "GH";
  return LOCALE_TO_COUNTRY[locale] ?? locale.split("-")[1]?.toUpperCase() ?? "GH";
}
