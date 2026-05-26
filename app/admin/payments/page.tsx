import { approvePaymentAction } from "@/lib/actions/wallet";
import { prisma } from "@/lib/db";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminEmpty,
  AdminListRow,
} from "@/components/admin/admin-page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";

export default async function AdminPaymentsPage() {
  const payments = await prisma.payment.findMany({
    where: { status: "PENDING" },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminPage>
      <AdminPageHeader
        title="Payments"
        description="Approve manual top-ups and review pending wallet deposits."
        icon={CreditCard}
      />

      <AdminCard
        title="Pending approval"
        description={
          payments.length === 0
            ? "Queue is empty"
            : `${payments.length} payment${payments.length !== 1 ? "s" : ""}`
        }
      >
        {payments.length === 0 ? (
          <AdminEmpty>No payments awaiting approval.</AdminEmpty>
        ) : (
          <div className="-my-1">
            {payments.map((p) => (
              <AdminListRow key={p.id}>
                <div>
                  <p className="font-medium">{p.user.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.method} — {p.currency} {p.amount.toString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.user.phone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{p.status}</Badge>
                  {p.method === "MANUAL" && (
                    <form action={approvePaymentAction}>
                      <input type="hidden" name="paymentId" value={p.id} />
                      <Button size="sm" type="submit">
                        Approve
                      </Button>
                    </form>
                  )}
                </div>
              </AdminListRow>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
