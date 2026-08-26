/** Ghana mobile network detection from MSISDN prefixes (NDC). Subject to MNP drift. */

export const PHONE_NETWORKS = ["MTN", "TELECEL", "AIRTELTIGO", "OTHER", "UNKNOWN"] as const;

export type PhoneNetwork = (typeof PHONE_NETWORKS)[number];

export const PHONE_NETWORK_LABELS: Record<PhoneNetwork, string> = {
  MTN: "MTN",
  TELECEL: "Telecel",
  AIRTELTIGO: "AirtelTigo",
  OTHER: "Other",
  UNKNOWN: "Unknown",
};

/** National significant number prefixes after country code / leading 0 (Ghana). */
export const GHANA_NETWORK_NDC: Record<"MTN" | "TELECEL" | "AIRTELTIGO", string[]> = {
  MTN: ["24", "25", "53", "54", "55", "59"],
  TELECEL: ["20", "50"],
  AIRTELTIGO: ["26", "27", "56", "57"],
};

export function phoneDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

export function ghanaNationalNumber(phone: string): string | null {
  const digits = phoneDigits(phone);
  if (digits.startsWith("233") && digits.length >= 12) return digits.slice(3);
  if (digits.startsWith("0") && digits.length >= 10) return digits.slice(1);
  if (digits.length === 9) return digits;
  return null;
}

export function detectPhoneNetwork(
  phone: string,
  countryCode?: string | null,
): PhoneNetwork {
  const digits = phoneDigits(phone);
  if (!digits) return "UNKNOWN";

  const cc = (countryCode ?? "").toUpperCase();
  const looksGh =
    cc === "GH" ||
    digits.startsWith("233") ||
    (digits.startsWith("0") && digits.length === 10) ||
    digits.length === 9;

  if (!looksGh) return "OTHER";

  const national = ghanaNationalNumber(phone);
  if (!national || national.length < 2) return "UNKNOWN";

  const ndc = national.slice(0, 2);
  for (const network of ["MTN", "TELECEL", "AIRTELTIGO"] as const) {
    if (GHANA_NETWORK_NDC[network].includes(ndc)) return network;
  }
  return "OTHER";
}

/** Prisma `OR` clauses matching phones for a Ghana network. */
export function ghanaNetworkPhoneOr(
  network: "MTN" | "TELECEL" | "AIRTELTIGO",
): Array<{ phone: { startsWith: string } }> {
  return GHANA_NETWORK_NDC[network].flatMap((ndc) => [
    { phone: { startsWith: `+233${ndc}` } },
    { phone: { startsWith: `233${ndc}` } },
    { phone: { startsWith: `0${ndc}` } },
  ]);
}

export function allGhanaKnownNetworkPhoneOr(): Array<{ phone: { startsWith: string } }> {
  return (["MTN", "TELECEL", "AIRTELTIGO"] as const).flatMap(ghanaNetworkPhoneOr);
}
