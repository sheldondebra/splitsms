"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Percent,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";
import {
  clearResellerPricingAction,
  setResellerPricingAction,
} from "@/lib/actions/reseller";
import {
  ResellerCard,
  ResellerPage,
  ResellerPageHeader,
  ResellerStatCard,
} from "@/components/reseller/reseller-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type PricingCountryRow = {
  code: string;
  name: string;
  dialCode: string;
  currency: string;
  costPrice: number;
  memberPrice: number;
  sellPrice: number | null;
  isCustom: boolean;
  suggestedPrice: number;
};

function money(currency: string, value: number, digits = 4) {
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

function marginPct(sell: number, cost: number) {
  if (sell <= 0) return 0;
  return Math.round(((sell - cost) / sell) * 100);
}

function PricingRow({
  row,
  highlight,
}: {
  row: PricingCountryRow;
  highlight?: boolean;
}) {
  const current = row.sellPrice ?? row.suggestedPrice;
  const [sellPrice, setSellPrice] = useState(String(current));
  const parsed = Number(sellPrice);
  const valid = Number.isFinite(parsed) && parsed > 0;
  const margin = valid ? parsed - row.costPrice : 0;
  const belowCost = valid && parsed < row.costPrice;
  const pct = valid ? marginPct(parsed, row.costPrice) : 0;

  const apply = (value: number) => {
    setSellPrice(value.toFixed(4));
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        highlight
          ? "border-primary/40 bg-primary/5"
          : "border-border/60 bg-card hover:border-primary/20",
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{row.name}</h3>
            <Badge variant="outline">{row.code}</Badge>
            {row.isCustom ? (
              <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
                Custom rate
              </Badge>
            ) : (
              <Badge variant="secondary">Using suggestion</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Dial {row.dialCode} · Platform cost {money(row.currency, row.costPrice)} · SplitSMS
            retail {money(row.currency, row.memberPrice)}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => apply(row.costPrice * 1.2)}
              className="rounded-lg border border-border/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:border-primary/30 hover:text-primary"
            >
              +20%
            </button>
            <button
              type="button"
              onClick={() => apply(row.costPrice * 1.4)}
              className="rounded-lg border border-border/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:border-primary/30 hover:text-primary"
            >
              +40%
            </button>
            <button
              type="button"
              onClick={() => apply(row.memberPrice)}
              className="rounded-lg border border-border/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:border-primary/30 hover:text-primary"
            >
              Match retail
            </button>
            <button
              type="button"
              onClick={() => apply(row.suggestedPrice)}
              className="inline-flex items-center gap-1 rounded-lg border border-border/60 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:border-primary/30 hover:text-primary"
            >
              <Sparkles className="h-3 w-3" />
              Suggested
            </button>
          </div>
        </div>

        <form action={setResellerPricingAction} className="w-full max-w-md space-y-3">
          <input type="hidden" name="countryCode" value={row.code} />
          <input type="hidden" name="currency" value={row.currency} />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor={`sell-${row.code}`}>Your sell price / segment</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  {row.currency}
                </span>
                <Input
                  id={`sell-${row.code}`}
                  name="sellPrice"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  required
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  className="pl-12 font-mono tabular-nums"
                />
              </div>
            </div>
            <Button type="submit" disabled={!valid} className="sm:mb-0.5">
              Save
            </Button>
          </div>

          <div
            className={cn(
              "rounded-xl border px-3 py-2 text-xs",
              belowCost
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-border/60 bg-muted/25 text-muted-foreground",
            )}
          >
            {valid ? (
              belowCost ? (
                <span>
                  Below platform cost by {money(row.currency, row.costPrice - parsed)}. You would
                  lose money on every SMS.
                </span>
              ) : (
                <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-semibold text-foreground">
                    Margin {money(row.currency, margin)}
                  </span>
                  <span>· ~{pct}% of sell price</span>
                  <span>· Earns on every client SMS to {row.code}</span>
                </span>
              )
            ) : (
              <span>Enter a sell price above 0.</span>
            )}
          </div>
        </form>
      </div>

      {row.isCustom ? (
        <form action={clearResellerPricingAction} className="mt-3 border-t border-border/50 pt-3">
          <input type="hidden" name="countryCode" value={row.code} />
          <Button type="submit" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" />
            Clear custom rate
          </Button>
        </form>
      ) : null}
    </div>
  );
}

export function ResellerPricingView({
  rows,
  flash,
}: {
  rows: PricingCountryRow[];
  flash?: { saved?: string; error?: string; country?: string };
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "custom" | "unset">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter === "custom" && !row.isCustom) return false;
      if (filter === "unset" && row.isCustom) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.code.toLowerCase().includes(q) ||
        row.dialCode.toLowerCase().includes(q)
      );
    });
  }, [filter, query, rows]);

  const customCount = rows.filter((r) => r.isCustom).length;
  const avgMargin =
    rows.length === 0
      ? 0
      : rows.reduce((sum, r) => {
          const sell = r.sellPrice ?? r.suggestedPrice;
          return sum + Math.max(0, sell - r.costPrice);
        }, 0) / rows.length;

  const priority = useMemo(() => {
    const preferred = ["GH", "NG", "GLOBAL", "US", "GB"];
    return [...rows].sort((a, b) => {
      const ai = preferred.indexOf(a.code);
      const bi = preferred.indexOf(b.code);
      if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [rows]);

  const display = useMemo(() => {
    const ids = new Set(filtered.map((r) => r.code));
    return priority.filter((r) => ids.has(r.code));
  }, [filtered, priority]);

  return (
    <ResellerPage className="max-w-5xl">
      <ResellerPageHeader
        title="Pricing"
        description="Set what your clients pay per SMS segment. Your margin is sell price minus platform cost."
        icon={Percent}
        actions={
          <Link href="/reseller/wallet" className={cn(buttonVariants({ variant: "outline" }), "gap-1.5")}>
            Fund clients
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {flash?.saved === "1" ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Pricing saved{flash.country ? ` for ${flash.country}` : ""}.
          </span>
        </p>
      ) : null}
      {flash?.saved === "cleared" ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Custom rate cleared{flash.country ? ` for ${flash.country}` : ""}. Clients will use the
          suggested fallback.
        </p>
      ) : null}
      {flash?.error === "invalid" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Enter a valid sell price greater than zero.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <ResellerStatCard label="Countries" value={rows.length} accent />
        <ResellerStatCard
          label="Custom rates set"
          value={customCount}
          hint={`${rows.length - customCount} still on suggested price`}
        />
        <ResellerStatCard
          label="Avg margin / SMS"
          value={money(rows[0]?.currency ?? "GHS", avgMargin)}
          hint="Across visible country rates"
        />
      </div>

      <ResellerCard
        title="How pricing works"
        description="Keep it simple — pick a sell price above platform cost."
      >
        <div className="grid gap-3 sm:grid-cols-3 text-sm text-muted-foreground">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="font-semibold text-foreground">1. Platform cost</p>
            <p className="mt-1 text-xs leading-relaxed">
              What SplitSMS charges your reseller wallet when clients send.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="font-semibold text-foreground">2. Your sell price</p>
            <p className="mt-1 text-xs leading-relaxed">
              What your clients pay per segment in their dashboard and API.
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="font-semibold text-foreground">3. Your margin</p>
            <p className="mt-1 text-xs leading-relaxed">
              Sell − cost. Collected as commission you can payout from Wallet.
            </p>
          </div>
        </div>
      </ResellerCard>

      <ResellerCard
        title="Country rates"
        description="Search a country, use a quick markup, then save. Start with Ghana and Nigeria if you are unsure."
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country, code, or dial…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "All"],
                ["custom", "Custom"],
                ["unset", "Not set"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                  filter === id
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:bg-muted/40",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {display.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
            <Percent className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">No countries match</p>
            <p className="mt-1 text-xs text-muted-foreground">Clear search or switch filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {display.map((row) => (
              <PricingRow
                key={row.code}
                row={row}
                highlight={flash?.country === row.code}
              />
            ))}
          </div>
        )}
      </ResellerCard>
    </ResellerPage>
  );
}
