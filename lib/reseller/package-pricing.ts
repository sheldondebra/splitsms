import { prisma } from "@/lib/db";
import { displayPricingCurrency } from "@/lib/billing/country-currency";
import {
  SMS_CREDIT_PACKAGES,
  packageTotalCost,
  type SmsCreditPackage,
} from "@/lib/billing/sms-packages";

export type ResellerPackageCountryPricing = {
  countryCode: string;
  countryName: string;
  currency: string;
  /** What the reseller pays SplitSMS per credit */
  wholesalePrice: number;
  /** What the reseller charges clients (their margin rate) */
  sellPrice: number;
  /** Platform provider cost (reference) */
  costPrice: number;
  /** Profit per SMS if sold at sellPrice after buying at wholesale */
  profitPerSms: number;
  marginPct: number;
  isCustomSell: boolean;
  hasWholesale: boolean;
};

export type ResellerPackageQuote = {
  package: SmsCreditPackage;
  credits: number;
  buyCost: number;
  sellRevenue: number;
  profit: number;
  profitPct: number;
  currency: string;
};

function marginPct(sell: number, buy: number) {
  if (sell <= 0) return 0;
  return Math.round(((sell - buy) / sell) * 100);
}

export async function getResellerPackagePricingOptions(
  resellerId: string,
): Promise<ResellerPackageCountryPricing[]> {
  const [dbRows, customRates] = await Promise.all([
    prisma.smsPricing.findMany({
      where: { isActive: true },
      include: { country: true },
      orderBy: { country: { name: "asc" } },
    }),
    prisma.resellerCountryPricing.findMany({
      where: { resellerId, isActive: true },
    }),
  ]);

  return dbRows.map((p) => {
    const custom = customRates.find((c) => c.countryCode === p.country.code);
    const memberPrice = p.memberPrice.toNumber();
    const wholesaleRaw = p.resellerPrice?.toNumber();
    const wholesalePrice =
      wholesaleRaw != null && wholesaleRaw > 0 ? wholesaleRaw : memberPrice;
    const sellPrice = custom ? custom.sellPrice.toNumber() : memberPrice;
    const costPrice = p.costPrice.toNumber();
    const profitPerSms = Math.max(0, sellPrice - wholesalePrice);

    return {
      countryCode: p.country.code,
      countryName: p.country.name,
      currency: custom?.currency ?? displayPricingCurrency(p.country.code, p.currency),
      wholesalePrice,
      sellPrice,
      costPrice,
      profitPerSms,
      marginPct: marginPct(sellPrice, wholesalePrice),
      isCustomSell: Boolean(custom),
      hasWholesale: wholesaleRaw != null && wholesaleRaw > 0,
    };
  });
}

export async function resolveResellerWholesalePrice(
  resellerId: string,
  countryCode: string,
): Promise<ResellerPackageCountryPricing> {
  const code = countryCode.toUpperCase();
  const options = await getResellerPackagePricingOptions(resellerId);
  const match = options.find((o) => o.countryCode === code);
  if (match) return match;

  const pricing = await prisma.smsPricing.findFirst({
    where: { country: { code }, isActive: true },
    include: { country: true },
  });
  const memberPrice = pricing?.memberPrice.toNumber() ?? 0.05;
  const wholesaleRaw = pricing?.resellerPrice?.toNumber();
  const wholesalePrice =
    wholesaleRaw != null && wholesaleRaw > 0 ? wholesaleRaw : memberPrice;
  const sellPrice = memberPrice;

  return {
    countryCode: code,
    countryName: pricing?.country.name ?? code,
    currency: displayPricingCurrency(code, pricing?.currency ?? "GHS"),
    wholesalePrice,
    sellPrice,
    costPrice: pricing?.costPrice.toNumber() ?? wholesalePrice * 0.7,
    profitPerSms: Math.max(0, sellPrice - wholesalePrice),
    marginPct: marginPct(sellPrice, wholesalePrice),
    isCustomSell: false,
    hasWholesale: wholesaleRaw != null && wholesaleRaw > 0,
  };
}

export function quoteResellerPackage(
  pkg: SmsCreditPackage,
  pricing: Pick<
    ResellerPackageCountryPricing,
    "wholesalePrice" | "sellPrice" | "currency"
  >,
): ResellerPackageQuote {
  const credits = pkg.credits;
  const buyCost = packageTotalCost(credits, pricing.wholesalePrice);
  const sellRevenue = packageTotalCost(credits, pricing.sellPrice);
  const profit = Math.round((sellRevenue - buyCost) * 100) / 100;
  return {
    package: pkg,
    credits,
    buyCost,
    sellRevenue,
    profit,
    profitPct: marginPct(sellRevenue, buyCost),
    currency: pricing.currency,
  };
}

export function quoteAllResellerPackages(
  pricing: Pick<
    ResellerPackageCountryPricing,
    "wholesalePrice" | "sellPrice" | "currency"
  >,
) {
  return SMS_CREDIT_PACKAGES.map((pkg) => quoteResellerPackage(pkg, pricing));
}
