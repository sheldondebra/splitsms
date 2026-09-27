import {
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

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

/** Common markets — used when libphonenumber metadata is unavailable at runtime. */
const CALLING_CODES: Record<string, string> = {
  GH: "233",
  NG: "234",
  KE: "254",
  UG: "256",
  TZ: "255",
  ZA: "27",
  US: "1",
  CA: "1",
  GB: "44",
  CI: "225",
  SN: "221",
  BF: "226",
  ML: "223",
};

/**
 * Map pricing / form country codes to a libphonenumber region.
 * GLOBAL (and unknown) → GH — Ghana-local `0…` numbers are the common case.
 */
export function resolvePhoneRegion(countryCode?: string | null): CountryCode {
  const cc = (countryCode ?? "").trim().toUpperCase();
  if (cc.length === 2) return cc as CountryCode;
  return "GH";
}

function callingCodeFor(region: string): string {
  return CALLING_CODES[region.toUpperCase()] ?? "233";
}

function tryLibE164(value: string, defaultRegion?: CountryCode): string | null {
  try {
    const parsed = defaultRegion
      ? parsePhoneNumberFromString(value, defaultRegion)
      : parsePhoneNumberFromString(value);
    if (parsed?.isValid()) return parsed.format("E.164");
  } catch {
    /* metadata can be missing under some runtimes */
  }
  return null;
}

function isLikelyValidE164(normalized: string, region: CountryCode): boolean {
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) return false;
  try {
    if (isValidPhoneNumber(normalized)) return true;
  } catch {
    /* fall through to heuristics */
  }
  const cc = callingCodeFor(region);
  // Ghana mobiles: +233 + 9 digits
  if (region === "GH") return new RegExp(`^\\+233\\d{9}$`).test(normalized);
  // Generic: starts with expected calling code and has a plausible length
  if (normalized.startsWith(`+${cc}`) && normalized.length >= 10 && normalized.length <= 16) {
    return true;
  }
  // Explicit international (+ / 00 / country digits) already shaped as E.164
  return normalized.length >= 11 && normalized.length <= 16;
}

/**
 * Normalize one raw phone string to E.164.
 * Country-aware for local trunk prefixes (e.g. Ghana `0XXXXXXXXX` → `+233…`).
 * Never blindly prefixes `+` onto short local digits (that used to invent Brazil/Angola numbers).
 */
export function normalizeOnePhone(p: string, defaultCountry?: string | null): string {
  const trimmed = p.trim().replace(/\s+/g, "");
  if (!trimmed) return "";

  const region = resolvePhoneRegion(defaultCountry);
  const calling = callingCodeFor(region);

  // Already international
  if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
    const intl = (trimmed.startsWith("00") ? `+${trimmed.slice(2)}` : trimmed).replace(
      /[^\d+]/g,
      "",
    );
    return tryLibE164(intl) ?? intl;
  }

  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return "";

  // Already includes country calling code without +
  if (digits.startsWith(calling) && digits.length >= calling.length + 7) {
    const asIntl = `+${digits}`;
    return tryLibE164(asIntl) ?? asIntl;
  }

  // National with trunk 0… → +{calling}{rest}
  if (digits.startsWith("0") && digits.length >= 10) {
    const candidate = `+${calling}${digits.slice(1)}`;
    return tryLibE164(candidate) ?? tryLibE164(digits, region) ?? candidate;
  }

  // Bare national (no trunk) — only when length looks like a local mobile
  if (digits.length >= 8 && digits.length <= 10) {
    const candidate = `+${calling}${digits}`;
    return tryLibE164(digits, region) ?? tryLibE164(candidate) ?? candidate;
  }

  // Longer digit strings: try as international
  const asIntl = `+${digits}`;
  return tryLibE164(asIntl) ?? asIntl;
}

export type ParseRecipientPhonesResult = {
  valid: string[];
  invalid: string[];
};

/** Split, normalize, and separate valid vs invalid recipient phones. */
export function parseRecipientPhones(
  input: string,
  defaultCountry?: string | null,
): ParseRecipientPhonesResult {
  const region = resolvePhoneRegion(defaultCountry);
  const raw = input
    .split(/[\n,;]+/)
    .map((s) => s.trim().replace(/\s+/g, ""))
    .filter(Boolean);

  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const p of raw) {
    const normalized = normalizeOnePhone(p, region);
    const ok = isLikelyValidE164(normalized, region);

    if (!ok) {
      if (!invalid.includes(p)) invalid.push(p);
      continue;
    }
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    valid.push(normalized);
  }

  return { valid, invalid };
}

export function normalizePhones(input: string, defaultCountry?: string | null): string[] {
  return parseRecipientPhones(input, defaultCountry).valid;
}
