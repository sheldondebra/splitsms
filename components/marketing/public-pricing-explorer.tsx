"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  MessageSquare,
  Coins,
  Info,
  CheckCircle2,
  Search,
  ChevronRight,
  Wallet,
} from "lucide-react";
import type { PublicPricingRow } from "@/lib/billing/public-pricing";
import { pickPricingRow } from "@/lib/billing/public-pricing";
import { formatRowPrice } from "@/lib/billing/pricing-format";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PublicPricingExplorerProps = {
  rows: PublicPricingRow[];
  selectedCode: string;
  lowestPrice: number;
  lowestCurrency: string;
};

const QUICK_COUNTRIES = ["GH", "NG", "US", "GB", "KE", "ZA"];

export function PublicPricingExplorer({
  rows,
  selectedCode,
}: PublicPricingExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  const countryFromUrl = searchParams.get("country");
  const selected = pickPricingRow(rows, countryFromUrl ?? selectedCode);

  function onCountryChange(code: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("country", code);
    router.push(`/pricing?${params.toString()}`, { scroll: false });
    setQuery("");
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.countryName.toLowerCase().includes(q) ||
        r.countryCode.toLowerCase().includes(q) ||
        r.dialCode.includes(q),
    );
  }, [rows, query]);

  const lowest =
    rows.length > 0
      ? rows.reduce((min, r) => (r.memberPrice < min.memberPrice ? r : min), rows[0])
      : null;

  if (!selected) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/30 px-6 py-12 text-center">
        <p className="text-muted-foreground text-sm">
          Pricing is being configured. Please check back soon or{" "}
          <Link href="/support" className="text-primary hover:underline">
            contact support
          </Link>
          .
        </p>
        <Link href="/support" className={cn(buttonVariants({ className: "mt-4" }))}>
          Get support
        </Link>
      </div>
    );
  }

  const creditsLabel =
    selected.creditsPerSms === 1
      ? "1 credit per segment"
      : `${selected.creditsPerSms} credits per segment`;

  const quickPicks = QUICK_COUNTRIES.map((code) => rows.find((r) => r.countryCode === code)).filter(
    Boolean,
  ) as PublicPricingRow[];

  return (
    <div className="space-y-6">
      {/* Main panel: picker + selected rate */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* Country picker */}
          <div className="p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-border/60 bg-muted/20">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Globe className="h-4 w-4 text-primary shrink-0" />
              Choose destination
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Search by country name, code, or dial prefix.
            </p>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="e.g. Ghana, GB, +233…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 pl-9 rounded-xl bg-background"
                aria-label="Search countries"
              />
            </div>

            {quickPicks.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {quickPicks.map((r) => (
                  <button
                    key={r.countryCode}
                    type="button"
                    onClick={() => onCountryChange(r.countryCode)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      r.countryCode === selected.countryCode
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/40 hover:text-primary",
                    )}
                  >
                    {r.countryCode}
                  </button>
                ))}
              </div>
            )}

            <ul
              className="mt-4 max-h-[280px] overflow-y-auto rounded-xl border border-border/60 bg-background divide-y divide-border/40"
              role="listbox"
              aria-label="Countries"
            >
              {filtered.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No countries match your search.
                </li>
              ) : (
                filtered.map((r) => {
                  const active = r.countryCode === selected.countryCode;
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => onCountryChange(r.countryCode)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted/50",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="font-medium block truncate">{r.countryName}</span>
                          <span className="text-xs text-muted-foreground">
                            {r.dialCode} · {r.countryCode}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="font-semibold tabular-nums block">
                            {formatRowPrice(r)}
                          </span>
                          {active && <ChevronRight className="h-4 w-4 ml-auto mt-0.5 opacity-60" />}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          {/* Selected rate summary */}
          <div className="p-5 sm:p-8 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Selected rate
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold">{selected.countryName}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {selected.dialCode} · {selected.countryCode}
            </p>

            <div className="mt-6 flex flex-wrap items-end gap-2">
              <span className="text-4xl sm:text-[2.75rem] font-bold tabular-nums text-primary leading-none">
                {formatRowPrice(selected)}
              </span>
              <span className="text-base text-muted-foreground pb-1">/ segment</span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
                <Coins className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Credits</p>
                  <p className="text-sm font-semibold">{creditsLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
                <Wallet className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Billing</p>
                  <p className="text-sm font-semibold">Pay-as-you-go</p>
                </div>
              </div>
            </div>

            <ul className="mt-5 space-y-2">
              {[
                "No monthly fees — top up when you need credits",
                "Unicode messages may use multiple segments",
                "Sender ID approval recommended for best delivery",
              ].map((note) => (
                <li key={note} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  {note}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "mt-6 w-full sm:w-auto gap-2 orange-glow")}
            >
              Start with 5 free credits
              <MessageSquare className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* All rates — compact table / mobile cards */}
      <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border/60 bg-muted/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-semibold text-sm">All rates</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {rows.length} destinations
              {lowest ? ` · from ${formatRowPrice(lowest)}` : ""}
            </p>
          </div>
          {!query && (
            <p className="text-xs text-muted-foreground">Tap a row to switch country</p>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground bg-muted/15">
                <th className="px-5 py-3 font-medium">Country</th>
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium text-right">Price</th>
                <th className="px-5 py-3 font-medium text-right">Credits</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const active = r.countryCode === selected.countryCode;
                return (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-b border-border/40 last:border-0 transition-colors cursor-pointer",
                      active ? "bg-primary/5" : "hover:bg-muted/30",
                    )}
                    onClick={() => onCountryChange(r.countryCode)}
                  >
                    <td className={cn("px-5 py-3 font-medium", active && "text-primary")}>
                      {r.countryName}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {r.countryCode}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">
                      {formatRowPrice(r)}
                    </td>
                    <td className="px-5 py-3 text-right text-muted-foreground">
                      {r.creditsPerSms}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border/40 max-h-[420px] overflow-y-auto">
          {rows.map((r) => {
            const active = r.countryCode === selected.countryCode;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onCountryChange(r.countryCode)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left",
                  active ? "bg-primary/5" : "active:bg-muted/50",
                )}
              >
                <div className="min-w-0">
                  <p className={cn("font-medium truncate", active && "text-primary")}>
                    {r.countryName}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.countryCode} · {r.dialCode}</p>
                </div>
                <p className="font-semibold tabular-nums shrink-0">{formatRowPrice(r)}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 rounded-xl border border-border/60 bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
        <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />
        <p>
          Logged-in members may see custom rates in their dashboard. Prices update when admin
          settings change.
        </p>
      </div>
    </div>
  );
}
