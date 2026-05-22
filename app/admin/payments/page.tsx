import { approvePaymentAction } from "@/lib/actions/wallet";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminPaymentsPage() {
  const payments = await prisma.payment.findMany({
    where: { status: "PENDING" },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payments</h1>
      <Card>
        <CardHeader><CardTitle>Pending approval</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between border-b py-3">
              <div>
                <p className="font-medium">{p.user.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {p.method} — {p.currency} {p.amount.toString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{p.status}</Badge>
                {p.method === "MANUAL" && (
                  <form action={approvePaymentAction}>
                    <input type="hidden" name="paymentId" value={p.id} />
                    <Button size="sm" type="submit">Approve</Button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
