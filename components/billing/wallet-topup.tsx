"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WalletTopupClient({ publicKey }: { publicKey?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = e.currentTarget;
    const amount = Number(new FormData(form).get("amount"));
    const method = String(new FormData(form).get("method"));

    try {
      const res = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? "Payment failed");
        return;
      }
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      window.location.href = `/dashboard/wallet?payment=${data.paymentId}`;
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {publicKey && (
        <p className="text-xs text-muted-foreground">Paystack public key configured</p>
      )}
      <div>
        <Label>Amount ({/* currency shown server-side */})</Label>
        <Input name="amount" type="number" min="1" step="0.01" required />
      </div>
      <div>
        <Label>Payment method</Label>
        <select
          name="method"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          defaultValue="PAYSTACK"
        >
          <option value="PAYSTACK">Paystack</option>
          <option value="FLUTTERWAVE">Flutterwave</option>
          <option value="MTN_MOMO">MTN Mobile Money</option>
          <option value="MANUAL">Manual bank transfer</option>
        </select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Processing…" : "Continue to payment"}
      </Button>
    </form>
  );
}
