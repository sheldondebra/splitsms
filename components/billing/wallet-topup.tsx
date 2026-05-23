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
};

const PRESET_AMOUNTS = [10, 25, 50, 100, 200, 500];

const METHOD_ICONS: Record<string, typeof CreditCard> = {
  PAYSTACK: CreditCard,
  FLUTTERWAVE: CreditCard,
  MTN_MOMO: Smartphone,
  MANUAL: Building2,
  STRIPE: CreditCard,
};

export function WalletTopupClient({
  currency,
  paymentMethods,
}: {
  currency: string;
  paymentMethods: PaymentMethodOption[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(
    paymentMethods.find((m) => m.available)?.value ?? "PAYSTACK",
  );

  const availableMethods = paymentMethods.filter((m) => m.available);

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
        body: JSON.stringify({ amount: numAmount, method }),
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
      if (method === "MANUAL") {
        window.location.href = "/dashboard/wallet?submitted=manual";
        return;
      }
      window.location.href = `/dashboard/wallet?payment=${data.paymentId}`;
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
        Funds appear in your wallet after payment is confirmed. Then buy SMS credits below.
      </p>
    </form>
  );
}
