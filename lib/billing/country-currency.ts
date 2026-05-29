import { COUNTRIES_DATA } from "@/lib/countries-data";

/** ISO 4217 codes for common destinations */
const CURRENCY_OVERRIDES: Record<string, string> = {
  GH: "GHS",
  NG: "NGN",
  KE: "KES",
  ZA: "ZAR",
  TZ: "TZS",
  UG: "UGX",
  RW: "RWF",
  ET: "ETB",
  EG: "EGP",
  MA: "MAD",
  TN: "TND",
  DZ: "DZD",
  CI: "XOF",
  SN: "XOF",
  ML: "XOF",
  BF: "XOF",
  BJ: "XOF",
  TG: "XOF",
  NE: "XOF",
  GN: "GNF",
  SL: "SLE",
  LR: "LRD",
  GM: "GMD",
  MR: "MRU",
  CD: "CDF",
  AO: "AOA",
  MZ: "MZN",
  ZM: "ZMW",
  ZW: "ZWL",
  BW: "BWP",
  NA: "NAD",
  US: "USD",
  CA: "CAD",
  MX: "MXN",
  BR: "BRL",
  AR: "ARS",
  CO: "COP",
  CL: "CLP",
  PE: "PEN",
  GB: "GBP",
  IE: "EUR",
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  BE: "EUR",
  PT: "EUR",
  PL: "PLN",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  FI: "EUR",
  CH: "CHF",
  AT: "EUR",
  GR: "EUR",
  TR: "TRY",
  RU: "RUB",
  UA: "UAH",
  IN: "INR",
  PK: "PKR",
  BD: "BDT",
  CN: "CNY",
  JP: "JPY",
  KR: "KRW",
  SG: "SGD",
  MY: "MYR",
  TH: "THB",
  VN: "VND",
  PH: "PHP",
  ID: "IDR",
  AE: "AED",
  SA: "SAR",
  IL: "ILS",
  QA: "QAR",
  KW: "KWD",
  AU: "AUD",
  NZ: "NZD",
  GLOBAL: "USD",
};

export function getCountryDefaultCurrency(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (CURRENCY_OVERRIDES[code]) return CURRENCY_OVERRIDES[code];

  const country = COUNTRIES_DATA.find((c) => c.code === code);
  if (!country) return "USD";

  switch (country.region) {
    case "Africa":
      return "USD";
    case "Europe":
      return "EUR";
    case "Americas":
      return "USD";
    case "Asia":
    case "Middle East":
      return "USD";
    case "Oceania":
      return "AUD";
    case "Global":
      return "USD";
    default:
      return "USD";
  }
}

/**
 * Admin can set currency per country. Seed historically defaulted all rows to GHS —
 * when stored currency is still GHS for a non-Ghana country, show the local currency instead.
 */
export function displayPricingCurrency(countryCode: string, storedCurrency: string): string {
  const code = countryCode.toUpperCase();
  const stored = (storedCurrency || "GHS").trim().toUpperCase();
  const local = getCountryDefaultCurrency(code);

  if (code === "GH") return stored;
  if (stored === "GHS") return local;
  return stored;
}
