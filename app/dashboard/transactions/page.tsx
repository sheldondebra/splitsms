import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const typeLabels: Record<string, string> = {
  WALLET_TOPUP: "Deposit",
  SMS_DEBIT: "SMS debit",
  CREDIT_PURCHASE: "Credit purchase",
  REFUND: "Refund",
  ADMIN_ADJUSTMENT: "Adjustment",
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
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Wallet funding, SMS deductions, refunds, and bonuses
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Wallet balance</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {wallet?.currency} {wallet?.balance.toString() ?? "0"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Top-ups</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{deposits.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">SMS debits</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{debits.length}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
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
      </Card>

      {refunds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {refunds.length} refund(s) on record — failed SMS credits returned automatically.
        </p>
      )}
    </div>
  );
}
