import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function InvoicesPage() {
  const session = await getSession();
  if (!session) return null;

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { payment: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <Link
          href="/api/dashboard/invoices/export"
          className="text-sm text-primary font-medium"
        >
          Export CSV
        </Link>
      </div>
      <Card>
        <CardHeader><CardTitle>Transaction history</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {transactions.map((t) => (
            <div key={t.id} className="flex justify-between border-b py-3">
              <div>
                <p className="font-medium">{t.type.replace(/_/g, " ")}</p>
                <p className="text-muted-foreground">
                  {t.createdAt.toLocaleDateString()} · INV-{t.id.slice(0, 8).toUpperCase()}
                </p>
                {t.description && (
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {t.currency} {t.amount.toString()}
                </p>
                {t.credits && <Badge variant="outline">{t.credits} credits</Badge>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
