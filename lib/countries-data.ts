import type { SmsProviderType } from "@/lib/generated/prisma/client";

export type CountryData = {
  code: string;
  name: string;
  dialCode: string;
  region: string;
  /** Default SMS gateway for this country (signup OTP + sends) */
  defaultProvider: SmsProviderType;
};

/** Primary markets: Ghana → mNotify; US/UK → Twilio; most others → Infobip with Twilio failover in seed */
export const COUNTRIES_DATA: CountryData[] = [
  { code: "GH", name: "Ghana", dialCode: "+233", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "NG", name: "Nigeria", dialCode: "+234", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "KE", name: "Kenya", dialCode: "+254", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "ZA", name: "South Africa", dialCode: "+27", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "TZ", name: "Tanzania", dialCode: "+255", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "UG", name: "Uganda", dialCode: "+256", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "RW", name: "Rwanda", dialCode: "+250", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "ET", name: "Ethiopia", dialCode: "+251", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "CI", name: "Côte d'Ivoire", dialCode: "+225", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "SN", name: "Senegal", dialCode: "+221", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "CM", name: "Cameroon", dialCode: "+237", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "ML", name: "Mali", dialCode: "+223", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "BF", name: "Burkina Faso", dialCode: "+226", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "BJ", name: "Benin", dialCode: "+229", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "TG", name: "Togo", dialCode: "+228", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "NE", name: "Niger", dialCode: "+227", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "GN", name: "Guinea", dialCode: "+224", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "SL", name: "Sierra Leone", dialCode: "+232", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "LR", name: "Liberia", dialCode: "+231", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "GM", name: "Gambia", dialCode: "+220", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "MR", name: "Mauritania", dialCode: "+222", region: "Africa", defaultProvider: "MNOTIFY" },
  { code: "CD", name: "DR Congo", dialCode: "+243", region: "Africa", defaultProvider: "INFOBIP" },
  { code: "AO", name: "Angola", dialCode: "+244", region: "Africa", defaultProvider: "INFOBIP" },
  { code: "MZ", name: "Mozambique", dialCode: "+258", region: "Africa", defaultProvider: "INFOBIP" },
  { code: "ZM", name: "Zambia", dialCode: "+260", region: "Africa", defaultProvider: "INFOBIP" },
  { code: "ZW", name: "Zimbabwe", dialCode: "+263", region: "Africa", defaultProvider: "INFOBIP" },
  { code: "BW", name: "Botswana", dialCode: "+267", region: "Africa", defaultProvider: "INFOBIP" },
  { code: "NA", name: "Namibia", dialCode: "+264", region: "Africa", defaultProvider: "INFOBIP" },
  { code: "EG", name: "Egypt", dialCode: "+20", region: "Africa", defaultProvider: "INFOBIP" },
  { code: "MA", name: "Morocco", dialCode: "+212", region: "Africa", defaultProvider: "INFOBIP" },
  { code: "TN", name: "Tunisia", dialCode: "+216", region: "Africa", defaultProvider: "INFOBIP" },
  { code: "DZ", name: "Algeria", dialCode: "+213", region: "Africa", defaultProvider: "INFOBIP" },
  { code: "US", name: "United States", dialCode: "+1", region: "Americas", defaultProvider: "TWILIO" },
  { code: "CA", name: "Canada", dialCode: "+1", region: "Americas", defaultProvider: "TWILIO" },
  { code: "MX", name: "Mexico", dialCode: "+52", region: "Americas", defaultProvider: "TWILIO" },
  { code: "BR", name: "Brazil", dialCode: "+55", region: "Americas", defaultProvider: "TWILIO" },
  { code: "AR", name: "Argentina", dialCode: "+54", region: "Americas", defaultProvider: "TWILIO" },
  { code: "CO", name: "Colombia", dialCode: "+57", region: "Americas", defaultProvider: "TWILIO" },
  { code: "CL", name: "Chile", dialCode: "+56", region: "Americas", defaultProvider: "TWILIO" },
  { code: "PE", name: "Peru", dialCode: "+51", region: "Americas", defaultProvider: "TWILIO" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", region: "Europe", defaultProvider: "TWILIO" },
  { code: "IE", name: "Ireland", dialCode: "+353", region: "Europe", defaultProvider: "TWILIO" },
  { code: "DE", name: "Germany", dialCode: "+49", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "FR", name: "France", dialCode: "+33", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "ES", name: "Spain", dialCode: "+34", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "IT", name: "Italy", dialCode: "+39", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "NL", name: "Netherlands", dialCode: "+31", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "BE", name: "Belgium", dialCode: "+32", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "PT", name: "Portugal", dialCode: "+351", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "PL", name: "Poland", dialCode: "+48", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "SE", name: "Sweden", dialCode: "+46", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "NO", name: "Norway", dialCode: "+47", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "DK", name: "Denmark", dialCode: "+45", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "FI", name: "Finland", dialCode: "+358", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "CH", name: "Switzerland", dialCode: "+41", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "AT", name: "Austria", dialCode: "+43", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "GR", name: "Greece", dialCode: "+30", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "TR", name: "Turkey", dialCode: "+90", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "RU", name: "Russia", dialCode: "+7", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "UA", name: "Ukraine", dialCode: "+380", region: "Europe", defaultProvider: "INFOBIP" },
  { code: "IN", name: "India", dialCode: "+91", region: "Asia", defaultProvider: "INFOBIP" },
  { code: "PK", name: "Pakistan", dialCode: "+92", region: "Asia", defaultProvider: "INFOBIP" },
  { code: "BD", name: "Bangladesh", dialCode: "+880", region: "Asia", defaultProvider: "INFOBIP" },
  { code: "CN", name: "China", dialCode: "+86", region: "Asia", defaultProvider: "INFOBIP" },
  { code: "JP", name: "Japan", dialCode: "+81", region: "Asia", defaultProvider: "INFOBIP" },
  { code: "KR", name: "South Korea", dialCode: "+82", region: "Asia", defaultProvider: "INFOBIP" },
  { code: "SG", name: "Singapore", dialCode: "+65", region: "Asia", defaultProvider: "INFOBIP" },
  { code: "MY", name: "Malaysia", dialCode: "+60", region: "Asia", defaultProvider: "INFOBIP" },
  { code: "TH", name: "Thailand", dialCode: "+66", region: "Asia", defaultProvider: "INFOBIP" },
  { code: "VN", name: "Vietnam", dialCode: "+84", region: "Asia", defaultProvider: "INFOBIP" },
  { code: "PH", name: "Philippines", dialCode: "+63", region: "Asia", defaultProvider: "INFOBIP" },
  { code: "ID", name: "Indonesia", dialCode: "+62", region: "Asia", defaultProvider: "INFOBIP" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971", region: "Middle East", defaultProvider: "INFOBIP" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", region: "Middle East", defaultProvider: "INFOBIP" },
  { code: "IL", name: "Israel", dialCode: "+972", region: "Middle East", defaultProvider: "INFOBIP" },
  { code: "QA", name: "Qatar", dialCode: "+974", region: "Middle East", defaultProvider: "INFOBIP" },
  { code: "KW", name: "Kuwait", dialCode: "+965", region: "Middle East", defaultProvider: "INFOBIP" },
  { code: "AU", name: "Australia", dialCode: "+61", region: "Oceania", defaultProvider: "TWILIO" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", region: "Oceania", defaultProvider: "TWILIO" },
  { code: "GLOBAL", name: "Other / International", dialCode: "+", region: "Global", defaultProvider: "INFOBIP" },
];

export function getCountryByCode(code: string): CountryData | undefined {
  return COUNTRIES_DATA.find((c) => c.code === code);
}

export function providerDisplayName(type: SmsProviderType): string {
  switch (type) {
    case "MNOTIFY":
      return "mNotify";
    case "TWILIO":
      return "Twilio";
    case "INFOBIP":
      return "Infobip";
    default:
      return type;
  }
}
