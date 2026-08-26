export type TopUpCreditMeta = {
  buyCreditsOnFund?: boolean;
  creditCountryCode?: string;
  creditsConvertedAt?: string;
  creditsConverted?: number;
  creditsConvertedCost?: number;
};

export function readTopUpCreditMeta(metadata: unknown): TopUpCreditMeta {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  const raw = metadata as Record<string, unknown>;
  return {
    buyCreditsOnFund: raw.buyCreditsOnFund === true,
    creditCountryCode:
      typeof raw.creditCountryCode === "string" ? raw.creditCountryCode.toUpperCase() : undefined,
    creditsConvertedAt: typeof raw.creditsConvertedAt === "string" ? raw.creditsConvertedAt : undefined,
    creditsConverted: typeof raw.creditsConverted === "number" ? raw.creditsConverted : undefined,
    creditsConvertedCost:
      typeof raw.creditsConvertedCost === "number" ? raw.creditsConvertedCost : undefined,
  };
}

export function asMetadataRecord(metadata: unknown): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return {};
  return { ...(metadata as Record<string, unknown>) };
}
