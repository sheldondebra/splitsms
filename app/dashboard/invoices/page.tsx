import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Receipt, Wallet } from "lucide-react";
import { AppPage, PageHeader, AppCard } from "@/components/dashboard/page-shell";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TX_LABELS: Record<string, string> = {
  WALLET_TOPUP: "Added money",
  CREDIT_PURCHASE: "Bought message credits",
  SMS_DEBIT: "Balance used for messages",
  REFUND: "Refund",
  ADMIN_ADJUSTMENT: "Balance adjustment",
  PROMO_CREDIT: "Promo bonus",
  RESELLER_SUB_FUND: "Sub-user funding",
};

const STATUS_LABELS: Record<string, string> = {
  PAID: "Paid",
  DRAFT: "Draft",
  VOID: "Void",
};

export default async function InvoicesPage() {
  const session = await getSession();
  if (!session) return null;

  let invoices: Awaited<ReturnType<typeof prisma.invoice.findMany>> = [];
  let transactions: Awaited<ReturnType<typeof prisma.transaction.findMany>> = [];
  let loadError: string | null = null;

  try {
    [invoices, transactions] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.transaction.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);
  } catch (e) {
    console.error("[invoices]", e);
    loadError =
      "Billing records could not be loaded. Restart the dev server (Ctrl+C, then npm run dev) and try again.";
  }

  return (
    <AppPage narrow>
      <PageHeader
        title="Billing history"
        description="Invoices and payment receipts for your account"
        icon={Receipt}
        mobileDescription="Invoices and recent payments."
        actions={
          <Link
            href="/api/dashboard/invoices/export"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 w-full md:w-auto md:h-10 inline-flex items-center justify-center",
            )}
          >
            Download CSV
          </Link>
        }
      />

      {loadError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}

      <AppCard>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loadError && invoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No invoices yet"
              description="Invoices are created automatically when you add money to your wallet."
              actionLabel="Add money"
              actionHref="/dashboard/wallet"
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-mono font-medium text-sm">{inv.invoiceNo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {inv.createdAt.toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold tabular-nums">
                      {inv.currency} {inv.amount.toNumber().toFixed(2)}
                    </p>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {STATUS_LABELS[inv.status] ?? inv.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </AppCard>

      <AppCard>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            Recent payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loadError && transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No transactions yet.
            </p>
          ) : (
            <ul className="divide-y divide-border/60 text-sm">
              {transactions.map((t) => (
                <li key={t.id} className="flex justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {TX_LABELS[t.type] ?? t.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t.createdAt.toLocaleDateString()}
                      {t.reference ? ` · ${t.reference}` : ""}
                    </p>
                    {t.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold tabular-nums">
                      {t.currency} {t.amount.toNumber().toFixed(2)}
                    </p>
                    {t.credits != null && t.credits > 0 && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        +{t.credits} credits
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/dashboard/transactions"
            className="block text-center text-sm font-medium text-primary hover:underline mt-4 pt-2"
          >
            View all transactions
          </Link>
        </CardContent>
      </AppCard>
    </AppPage>
  );
}
