import Link from "next/link";
import { getAdminOperationsDashboard } from "@/lib/admin/operations-dashboard";
import { AdminOperationsPanel } from "@/components/admin/admin-operations-panel";
import {
  AdminPage,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Activity, CreditCard, BadgeCheck, LifeBuoy, ShieldAlert, Store } from "lucide-react";

const shortcuts = [
  { href: "/admin/payments", label: "Payments", icon: CreditCard, countKey: "payments" as const },
  { href: "/admin/sender-ids", label: "Sender IDs", icon: BadgeCheck, countKey: "senderIds" as const },
  { href: "/admin/support", label: "Support", icon: LifeBuoy, countKey: "support" as const },
  { href: "/admin/fraud", label: "Fraud", icon: ShieldAlert, countKey: "fraud" as const },
  { href: "/admin/resellers", label: "Resellers", icon: Store, countKey: "resellers" as const },
];

export default async function AdminOperationsPage() {
  const data = await getAdminOperationsDashboard();

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Operations"
        description="Unified inbox for platform health, queue status, and items that need your attention."
        icon={Activity}
      />

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {shortcuts.map(({ href, label, icon: Icon, countKey }) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/30 hover:bg-muted/20 transition-colors group"
          >
            <Icon className="h-4 w-4 text-primary mb-2" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="text-xl font-bold tabular-nums mt-1">{data.counts[countKey]}</p>
          </Link>
        ))}
        <AdminStatCard
          label="Total attention"
          value={data.counts.attention}
          variant={data.counts.attention > 0 ? "warning" : "primary"}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <AdminOperationsPanel data={data} />

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/providers" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Providers
        </Link>
        <Link href="/admin/routes" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Routes
        </Link>
        <Link href="/admin/analytics" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          Analytics
        </Link>
      </div>
    </AdminPage>
  );
}
