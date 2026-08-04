"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CreditCard, Loader2, Smartphone, Building2, Banknote } from "lucide-react";

export type PaymentMethodOption = {
  value: string;
  label: string;
  description: string;
  available: boolean;
  category?: "online" | "offline";
};

const PRESET_AMOUNTS = [10, 25, 50, 100, 200, 500];

const METHOD_ICONS: Record<string, typeof CreditCard> = {
  PAYSTACK: CreditCard,
  FLUTTERWAVE: CreditCard,
  MTN_MOMO: Smartphone,
  MANUAL: Building2,
  STRIPE: CreditCard,
};

export type StripeFxPreview = {
  walletCurrency: string;
  chargeCurrency: string;
  rate: number;
  fetchedAt: string;
  source: string;
};

export function WalletTopupClient({
  currency,
  paymentMethods,
  offlineBankDetails,
  defaultMethod,
  stripeFxPreview,
  returnPath = "/dashboard/wallet",
}: {
  currency: string;
  paymentMethods: PaymentMethodOption[];
  offlineBankDetails: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch?: string;
    swiftCode?: string;
    instructions: string;
  };
  defaultMethod?: string;
  stripeFxPreview?: StripeFxPreview;
  /** Where to send the user after checkout (default member wallet). */
  returnPath?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(() => {
    if (defaultMethod && paymentMethods.some((m) => m.value === defaultMethod && m.available)) {
      return defaultMethod;
    }
    return paymentMethods.find((m) => m.available)?.value ?? "PAYSTACK";
  });
  const [offline, setOffline] = useState({
    payerName: "",
    payerPhone: "",
    bankName: "",
    reference: "",
    paidAt: "",
    note: "",
  });

  const availableMethods = paymentMethods.filter((m) => m.available);
  const numAmount = Number(amount);
  const stripeChargePreview =
    method === "STRIPE" &&
    stripeFxPreview &&
    numAmount > 0 &&
    Number.isFinite(numAmount)
      ? Math.round(numAmount * stripeFxPreview.rate * 100) / 100
      : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Enter a valid amount");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          method,
          returnPath,
          offline: method === "MANUAL" ? offline : undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? "Payment could not be started. Try again.");
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      if (data.instructions) {
        setError(data.instructions);
        return;
      }
      if (method === "MANUAL") {
        window.location.href = `${returnPath}?submitted=manual&payment=${data.paymentId}`;
        return;
      }
      window.location.href = `${returnPath}?payment=${data.paymentId}`;
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Amount ({currency})</Label>
        <div className="flex flex-wrap gap-2.5">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className={cn(
                "rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                amount === String(preset)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted/50",
              )}
            >
              {currency} {preset}
            </button>
          ))}
        </div>
        <Input
          name="amount"
          type="number"
          min="1"
          step="0.01"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Custom amount"
          className="h-12 text-base tabular-nums"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-semibold">Payment method</Label>
        {availableMethods.length === 0 ? (
          <p className="text-sm text-muted-foreground rounded-xl border border-dashed p-6 leading-relaxed">
            No payment methods are configured. Contact support for manual top-up.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 sm:auto-rows-fr">
            {paymentMethods.map((m) => {
              const Icon = METHOD_ICONS[m.value] ?? Banknote;
              const selected = method === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  disabled={!m.available}
                  onClick={() => m.available && setMethod(m.value)}
                  className={cn(
                    "flex h-full min-h-[5.5rem] items-start gap-3 rounded-xl border p-4 sm:p-5 text-left transition-all",
                    !m.available && "opacity-40 cursor-not-allowed",
                    selected
                      ? "border-primary bg-primary/8 ring-1 ring-primary/30"
                      : "border-border/60 hover:border-primary/25",
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", selected ? "text-primary" : "text-muted-foreground")} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{m.label}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{m.description}</p>
                    {!m.available ? (
                      <p className="text-[10px] text-muted-foreground mt-1">Unavailable</p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <input type="hidden" name="method" value={method} />
      </div>

      {method === "STRIPE" && stripeFxPreview && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-relaxed">
          <p className="font-medium text-foreground">Pay in Ghana Cedis, charged in USD</p>
          <p className="text-muted-foreground mt-1">
            Your wallet is credited in {currency}. Stripe checkout is charged in{" "}
            {stripeFxPreview.chargeCurrency} using the current Google exchange rate.
          </p>
          {stripeChargePreview != null && (
            <p className="mt-2 font-medium tabular-nums">
              {currency} {numAmount.toFixed(2)} ≈ {stripeFxPreview.chargeCurrency}{" "}
              {stripeChargePreview.toFixed(2)}
            </p>
          )}
        </div>
      )}

      {method === "MANUAL" && (
        <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold">Offline payment details</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {offlineBankDetails.instructions}
            </p>
          </div>
          <div className="rounded-lg border border-border/60 bg-background p-3 text-xs space-y-1">
            <p><strong>Bank:</strong> {offlineBankDetails.bankName}</p>
            <p><strong>Account name:</strong> {offlineBankDetails.accountName}</p>
            <p><strong>Account number:</strong> {offlineBankDetails.accountNumber}</p>
            {offlineBankDetails.branch && <p><strong>Branch:</strong> {offlineBankDetails.branch}</p>}
            {offlineBankDetails.swiftCode && <p><strong>SWIFT:</strong> {offlineBankDetails.swiftCode}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Payer full name</Label>
              <Input
                value={offline.payerName}
                onChange={(e) => setOffline((s) => ({ ...s, payerName: e.target.value }))}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Payer phone</Label>
              <Input
                value={offline.payerPhone}
                onChange={(e) => setOffline((s) => ({ ...s, payerPhone: e.target.value }))}
                placeholder="+233..."
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bank used</Label>
              <Input
                value={offline.bankName}
                onChange={(e) => setOffline((s) => ({ ...s, bankName: e.target.value }))}
                placeholder="Your bank"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Transfer reference</Label>
              <Input
                value={offline.reference}
                onChange={(e) => setOffline((s) => ({ ...s, reference: e.target.value }))}
                placeholder="TRX12345"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date & time paid</Label>
              <Input
                type="datetime-local"
                value={offline.paidAt}
                onChange={(e) => setOffline((s) => ({ ...s, paidAt: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Note (optional)</Label>
              <Input
                value={offline.note}
                onChange={(e) => setOffline((s) => ({ ...s, note: e.target.value }))}
                placeholder="Any extra payment note"
              />
            </div>
          </div>
        </div>
      )}

      {error ? (
        <p className="text-sm text-destructive rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 leading-relaxed">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={loading || availableMethods.length === 0}
        className="h-12 w-full rounded-xl font-semibold text-base gap-2 mt-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Redirecting to payment…
          </>
        ) : (
          <>Continue to payment</>
        )}
      </Button>

      <p className="text-sm text-muted-foreground text-center leading-relaxed pt-1">
        Funds appear in your wallet after payment is confirmed. Then choose an SMS package on the
        right.
      </p>
    </form>
  );
}
