import { prisma } from "@/lib/db";
import { COUNTRIES_DATA } from "@/lib/countries-data";

/** Public signup country list — no SMS provider details exposed to users */
export type SignupCountryOption = {
  code: string;
  name: string;
  dialCode: string;
  region: string;
};

export async function getSignupCountryOptions(): Promise<SignupCountryOption[]> {
  const dbCountries = await prisma.country.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { code: true, name: true, dialCode: true },
  });

  const byCode = new Map<string, SignupCountryOption>();

  for (const country of COUNTRIES_DATA) {
    byCode.set(country.code, {
      code: country.code,
      name: country.name,
      dialCode: country.dialCode,
      region: country.region,
    });
  }

  for (const country of dbCountries) {
    const existing = byCode.get(country.code);
    byCode.set(country.code, {
      code: country.code,
      name: country.name,
      dialCode: country.dialCode,
      region: existing?.region ?? "Global",
    });
  }

  return [...byCode.values()].sort((a, b) => a.name.localeCompare(b.name));
}
