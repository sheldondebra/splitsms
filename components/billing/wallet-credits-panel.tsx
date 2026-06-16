"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { buyCreditsAction, applyPromoAction } from "@/lib/actions/wallet";
import {
  SMS_CREDIT_PACKAGES,
  formatWalletMoney,
  packageTotalCost,
} from "@/lib/billing/sms-packages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Coins, Tag, Sparkles, AlertCircle } from "lucide-react";

export type WalletPricingOption = {
  countryCode: string;
  countryName: string;
  pricePerCredit: number;
  currency: string;
};

type WalletCreditsPanelProps = {
  currency: string;
  walletBalance: number;
  pricingOptions: WalletPricingOption[];
  defaultCountryCode: string;
};

export function WalletCreditsPanel({
  currency,
  walletBalance,
  pricingOptions,
  defaultCountryCode,
}: WalletCreditsPanelProps) {
  const [countryCode, setCountryCode] = useState(
    pricingOptions.some((p) => p.countryCode === defaultCountryCode)
      ? defaultCountryCode
      : (pricingOptions[0]?.countryCode ?? "GH"),
  );
  const [selectedPackageId, setSelectedPackageId] = useState<string>("growth");
  const [customCredits, setCustomCredits] = useState("");
  const [mode, setMode] = useState<"package" | "custom">("package");

  const pricing = useMemo(
    () => pricingOptions.find((p) => p.countryCode === countryCode) ?? pricingOptions[0],
    [pricingOptions, countryCode],
  );

  const selectedPackage = SMS_CREDIT_PACKAGES.find((p) => p.id === selectedPackageId);
  const credits =
    mode === "custom"
      ? Math.max(0, Math.floor(Number(customCredits) || 0))
      : (selectedPackage?.credits ?? 0);

  const pricePerCredit = pricing?.pricePerCredit ?? 0;
  const pricingCurrency = pricing?.currency ?? currency;
  const totalCost = packageTotalCost(credits, pricePerCredit);
  const canAfford = walletBalance >= totalCost && credits > 0;
  const shortfall = Math.max(0, totalCost - walletBalance);

  return (
    <div className="flex flex-col gap-5 flex-1 h-full">
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 sm:p-6 space-y-5 flex-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <Coins className="h-5 w-5 text-primary" />
              <p className="text-base font-semibold">Buy SMS credits</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Choose a package or enter a custom amount. Credits are deducted when you send SMS.
            </p>
          </div>
          {pricingOptions.length > 1 ? (
            <div className="space-y-1.5 sm:min-w-[160px]">
              <Label htmlFor="wallet-pricing-country" className="text-xs text-muted-foreground">
                Pricing country
              </Label>
              <select
                id="wallet-pricing-country"
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

        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Your rate: </span>
          <span className="font-semibold tabular-nums">
            {formatWalletMoney(pricePerCredit, pricingCurrency)} per credit
          </span>
          <span className="text-muted-foreground"> · </span>
          <Link href="/dashboard/pricing" className="font-medium text-primary hover:underline">
            View all rates
          </Link>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("package")}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              mode === "package"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            Packages
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              mode === "custom"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            Custom amount
          </button>
        </div>

        {mode === "package" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {SMS_CREDIT_PACKAGES.map((pkg) => {
              const total = packageTotalCost(pkg.credits, pricePerCredit);
              const selected = selectedPackageId === pkg.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={cn(
                    "relative rounded-xl border p-4 text-left transition-all",
                    selected
                      ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                      : "border-border/60 bg-background hover:border-primary/25",
                  )}
                >
                  {pkg.popular ? (
                    <Badge className="absolute -top-2 right-3 gap-1 text-[10px]">
                      <Sparkles className="h-3 w-3" />
                      Popular
                    </Badge>
                  ) : null}
                  <p className="font-semibold">{pkg.name}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">
                    {pkg.credits.toLocaleString()}
                    <span className="ml-1 text-sm font-medium text-muted-foreground">credits</span>
                  </p>
                  <p className="mt-2 text-sm font-semibold text-primary tabular-nums">
                    {formatWalletMoney(total, pricingCurrency)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {pkg.description}
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="custom-credits">Number of credits</Label>
            <Input
              id="custom-credits"
              type="number"
              min={1}
              step={1}
              value={customCredits}
              onChange={(e) => setCustomCredits(e.target.value)}
              placeholder="e.g. 250"
              className="h-12 text-base tabular-nums"
            />
          </div>
        )}

        <div className="rounded-xl border border-border/60 bg-background p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Credits</span>
            <span className="font-semibold tabular-nums">{credits.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total cost</span>
            <span className="font-semibold tabular-nums">
              {formatWalletMoney(totalCost, pricingCurrency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm border-t border-border/50 pt-2">
            <span className="text-muted-foreground">Wallet balance</span>
            <span className="font-medium tabular-nums">
              {formatWalletMoney(walletBalance, currency)}
            </span>
          </div>
          {!canAfford && credits > 0 ? (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                You need {formatWalletMoney(shortfall, currency)} more in your wallet. Add money
                first, then buy credits.
              </p>
            </div>
          ) : null}
        </div>

        <form action={buyCreditsAction}>
          <input type="hidden" name="credits" value={credits} />
          <input type="hidden" name="countryCode" value={countryCode} />
          <Button
            type="submit"
            disabled={!canAfford}
            className="h-12 w-full rounded-xl font-semibold text-base"
          >
            Buy {credits > 0 ? credits.toLocaleString() : ""} credits from wallet
          </Button>
        </form>
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 sm:p-6">
        <div className="flex items-center gap-2.5 mb-3">
          <Tag className="h-5 w-5 text-primary" />
          <p className="text-base font-semibold">Promo code</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          Have a promo code? Apply it for bonus credits or wallet balance.
        </p>
        <form action={applyPromoAction} className="flex flex-col gap-3 sm:flex-row">
          <Input
            name="code"
            placeholder="Enter code"
            className="h-11 flex-1 uppercase"
            autoComplete="off"
          />
          <Button type="submit" variant="secondary" className="h-11 shrink-0 rounded-xl px-8 font-semibold">
            Apply
          </Button>
        </form>
      </div>
    </div>
  );
}
