import { prisma } from "@/lib/db";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";

export type ResolvedPrice = {
  countryCode: string;
  countryName: string;
  sellPrice: number;
  costPrice: number;
  currency: string;
  provider: string;
  creditsPerSms: number;
  profitPerSms: number;
  isCustom: boolean;
};

export async function resolveSmsPrice(
  userId: string,
  countryCode: string,
): Promise<ResolvedPrice> {
  const code = countryCode.toUpperCase();

  const [custom, pricing] = await Promise.all([
    prisma.userSmsPricing.findFirst({
      where: { userId, countryCode: code, isActive: true },
    }),
    prisma.smsPricing.findFirst({
      where: { country: { code }, isActive: true },
      include: { country: true },
    }),
  ]);

  const sell = custom
    ? custom.sellPrice.toNumber()
    : pricing?.memberPrice.toNumber() ?? 0.05;
  const cost = pricing?.costPrice.toNumber() ?? sell * 0.7;

  return {
    countryCode: code,
    countryName: pricing?.country.name ?? code,
    sellPrice: sell,
    costPrice: cost,
    currency: custom?.currency ?? pricing?.currency ?? "GHS",
    provider: pricing?.provider ?? "mNotify",
    creditsPerSms: pricing?.creditsPerSms ?? 1,
    profitPerSms: Math.max(0, sell - cost),
    isCustom: Boolean(custom),
  };
}

export async function listPublicPricing() {
  return prisma.smsPricing.findMany({
    where: { isActive: true },
    include: { country: true },
    orderBy: { country: { name: "asc" } },
  });
}

export async function listAllPricingForAdmin() {
  return prisma.smsPricing.findMany({
    include: { country: true },
    orderBy: { country: { name: "asc" } },
  });
}

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

export function toPublicPricingRows(
  rows: Awaited<ReturnType<typeof listPublicPricing>>,
): PublicPricingRow[] {
  return rows.map((p) => ({
    id: p.id,
    countryCode: p.country.code,
    countryName: p.country.name,
    dialCode: p.country.dialCode,
    memberPrice: p.memberPrice.toNumber(),
    creditsPerSms: p.creditsPerSms,
    currency: p.currency,
    provider: p.provider,
  }));
}

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
