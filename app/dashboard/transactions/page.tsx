import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { AppPage, PageHeader, AppCard } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeftRight } from "lucide-react";

const typeLabels: Record<string, string> = {
  WALLET_TOPUP: "Deposit",
  SMS_DEBIT: "SMS debit",
  CREDIT_PURCHASE: "Credit purchase",
  REFUND: "Refund",
  ADMIN_ADJUSTMENT: "Adjustment",
  PROMO_CREDIT: "Promo credit",
};

export default async function TransactionsPage() {
  const session = await getSession();
  if (!session) return null;

  const [wallet, transactions] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: session.userId } }),
    prisma.transaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const deposits = transactions.filter((t) => t.type === "WALLET_TOPUP");
  const debits = transactions.filter((t) => t.type === "SMS_DEBIT");
  const refunds = transactions.filter((t) => t.type === "REFUND");

  return (
    <AppPage>
      <PageHeader
        title="Transactions"
        description="Wallet funding, SMS deductions, refunds, and bonuses"
        icon={ArrowLeftRight}
        mobileDescription="Full history of wallet and SMS activity."
      />

      <div className="grid grid-cols-3 gap-2 md:gap-4 md:grid-cols-3">
        <AppCard>
          <CardHeader className="pb-1 md:pb-2">
            <CardTitle className="text-[10px] md:text-sm text-muted-foreground font-medium">
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg md:text-2xl font-bold tabular-nums pb-4 md:pb-6">
            {wallet?.currency} {wallet?.balance.toString() ?? "0"}
          </CardContent>
        </AppCard>
        <AppCard>
          <CardHeader className="pb-1 md:pb-2">
            <CardTitle className="text-[10px] md:text-sm text-muted-foreground font-medium">
              Top-ups
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg md:text-2xl font-bold pb-4 md:pb-6">
            {deposits.length}
          </CardContent>
        </AppCard>
        <AppCard>
          <CardHeader className="pb-1 md:pb-2">
            <CardTitle className="text-[10px] md:text-sm text-muted-foreground font-medium">
              Debits
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg md:text-2xl font-bold pb-4 md:pb-6">
            {debits.length}
          </CardContent>
        </AppCard>
      </div>

      <ul className="md:hidden divide-y divide-border/60 rounded-2xl border border-border/60 bg-card overflow-hidden">
        {transactions.map((t) => (
          <li key={t.id} className="flex justify-between gap-3 px-4 py-3.5 text-sm">
            <div className="min-w-0">
              <p className="font-medium truncate">{typeLabels[t.type] ?? t.type}</p>
              <p className="text-xs text-muted-foreground">
                {t.createdAt.toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold tabular-nums">
                {t.currency} {t.amount.toString()}
              </p>
              {t.credits != null && (
                <p className="text-xs text-muted-foreground">{t.credits} cr</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <AppCard className="hidden md:block">
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="app-scroll-x overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {t.createdAt.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{typeLabels[t.type] ?? t.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {t.currency} {t.amount.toString()}
                  </TableCell>
                  <TableCell>{t.credits ?? "—"}</TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                    {t.description ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </AppCard>

      {refunds.length > 0 && (
        <p className="text-xs text-muted-foreground text-center md:text-left">
          {refunds.length} refund(s) on record — failed SMS credits returned automatically.
        </p>
      )}
    </AppPage>
  );
}
