import Link from "next/link";
import { ArrowLeft, Smartphone } from "lucide-react";
import { prisma } from "@/lib/db";
import { AdminPage, AdminPageHeader } from "@/components/admin/admin-page-shell";
import { ManualPaymentView } from "@/components/admin/manual-payment-view";

export default async function AdminManualPaymentPage() {
  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    select: { id: true, fullName: true, phone: true },
    orderBy: { fullName: "asc" },
    take: 500,
  });

  return (
    <AdminPage>
      <AdminPageHeader
        title="Manual payment"
        description="Collect a mobile money payment by phone and credit a member's wallet."
        icon={Smartphone}
        actions={
          <Link
            href="/admin/payments"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Payments
          </Link>
        }
      />
      <ManualPaymentView
        members={members.map((m) => ({ id: m.id, label: `${m.fullName} · ${m.phone}`, phone: m.phone }))}
      />
    </AdminPage>
  );
}
