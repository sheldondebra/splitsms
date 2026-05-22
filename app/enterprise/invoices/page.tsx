import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function EnterpriseInvoicesPage() {
  const session = await getSession();
  if (!session) return null;

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  const enterprise = await prisma.enterpriseAccount.findUnique({
    where: { userId: session.userId },
    include: { credit: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invoices & billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monthly invoicing and postpaid credit (foundation)
        </p>
      </div>

      {enterprise?.credit && (
        <Card>
          <CardHeader>
            <CardTitle>Credit line</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              Available: {enterprise.credit.currency}{" "}
              {(
                enterprise.credit.creditLimit.toNumber() -
                enterprise.credit.usedCredit.toNumber()
              ).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            invoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between border-b pb-2 text-sm"
              >
                <span>{inv.invoiceNo}</span>
                <span>
                  {inv.currency} {inv.amount.toNumber().toFixed(2)}
                </span>
                <Badge variant="outline">{inv.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
