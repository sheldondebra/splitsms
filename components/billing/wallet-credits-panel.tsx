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
import { Tag, Sparkles, AlertCircle } from "lucide-react";

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
    <div className="flex h-full flex-1 flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
        {pricingOptions.length > 1 ? (
          <div className="space-y-1.5 sm:min-w-[160px]">
            <Label htmlFor="wallet-pricing-country" className="text-xs text-muted-foreground">
              Pricing country
            </Label>
            <select
              id="wallet-pricing-country"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
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

      <div className="inline-flex rounded-xl border border-border/60 bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setMode("package")}
          className={cn(
            "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
            mode === "package"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Packages
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={cn(
            "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
            mode === "custom"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
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
                    : "border-border/60 bg-muted/10 hover:border-primary/25",
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
                <p className="mt-2 text-sm font-semibold tabular-nums text-primary">
                  {formatWalletMoney(total, pricingCurrency)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
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
            className="h-12 rounded-xl text-base tabular-nums"
          />
        </div>
      )}

      <div className="space-y-2 rounded-xl border border-border/60 bg-muted/15 p-4">
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
        <div className="flex items-center justify-between border-t border-border/50 pt-2 text-sm">
          <span className="text-muted-foreground">Wallet balance</span>
          <span className="font-medium tabular-nums">
            {formatWalletMoney(walletBalance, currency)}
          </span>
        </div>
        {!canAfford && credits > 0 ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              You need {formatWalletMoney(shortfall, currency)} more in your wallet.{" "}
              <a href="#wallet-topup" className="font-semibold underline underline-offset-2">
                Add money
              </a>{" "}
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
          className="h-12 w-full rounded-xl text-base font-semibold"
        >
          Buy {credits > 0 ? credits.toLocaleString() : ""} credits from wallet
        </Button>
      </form>

      <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Promo code</p>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
          Have a promo code? Apply it for bonus credits or wallet balance.
        </p>
        <form action={applyPromoAction} className="flex flex-col gap-3 sm:flex-row">
          <Input
            name="code"
            placeholder="Enter code"
            className="h-11 flex-1 rounded-xl uppercase"
            autoComplete="off"
          />
          <Button
            type="submit"
            variant="secondary"
            className="h-11 shrink-0 rounded-xl px-8 font-semibold"
          >
            Apply
          </Button>
        </form>
      </div>
    </div>
  );
}
