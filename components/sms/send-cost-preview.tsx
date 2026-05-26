"use client";

import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

function countRecipients(raw: string) {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean).length;
}

export function SendCostPreview({
  message,
  recipientsRaw,
  countryCode = DEFAULT_COUNTRY_CODE,
}: {
  message: string;
  recipientsRaw: string;
  countryCode?: string;
}) {
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);

  const recipientCount = countRecipients(recipientsRaw);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!message.trim() || recipientCount === 0) {
        setEstimate(null);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/billing/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            recipients: Array(recipientCount).fill("+233200000000"),
            countryCode,
          }),
        });
        const data = await res.json();
        if (data.success) setEstimate(data.data);
        else setEstimate(null);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [message, recipientCount, countryCode]);

  if (!message.trim() && recipientCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-5 text-sm text-muted-foreground leading-relaxed">
        <p className="font-medium text-foreground">Cost preview</p>
        <p className="mt-2">Add phone numbers and a message to see segments, credits, and estimated charge.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-5 space-y-4 text-sm shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-foreground">Cost preview</p>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{recipientCount} recipient{recipientCount === 1 ? "" : "s"}</Badge>
        {estimate ? (
          <>
            <Badge variant="outline">{estimate.encoding}</Badge>
            <Badge variant="outline">
              {estimate.segmentsPerMessage} segment{estimate.segmentsPerMessage === 1 ? "" : "s"}/msg
            </Badge>
          </>
        ) : null}
      </div>

      {estimate ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <dt className="text-muted-foreground">Total credits</dt>
          <dd className="font-semibold text-foreground text-right">{estimate.creditsRequired}</dd>
          <dt className="text-muted-foreground">Est. charge</dt>
          <dd className="font-bold text-foreground text-right">
            {estimate.currency} {estimate.totalCharge.toFixed(4)}
          </dd>
          <dt className="text-muted-foreground">Your balance</dt>
          <dd
            className={cn(
              "font-semibold text-right",
              estimate.canAfford ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
            )}
          >
            {estimate.smsCreditBalance} credits
          </dd>
        </dl>
      ) : loading ? (
        <p className="text-xs text-muted-foreground">Calculating…</p>
      ) : (
        <p className="text-xs text-muted-foreground">Enter a message to calculate cost.</p>
      )}

      {estimate?.isCustomPricing ? (
        <p className="text-xs text-primary font-medium">Enterprise pricing applied</p>
      ) : null}

      {estimate && !estimate.canAfford ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 space-y-2">
          <p className="text-xs text-destructive font-medium">Not enough SMS credits</p>
          <Link
            href="/dashboard/wallet"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "w-full gap-2 h-9")}
          >
            <Wallet className="h-3.5 w-3.5" />
            Top up wallet
          </Link>
        </div>
      ) : null}

      <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/60 pt-3">
        Credits are deducted when you send. Failed deliveries are refunded automatically.
      </p>
    </div>
  );
}
