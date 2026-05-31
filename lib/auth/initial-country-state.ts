import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import { detectCountryFromLocale } from "@/lib/country-detect";
import type { SignupCountryOption } from "@/lib/signup-countries";

export function initialCountryState(
  countries: SignupCountryOption[],
  fallbackCode = DEFAULT_COUNTRY_CODE,
): { countryCode: string; dialCode: string } {
  const fallback = countries.find((c) => c.code === fallbackCode);
  const fallbackDial = fallback?.dialCode ?? "+233";

  if (typeof navigator === "undefined") {
    return { countryCode: fallbackCode, dialCode: fallbackDial };
  }

  const detected = detectCountryFromLocale(navigator.language);
  const match = countries.find((c) => c.code === detected);
  if (match) {
    return { countryCode: match.code, dialCode: match.dialCode };
  }

  return { countryCode: fallbackCode, dialCode: fallbackDial };
}
