import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";

/** Public / marketing pricing row (no database imports — safe for client components). */
export type PublicPricingRow = {
  id: string;
  countryCode: string;
  countryName: string;
  dialCode: string;
  memberPrice: number;
  creditsPerSms: number;
  currency: string;
  provider: string;
};

export function pickPricingRow(
  rows: PublicPricingRow[],
  countryCode?: string | null,
): PublicPricingRow | null {
  if (rows.length === 0) return null;
  const code = countryCode?.toUpperCase();
  if (code) {
    const match = rows.find((r) => r.countryCode === code);
    if (match) return match;
  }
  return rows.find((r) => r.countryCode === DEFAULT_COUNTRY_CODE) ?? rows[0];
}
