"use client";

import { useSearchParams } from "next/navigation";
import type { PublicPricingRow } from "@/lib/billing/public-pricing";
import { pickPricingRow } from "@/lib/billing/public-pricing";
import { formatRowPrice } from "@/lib/billing/pricing-format";

type PublicPricingHeroPriceProps = {
  rows: PublicPricingRow[];
  /** Server-rendered fallback before search params hydrate */
  initialCountryCode: string;
};

export function PublicPricingHeroPrice({
  rows,
  initialCountryCode,
}: PublicPricingHeroPriceProps) {
  const searchParams = useSearchParams();
  const countryFromUrl = searchParams.get("country");
  const selected = pickPricingRow(rows, countryFromUrl ?? initialCountryCode);

  const lowest =
    rows.length > 0
      ? rows.reduce((min, r) => (r.memberPrice < min.memberPrice ? r : min), rows[0])
      : null;

  if (selected) {
    return (
      <>
        {formatRowPrice(selected)}
        <span className="text-base font-normal text-muted-foreground"> / SMS segment</span>
      </>
    );
  }

  if (lowest) {
    return (
      <>
        from {formatRowPrice(lowest)}
        <span className="text-base font-normal text-muted-foreground"> / SMS segment</span>
      </>
    );
  }

  return <>Transparent rates</>;
}
