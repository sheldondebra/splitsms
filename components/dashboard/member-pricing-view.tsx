"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { PublicPricingRow } from "@/lib/billing/pricing";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

type CustomRate = { countryCode: string; sellPrice: number; currency: string };

function formatPrice(amount: number, currency: string) {
  const n = amount < 0.01 ? amount.toFixed(4) : amount.toFixed(3);
  return `${currency} ${n}`;
}

export function MemberPricingView({
  rows,
  selectedCode,
  customRates,
}: {
  rows: PublicPricingRow[];
  selectedCode: string;
  customRates: CustomRate[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customByCode = Object.fromEntries(customRates.map((c) => [c.countryCode, c]));
  const selected =
    rows.find((r) => r.countryCode === selectedCode) ?? rows[0] ?? null;

  function onCountryChange(code: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("country", code);
    router.push(`/dashboard/pricing?${params.toString()}`, { scroll: false });
  }

  if (!selected) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">No pricing configured yet.</p>
    );
  }

  const custom = customByCode[selected.countryCode];
  const sell = custom?.sellPrice ?? selected.memberPrice;
  const currency = custom?.currency ?? selected.currency;

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="dash-pricing-country" className="text-sm font-semibold flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          Country
        </Label>
        <select
          id="dash-pricing-country"
          value={selected.countryCode}
          onChange={(e) => onCountryChange(e.target.value)}
          className="mt-2 w-full h-11 rounded-xl border border-input bg-background px-3 text-sm font-medium"
        >
          {rows.map((r) => (
            <option key={r.countryCode} value={r.countryCode}>
              {r.countryName} ({r.countryCode})
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
        {custom && (
          <Badge className="mb-3" variant="secondary">
            Your custom rate
          </Badge>
        )}
        <p className="text-sm text-muted-foreground">{selected.countryName}</p>
        <p className="text-3xl font-bold text-primary mt-2 tabular-nums">
          {formatPrice(sell, currency)}
          <span className="text-sm font-normal text-muted-foreground"> / segment</span>
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          {selected.creditsPerSms} credit(s) per segment · {selected.provider}
        </p>
      </div>

      <ul className="md:hidden divide-y divide-border/60 rounded-xl border overflow-hidden">
        {rows.map((r) => {
          const c = customByCode[r.countryCode];
          const price = c?.sellPrice ?? r.memberPrice;
          const cur = c?.currency ?? r.currency;
          const active = r.countryCode === selected.countryCode;
          return (
            <li
              key={r.id}
              className={cn(
                "flex justify-between px-4 py-3 text-sm",
                active && "bg-primary/5",
              )}
            >
              <button
                type="button"
                onClick={() => onCountryChange(r.countryCode)}
                className="font-medium text-left"
              >
                {r.countryName}
              </button>
              <span className="font-semibold tabular-nums">
                {formatPrice(price, cur)}
                {c && <span className="text-[10px] text-primary ml-1">custom</span>}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="hidden md:block rounded-xl border overflow-x-auto app-scroll-x">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3 text-right">Your rate</th>
              <th className="px-4 py-3 text-right">Credits</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const c = customByCode[r.countryCode];
              const price = c?.sellPrice ?? r.memberPrice;
              const cur = c?.currency ?? r.currency;
              return (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{r.countryName}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatPrice(price, cur)}
                    {c && (
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        Custom
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{r.creditsPerSms}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
