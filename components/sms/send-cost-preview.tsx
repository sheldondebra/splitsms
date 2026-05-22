"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

type Estimate = {
  segmentsPerMessage: number;
  recipientCount: number;
  totalSegments: number;
  encoding: string;
  totalCharge: number;
  creditsRequired: number;
  smsCreditBalance: number;
  canAfford: boolean;
  currency: string;
  isCustomPricing: boolean;
};

export function SendCostPreview({
  countryCode = "GH",
}: {
  unitPrice?: number;
  countryCode?: string;
}) {
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState("1");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!body.trim()) {
        setEstimate(null);
        return;
      }
      const count = recipients
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter(Boolean).length || 1;
      setLoading(true);
      try {
        const res = await fetch("/api/billing/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: body,
            recipients: Array(count).fill("+233200000000"),
            countryCode,
          }),
        });
        const data = await res.json();
        if (data.success) setEstimate(data.data);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [body, recipients, countryCode]);

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3 text-sm">
      <p className="font-medium text-primary">Cost calculator</p>
      <textarea
        className="w-full h-16 rounded border bg-background p-2 text-xs"
        placeholder="Type message to preview segments & cost…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div>
        <label className="text-xs text-muted-foreground">Recipient count</label>
        <input
          type="number"
          min={1}
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          className="mt-1 h-8 w-full rounded border bg-background px-2"
        />
      </div>
      {loading && <p className="text-xs text-muted-foreground">Calculating…</p>}
      {estimate && (
        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
          <span>Encoding</span>
          <Badge variant="outline">{estimate.encoding}</Badge>
          <span>Segments / msg</span>
          <span className="text-foreground font-medium">{estimate.segmentsPerMessage}</span>
          <span>Total credits</span>
          <span className="text-foreground font-medium">{estimate.creditsRequired}</span>
          <span>Est. charge</span>
          <span className="text-foreground font-bold">
            {estimate.currency} {estimate.totalCharge.toFixed(4)}
          </span>
          <span>Your credits</span>
          <span className={estimate.canAfford ? "text-green-600" : "text-destructive"}>
            {estimate.smsCreditBalance}
          </span>
        </div>
      )}
      {estimate?.isCustomPricing && (
        <p className="text-xs text-primary">Custom enterprise pricing applied</p>
      )}
      {!estimate?.canAfford && estimate && (
        <p className="text-xs text-destructive">
          Insufficient SMS credits. Top up wallet and buy credits.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Credits deducted before send. Failed messages auto-refunded.
      </p>
    </div>
  );
}
