"use client";

import Link from "next/link";
import { Banknote } from "lucide-react";
import { adminUpdateResellerPayoutAction } from "@/lib/actions/reseller-settings-payouts";
import { AdminPage, AdminPageHeader, AdminCard, AdminStatCard } from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AdminPayoutItem = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  phone: string | null;
  accountName: string | null;
  bankName: string | null;
  accountNumber: string | null;
  resellerNote: string | null;
  adminNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  paidAt: string | null;
  resellerId: string;
  businessName: string;
  brandName: string | null;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string | null;
};

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

export function AdminResellerPayoutsView({
  pendingCount,
  items,
  flash,
}: {
  pendingCount: number;
  items: AdminPayoutItem[];
  flash?: { saved?: string; error?: string };
}) {
  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Reseller payouts"
        description="Review and settle reseller withdrawal requests against their wallet balances."
        icon={Banknote}
      />
      <h1 className="text-2xl font-bold tracking-tight">Reseller payouts</h1>

      {flash?.saved ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Payout updated ({flash.saved}).
        </p>
      ) : null}
      {flash?.error === "insufficient_wallet" ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Reseller wallet balance is too low to mark this payout as paid.
        </p>
      ) : null}
      {flash?.error === "already_closed" ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          This payout is already closed.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="Pending requests" value={pendingCount} />
        <AdminStatCard label="Visible rows" value={items.length} />
        <AdminStatCard
          label="Open amount"
          value={money(
            "GHS",
            items
              .filter((i) => ["PENDING", "APPROVED", "PROCESSING"].includes(i.status))
              .reduce((s, i) => s + i.amount, 0),
          )}
        />
      </div>

      <AdminCard title="Payout queue" description="Approve, process, pay, or reject each request.">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No payout requests yet.</p>
        ) : (
          <div className="space-y-4">
            {items.map((row) => {
              const destination =
                row.method === "MOBILE_MONEY"
                  ? row.phone || "No phone"
                  : [row.accountName, row.bankName, row.accountNumber].filter(Boolean).join(" · ");
              const closed = ["PAID", "REJECTED", "CANCELLED"].includes(row.status);

              return (
                <div key={row.id} className="rounded-2xl border border-border/60 p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={row.status === "PENDING" ? "outline" : "secondary"}>
                          {row.status}
                        </Badge>
                        <Badge variant="outline">{row.method.replace(/_/g, " ")}</Badge>
                        <Link
                          href={`/admin/resellers/${row.resellerId}`}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          {row.brandName || row.businessName}
                        </Link>
                      </div>
                      <p className="text-sm">
                        {row.ownerName} · {row.ownerPhone}
                        {row.ownerEmail ? ` · ${row.ownerEmail}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">{destination}</p>
                      <p className="text-xs text-muted-foreground">
                        Requested {formatDate(row.createdAt)}
                        {row.paidAt ? ` · paid ${formatDate(row.paidAt)}` : ""}
                      </p>
                      {row.resellerNote ? (
                        <p className="text-xs text-muted-foreground">Note: {row.resellerNote}</p>
                      ) : null}
                      {row.adminNote ? (
                        <p className="text-xs text-muted-foreground">Admin: {row.adminNote}</p>
                      ) : null}
                    </div>

                    <div className="w-full max-w-sm space-y-3">
                      <p className="text-right text-2xl font-bold tabular-nums">
                        {money(row.currency, row.amount)}
                      </p>
                      {!closed ? (
                        <form action={adminUpdateResellerPayoutAction} className="space-y-3">
                          <input type="hidden" name="payoutId" value={row.id} />
                          <div className="space-y-2">
                            <Label htmlFor={`note-${row.id}`}>Admin note</Label>
                            <Input
                              id={`note-${row.id}`}
                              name="adminNote"
                              defaultValue={row.adminNote ?? ""}
                              placeholder="Reference, MoMo receipt, etc."
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {row.status === "PENDING" ? (
                              <button
                                type="submit"
                                name="status"
                                value="APPROVED"
                                className={cn(
                                  buttonVariants({ size: "sm", variant: "outline" }),
                                )}
                              >
                                Approve
                              </button>
                            ) : null}
                            {["PENDING", "APPROVED"].includes(row.status) ? (
                              <button
                                type="submit"
                                name="status"
                                value="PROCESSING"
                                className={cn(
                                  buttonVariants({ size: "sm", variant: "outline" }),
                                )}
                              >
                                Processing
                              </button>
                            ) : null}
                            <button
                              type="submit"
                              name="status"
                              value="PAID"
                              className={cn(buttonVariants({ size: "sm" }))}
                            >
                              Mark paid
                            </button>
                            <button
                              type="submit"
                              name="status"
                              value="REJECTED"
                              className={cn(buttonVariants({ size: "sm", variant: "destructive" }))}
                            >
                              Reject
                            </button>
                          </div>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
