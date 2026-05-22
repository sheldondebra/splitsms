import { getSignupCountries as getCountriesWithProviders } from "@/lib/sms/country-provider";

/** Public signup country list — no SMS provider details exposed to users */
export type SignupCountryOption = {
  code: string;
  name: string;
  dialCode: string;
  region: string;
};

export async function getSignupCountryOptions(): Promise<SignupCountryOption[]> {
  const rows = await getCountriesWithProviders();
  return rows.map(({ code, name, dialCode, region }) => ({
    code,
    name,
    dialCode,
    region,
  }));
}
