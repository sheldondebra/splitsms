import { prisma } from "@/lib/db";

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
