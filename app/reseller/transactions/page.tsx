import { getSession } from "@/lib/auth/session";
import { requireApprovedReseller } from "@/lib/reseller/context";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ResellerTransactionsPage() {
  const session = await getSession();
  if (!session) return null;

  const reseller = await requireApprovedReseller(session.userId);
  if (!reseller) redirect("/reseller");

  const [transactions, commissions] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.resellerCommission.findMany({
      where: { resellerId: reseller.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-2xl font-bold">Transactions</h1>

      <Card>
        <CardHeader>
          <CardTitle>Commissions earned</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {commissions.map((c) => (
            <div key={c.id} className="flex justify-between border-b py-2">
              <span>{c.source}</span>
              <span className="font-medium">
                {c.currency} {c.amount.toString()}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wallet activity</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {transactions.map((t) => (
            <div key={t.id} className="flex justify-between border-b py-2">
              <div>
                <Badge variant="outline">{t.type.replace(/_/g, " ")}</Badge>
                <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
              </div>
              <span>
                {t.currency} {t.amount.toString()}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
