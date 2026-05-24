import type { PublicPricingRow } from "@/lib/billing/pricing";

export type CustomRate = {
  countryCode: string;
  sellPrice: number;
  currency: string;
};

export function formatPrice(amount: number, currency: string) {
  const n = amount < 0.01 ? amount.toFixed(4) : amount.toFixed(3);
  return `${currency} ${n}`;
}

export function resolveMemberPrice(
  row: PublicPricingRow,
  customByCode: Record<string, CustomRate>,
) {
  const custom = customByCode[row.countryCode];
  return {
    price: custom?.sellPrice ?? row.memberPrice,
    currency: custom?.currency ?? row.currency,
    isCustom: Boolean(custom),
  };
}

export function lowestRate(
  rows: PublicPricingRow[],
  customByCode: Record<string, CustomRate>,
) {
  if (!rows.length) return null;
  let best = rows[0];
  let bestPrice = resolveMemberPrice(best, customByCode).price;
  let bestCurrency = resolveMemberPrice(best, customByCode).currency;
  for (const row of rows) {
    const { price, currency } = resolveMemberPrice(row, customByCode);
    if (price < bestPrice) {
      best = row;
      bestPrice = price;
      bestCurrency = currency;
    }
  }
  return { row: best, price: bestPrice, currency: bestCurrency };
}

export function exportRatesCsv(
  rows: PublicPricingRow[],
  customByCode: Record<string, CustomRate>,
) {
  const header = "Country,Code,Dial,Price,Currency,Credits,Provider,Custom\n";
  const body = rows
    .map((r) => {
      const { price, currency, isCustom } = resolveMemberPrice(r, customByCode);
      return [
        `"${r.countryName}"`,
        r.countryCode,
        r.dialCode,
        price,
        currency,
        r.creditsPerSms,
        r.provider,
        isCustom ? "yes" : "no",
      ].join(",");
    })
    .join("\n");
  return header + body;
}
