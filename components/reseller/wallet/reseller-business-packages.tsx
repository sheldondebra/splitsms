"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Coins,
  Percent,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { buyResellerCreditsAction } from "@/lib/actions/reseller";
import {
  SMS_CREDIT_PACKAGES,
  formatWalletMoney,
  packageTotalCost,
} from "@/lib/billing/sms-packages";
import type { ResellerPackageCountryPricing } from "@/lib/reseller/package-pricing";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ResellerBusinessPackages({
  walletBalance,
  pricingOptions,
  defaultCountryCode,
  smsCredits,
}: {
  walletBalance: number;
  pricingOptions: ResellerPackageCountryPricing[];
  defaultCountryCode: string;
  smsCredits: number;
}) {
  const [countryCode, setCountryCode] = useState(
    pricingOptions.some((p) => p.countryCode === defaultCountryCode)
      ? defaultCountryCode
      : (pricingOptions[0]?.countryCode ?? "GH"),
  );
  const [selectedPackageId, setSelectedPackageId] = useState("growth");

  const pricing = useMemo(
    () => pricingOptions.find((p) => p.countryCode === countryCode) ?? pricingOptions[0],
    [pricingOptions, countryCode],
  );

  const selected = SMS_CREDIT_PACKAGES.find((p) => p.id === selectedPackageId);
  const credits = selected?.credits ?? 0;
  const buyCost = pricing ? packageTotalCost(credits, pricing.wholesalePrice) : 0;
  const sellRevenue = pricing ? packageTotalCost(credits, pricing.sellPrice) : 0;
  const profit = Math.round((sellRevenue - buyCost) * 100) / 100;
  const canAfford = walletBalance >= buyCost && credits > 0;
  const shortfall = Math.max(0, buyCost - walletBalance);
  const currency = pricing?.currency ?? "GHS";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="size-5 text-primary" />
            <p className="text-base font-semibold">Buy SMS packages</p>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-xl">
            Stock credits at your wholesale rate. Profit is estimated from the sell price you set
            under Pricing — if clients use every SMS in the package.
          </p>
        </div>
        {pricingOptions.length > 1 ? (
          <div className="space-y-1.5 sm:min-w-[170px]">
            <Label htmlFor="reseller-pkg-country" className="text-xs text-muted-foreground">
              Country rate
            </Label>
            <select
              id="reseller-pkg-country"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              {pricingOptions.map((p) => (
                <option key={p.countryCode} value={p.countryCode}>
                  {p.countryName} ({p.countryCode})
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {pricing ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Your buy rate
            </p>
            <p className="mt-1 text-sm font-bold tabular-nums">
              {formatWalletMoney(pricing.wholesalePrice, currency)}
              <span className="text-xs font-normal text-muted-foreground"> /SMS</span>
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Your sell rate
            </p>
            <p className="mt-1 text-sm font-bold tabular-nums">
              {formatWalletMoney(pricing.sellPrice, currency)}
              <span className="text-xs font-normal text-muted-foreground"> /SMS</span>
            </p>
            {!pricing.isCustomSell ? (
              <p className="mt-0.5 text-[10px] text-amber-700 dark:text-amber-400">
                Using platform default — set your rate in Pricing
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              Margin / SMS
            </p>
            <p className="mt-1 text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {formatWalletMoney(pricing.profitPerSms, currency)}
              <span className="text-xs font-normal opacity-80"> · {pricing.marginPct}%</span>
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SMS_CREDIT_PACKAGES.map((pkg) => {
          const pkgBuy = pricing ? packageTotalCost(pkg.credits, pricing.wholesalePrice) : 0;
          const pkgSell = pricing ? packageTotalCost(pkg.credits, pricing.sellPrice) : 0;
          const pkgProfit = Math.round((pkgSell - pkgBuy) * 100) / 100;
          const active = selectedPackageId === pkg.id;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setSelectedPackageId(pkg.id)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all",
                active
                  ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                  : "border-border/60 hover:border-primary/30 hover:bg-muted/20",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{pkg.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{pkg.description}</p>
                </div>
                {pkg.popular ? (
                  <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Popular</Badge>
                ) : null}
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums">
                {pkg.credits.toLocaleString()}
                <span className="ml-1 text-sm font-medium text-muted-foreground">SMS</span>
              </p>
              <p className="mt-1 text-sm font-semibold tabular-nums">
                Buy {formatWalletMoney(pkgBuy, currency)}
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="size-3.5" />
                Profit if sold all: {formatWalletMoney(pkgProfit, currency)}
              </p>
            </button>
          );
        })}
      </div>

      {selected && pricing ? (
        <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <p className="text-sm font-semibold">
              {selected.name} · {credits.toLocaleString()} SMS
            </p>
            <Badge variant="secondary" className="gap-1">
              <Percent className="size-3" />
              {pricing.marginPct}% margin
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">You pay</p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {formatWalletMoney(buyCost, currency)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                If clients buy all
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {formatWalletMoney(sellRevenue, currency)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                Your profit
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatWalletMoney(profit, currency)}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Inventory today: <span className="font-semibold text-foreground tabular-nums">{smsCredits.toLocaleString()}</span> SMS.
            After purchase you can fund clients from Wallet or let them buy at your sell rate.
            {" "}
            <Link href="/reseller/pricing" className="text-primary hover:underline">
              Adjust sell rates
            </Link>
          </p>

          {!canAfford && credits > 0 ? (
            <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              Need {formatWalletMoney(shortfall, currency)} more in your wallet. Top up on the left,
              then buy this package.
            </p>
          ) : null}

          <form action={buyResellerCreditsAction}>
            <input type="hidden" name="credits" value={credits} />
            <input type="hidden" name="countryCode" value={countryCode} />
            <Button type="submit" disabled={!canAfford} className="w-full sm:w-auto gap-2">
              <Coins className="size-4" />
              Buy {credits.toLocaleString()} SMS · {formatWalletMoney(buyCost, currency)}
            </Button>
          </form>
        </div>
      ) : null}

      {pricingOptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No country pricing is configured yet. Contact support or check{" "}
          <Link href="/reseller/pricing" className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}>
            Pricing
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
