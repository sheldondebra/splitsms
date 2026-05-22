"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  MessageSquare,
  Coins,
  Server,
  Info,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import type { PublicPricingRow } from "@/lib/billing/pricing";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

type PublicPricingExplorerProps = {
  rows: PublicPricingRow[];
  selectedCode: string;
  lowestPrice: number;
  lowestCurrency: string;
};

function formatPrice(amount: number, currency: string) {
  const n = amount < 0.01 ? amount.toFixed(4) : amount.toFixed(3);
  return `${currency} ${n}`;
}

export function PublicPricingExplorer({
  rows,
  selectedCode,
  lowestPrice,
  lowestCurrency,
}: PublicPricingExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selected =
    rows.find((r) => r.countryCode === selectedCode) ?? rows[0] ?? null;

  function onCountryChange(code: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("country", code);
    router.push(`/pricing?${params.toString()}`, { scroll: false });
  }

  if (!selected) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/30 px-6 py-12 text-center">
        <p className="text-muted-foreground text-sm">
          Pricing is being configured. Please check back soon or contact sales.
        </p>
        <Link href="/contact" className={cn(buttonVariants({ className: "mt-4" }))}>
          Contact us
        </Link>
      </div>
    );
  }

  const creditsLabel =
    selected.creditsPerSms === 1
      ? "1 credit per SMS segment"
      : `${selected.creditsPerSms} credits per SMS segment`;

  return (
    <div className="space-y-8">
      {/* Country selector */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm">
        <Label htmlFor="pricing-country" className="text-sm font-semibold flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          Select destination country
        </Label>
        <p className="text-xs text-muted-foreground mt-1 mb-3">
          Rates are set by SplitSMS admin per country and update on the public site when saved.
        </p>
        <select
          id="pricing-country"
          value={selected.countryCode}
          onChange={(e) => onCountryChange(e.target.value)}
          className="w-full h-12 rounded-xl border border-input bg-background px-4 text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {rows.map((r) => (
            <option key={r.countryCode} value={r.countryCode}>
              {r.countryName} ({r.countryCode}) · {r.dialCode}
            </option>
          ))}
        </select>
      </div>

      {/* Selected country highlight */}
      <div className="rounded-3xl border-2 border-primary/25 bg-gradient-to-br from-primary/8 via-card to-card p-6 sm:p-8 shadow-lg shadow-primary/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Your rate
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold">{selected.countryName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {selected.dialCode} · Routed via {selected.provider}
            </p>
          </div>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {selected.countryCode}
          </span>
        </div>

        <div className="mt-8 flex flex-wrap items-end gap-2">
          <span className="text-4xl sm:text-5xl font-bold tabular-nums text-primary tracking-tight">
            {formatPrice(selected.memberPrice, selected.currency)}
          </span>
          <span className="text-lg text-muted-foreground pb-1">/ segment</span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/80 px-4 py-3">
            <Coins className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Credits</p>
              <p className="text-sm font-semibold">{creditsLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/80 px-4 py-3">
            <MessageSquare className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Billing</p>
              <p className="text-sm font-semibold">Pay-as-you-go wallet</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/80 px-4 py-3">
            <Server className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Provider</p>
              <p className="text-sm font-semibold">{selected.provider}</p>
            </div>
          </div>
        </div>

        <ul className="mt-6 space-y-2">
          {[
            "Approved Sender ID recommended for best delivery",
            "Unicode messages may use multiple segments",
            "Top up via Paystack — only pay for messages you send",
          ].map((note) => (
            <li key={note} className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              {note}
            </li>
          ))}
        </ul>
      </div>

      {/* All countries table */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border/60 bg-muted/30">
          <h3 className="font-semibold">All published rates</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            From {formatPrice(lowestPrice, lowestCurrency)} per segment · {rows.length} countries
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Country</th>
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium text-right">Price / segment</th>
                <th className="px-5 py-3 font-medium text-right hidden sm:table-cell">Credits</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Provider</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const active = r.countryCode === selected.countryCode;
                return (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-b border-border/40 last:border-0 transition-colors",
                      active && "bg-primary/5",
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => onCountryChange(r.countryCode)}
                        className={cn(
                          "font-medium text-left hover:text-primary transition-colors",
                          active && "text-primary",
                        )}
                      >
                        {r.countryName}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                      {r.countryCode}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums">
                      {formatPrice(r.memberPrice, r.currency)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-muted-foreground hidden sm:table-cell">
                      {r.creditsPerSms}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                      {r.provider}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <Info className="h-5 w-5 shrink-0 text-primary" />
        <p>
          Logged-in members may see custom rates on their dashboard. Public rates reflect admin
          settings for each country.
        </p>
      </div>
    </div>
  );
}
