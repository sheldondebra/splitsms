import { countSmsUnits, isGsm7, normalizePhones } from "@/lib/sms/units";
import { resolveSmsPriceForUser } from "@/lib/reseller/pricing";
import { prisma } from "@/lib/db";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";

export type SmsCostEstimate = {
  message: string;
  recipientCount: number;
  segmentsPerMessage: number;
  totalSegments: number;
  encoding: "GSM-7" | "Unicode";
  sellPricePerSegment: number;
  costPricePerSegment: number;
  totalCharge: number;
  totalProviderCost: number;
  estimatedProfit: number;
  currency: string;
  countryCode: string;
  creditsRequired: number;
  walletBalance: number;
  smsCreditBalance: number;
  canAfford: boolean;
  isCustomPricing: boolean;
};

export async function calculateSmsCost(
  userId: string,
  params: {
    message: string;
    recipients: string | string[];
    countryCode?: string;
  },
): Promise<SmsCostEstimate> {
  const countryCode = params.countryCode ?? DEFAULT_COUNTRY_CODE;
  const phones = Array.isArray(params.recipients)
    ? params.recipients
    : normalizePhones(params.recipients);
  const recipientCount = phones.length;
  const segments = countSmsUnits(params.message);
  const price = await resolveSmsPriceForUser(userId, countryCode);
  const totalSegments = segments * Math.max(recipientCount, 1);
  const creditsRequired = totalSegments * price.creditsPerSms;
  const totalCharge = totalSegments * price.sellPrice;
  const totalProviderCost = totalSegments * price.costPrice;

  const [wallet, credit] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.smsCredit.findUnique({ where: { userId } }),
  ]);

  const smsCreditBalance = credit?.balance ?? 0;
  const walletBalance = wallet?.balance.toNumber() ?? 0;

  return {
    message: params.message,
    recipientCount,
    segmentsPerMessage: segments,
    totalSegments,
    encoding: isGsm7(params.message) ? "GSM-7" : "Unicode",
    sellPricePerSegment: price.sellPrice,
    costPricePerSegment: price.costPrice,
    totalCharge,
    totalProviderCost,
    estimatedProfit: totalCharge - totalProviderCost,
    currency: price.currency,
    countryCode: price.countryCode,
    creditsRequired,
    walletBalance,
    smsCreditBalance,
    canAfford: smsCreditBalance >= creditsRequired,
    isCustomPricing: price.isCustom,
  };
}
