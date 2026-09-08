import { prisma } from "@/lib/db";
import {
  COUNTRIES_DATA,
  getCountryByCode,
  providerDisplayName,
} from "@/lib/countries-data";
import type { SmsProviderType } from "@/lib/generated/prisma/client";

export type CountryProviderInfo = {
  code: string;
  name: string;
  dialCode: string;
  region: string;
  primaryProvider: SmsProviderType;
  providerLabel: string;
  failoverProviders: string[];
};

function fallbackOrder(countryCode: string): SmsProviderType[] {
  const staticCountry = getCountryByCode(countryCode);
  const primary = staticCountry?.defaultProvider ?? "INFOBIP";
  const all: SmsProviderType[] = ["MNOTIFY", "TWILIO", "INFOBIP"];
  return [primary, ...all.filter((p) => p !== primary)];
}

/** Resolve SMS provider order from admin routes, then static country defaults */
export async function getProviderOrderForCountry(
  countryCode: string,
): Promise<SmsProviderType[]> {
  const country = await prisma.country.findFirst({
    where: { code: countryCode },
    include: {
      routes: {
        include: {
          steps: { include: { provider: true }, orderBy: { priority: "asc" } },
        },
      },
    },
  });

  // Disabled providers (admin toggled off in /admin/providers) must never be
  // offered here — each adapter also refuses to send when disabled, but
  // leaving it in the order wastes a doomed attempt on every send and made
  // "disable this provider" look like it had no effect from the routing side.
  const activeSteps = (country?.routes?.[0]?.steps ?? []).filter((s) => s.provider.isActive);
  if (activeSteps.length > 0) {
    return activeSteps.map((s) => s.provider.type);
  }

  if (countryCode !== "GLOBAL") {
    const global = await prisma.country.findFirst({
      where: { code: "GLOBAL" },
      include: {
        routes: {
          include: {
            steps: { include: { provider: true }, orderBy: { priority: "asc" } },
          },
        },
      },
    });
    const activeGlobalSteps = (global?.routes?.[0]?.steps ?? []).filter((s) => s.provider.isActive);
    if (activeGlobalSteps.length > 0) {
      return activeGlobalSteps.map((s) => s.provider.type);
    }
  }

  return fallbackOrder(countryCode);
}

export async function getCountryProviderInfo(
  countryCode: string,
): Promise<CountryProviderInfo> {
  const order = await getProviderOrderForCountry(countryCode);
  const staticCountry = getCountryByCode(countryCode);
  const dbCountry = await prisma.country.findFirst({ where: { code: countryCode } });

  const primary = order[0] ?? staticCountry?.defaultProvider ?? "INFOBIP";
  const failover = order.slice(1).map(providerDisplayName);

  return {
    code: countryCode,
    name: dbCountry?.name ?? staticCountry?.name ?? countryCode,
    dialCode: dbCountry?.dialCode ?? staticCountry?.dialCode ?? "+",
    region: staticCountry?.region ?? "Global",
    primaryProvider: primary,
    providerLabel: providerDisplayName(primary),
    failoverProviders: failover,
  };
}

/** Countries for signup dropdown (DB merged with static list) */
export async function getSignupCountries(): Promise<CountryProviderInfo[]> {
  const dbCountries = await prisma.country.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const codes = new Set<string>();
  const result: CountryProviderInfo[] = [];

  for (const c of COUNTRIES_DATA) {
    if (codes.has(c.code)) continue;
    codes.add(c.code);
    result.push(await getCountryProviderInfo(c.code));
  }

  for (const c of dbCountries) {
    if (codes.has(c.code)) continue;
    codes.add(c.code);
    result.push(await getCountryProviderInfo(c.code));
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}
