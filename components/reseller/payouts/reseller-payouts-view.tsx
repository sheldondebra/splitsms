"use client";

import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  Banknote,
  History,
  Wallet,
} from "lucide-react";
import {
  cancelResellerPayoutAction,
  requestResellerPayoutAction,
} from "@/lib/actions/reseller-settings-payouts";
import type { ResellerPayoutListItem } from "@/lib/reseller/payment-settings";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function money(currency: string, value: number) {
  return `${currency} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusBadge(status: string) {
  if (status === "PAID") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
        Paid
      </Badge>
    );
  }
  if (status === "PENDING") {
    return (
      <Badge variant="outline" className="border-amber-500/40 text-amber-700 dark:text-amber-400">
        Pending
      </Badge>
    );
  }
  if (status === "APPROVED" || status === "PROCESSING") {
    return <Badge variant="secondary">{status}</Badge>;
  }
  if (status === "REJECTED" || status === "CANCELLED") {
    return <Badge variant="destructive">{status}</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

export function ResellerPayoutsView({
  currency,
  balance,
  reserved,
  available,
  hasDetails,
  methodLabel,
  destination,
  history,
  flash,
}: {
  currency: string;
  balance: number;
  reserved: number;
  available: number;
  hasDetails: boolean;
  methodLabel: string;
  destination: string;
  history: ResellerPayoutListItem[];
  flash?: { saved?: string; error?: string };
}) {
  return (
    <ResellerPage className="max-w-5xl">
      <ResellerPageHeader
        title="Payouts"
        description="Request withdrawal of available wallet funds to your mobile money or bank account."
        icon={Banknote}
        actions={
          <Link
            href="/reseller/settings?tab=payout"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Edit payout details
          </Link>
        }
      />

      {flash?.saved === "requested" ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Payout request submitted. Super admins will review and process it.
        </p>
      ) : null}
      {flash?.saved === "cancelled" ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Pending payout cancelled.
        </p>
      ) : null}
      {flash?.saved === "details" ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Payout details updated.
        </p>
      ) : null}
      {flash?.error === "insufficient" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Amount exceeds available balance (wallet minus pending requests).
        </p>
      ) : null}
      {flash?.error === "missing_details" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Add payout destination details in Settings before requesting.
        </p>
      ) : null}
      {flash?.error === "invalid_amount" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Enter a valid amount of at least 1.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <ResellerStatCard label="Wallet balance" value={money(currency, balance)} accent />
        <ResellerStatCard
          label="Reserved (pending)"
          value={money(currency, reserved)}
          hint="Open payout requests"
        />
        <ResellerStatCard
          label="Available to withdraw"
          value={money(currency, available)}
          hint={hasDetails ? methodLabel : "Configure destination first"}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <ResellerCard title="Request payout" description="Funds are sent by SplitSMS finance after approval.">
          {!hasDetails ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 px-5 py-10 text-center">
              <Wallet className="mx-auto h-7 w-7 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">Payout details required</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add your mobile money number or bank account first.
              </p>
              <Link
                href="/reseller/settings?tab=payout"
                className={cn(buttonVariants({ size: "sm" }), "mt-4 gap-1.5")}
              >
                Set payout details
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <form action={requestResellerPayoutAction} className="space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm">
                <p className="font-semibold">{methodLabel}</p>
                <p className="mt-1 text-muted-foreground">{destination}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ({currency})</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  max={available}
                  required
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Available: {money(currency, available)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resellerNote">Note (optional)</Label>
                <Textarea id="resellerNote" name="resellerNote" placeholder="Any note for finance…" />
              </div>
              <Button type="submit" className="gap-1.5" disabled={available < 1}>
                <ArrowDownToLine className="h-4 w-4" />
                Request payout
              </Button>
            </form>
          )}
        </ResellerCard>

        <ResellerCard title="How payouts work" description="Clean process from request to paid">
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                1
              </span>
              <span>Save mobile money or bank details in Settings.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                2
              </span>
              <span>Request a payout from available wallet balance.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                3
              </span>
              <span>Super admin reviews, marks processing, then pays and debits your wallet.</span>
            </li>
          </ol>
        </ResellerCard>
      </div>

      <ResellerCard title="Payout history" description="Track every request and its status">
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
            <History className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">No payout requests yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((row) => (
              <div
                key={row.id}
                className="rounded-2xl border border-border/60 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {statusBadge(row.status)}
                      <Badge variant="outline">{row.method.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="text-sm font-medium">
                      {row.phone ||
                        [row.accountName, row.bankName, row.accountNumber]
                          .filter(Boolean)
                          .join(" · ") ||
                        "Destination on file"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested {formatDate(row.createdAt)}
                      {row.paidAt ? ` · paid ${formatDate(row.paidAt)}` : ""}
                    </p>
                    {row.adminNote ? (
                      <p className="text-xs text-muted-foreground">Admin: {row.adminNote}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <p className="text-lg font-bold tabular-nums">
                      {money(row.currency, row.amount)}
                    </p>
                    {row.status === "PENDING" ? (
                      <form action={cancelResellerPayoutAction}>
                        <input type="hidden" name="payoutId" value={row.id} />
                        <Button type="submit" size="sm" variant="outline">
                          Cancel
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ResellerCard>
    </ResellerPage>
  );
}
