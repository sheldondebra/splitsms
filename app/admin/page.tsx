import Link from "next/link";
import { getAdminDashboardOverview } from "@/lib/analytics/admin-dashboard";
import { getAdminOperationsDashboard } from "@/lib/admin/operations-dashboard";
import { getAdminReportsOverview } from "@/lib/admin/messages-dashboard";
import { getCreditCoverSnapshot } from "@/lib/admin/credit-cover-dashboard";
import { AdminOperationsPanel } from "@/components/admin/admin-operations-panel";
import { AdminPlatformOverview } from "@/components/admin/admin-platform-overview";
import {
  AdminPage,
  AdminPageHeader,
  AdminStatCard,
  AdminAlert,
  AdminCard,
} from "@/components/admin/admin-page-shell";
import { ProviderBalancesPanel } from "@/components/admin/provider-balances-panel";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BadgeCheck,
  CreditCard,
  DollarSign,
  BarChart3,
  Radio,
  ArrowRight,
  TrendingUp,
  FileText,
  Megaphone,
  LifeBuoy,
} from "lucide-react";

const quickActions: {
  href: string;
  label: string;
  icon: typeof Users;
  accent?: "pending-payments" | "pending-sender" | "open-support";
}[] = [
  { href: "/admin/sender-ids", label: "Sender IDs", icon: BadgeCheck, accent: "pending-sender" },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, accent: "pending-payments" },
  { href: "/admin/support", label: "Support", icon: LifeBuoy, accent: "open-support" },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/forms", label: "Smart Forms", icon: FileText },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/pricing", label: "SMS pricing", icon: DollarSign },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/providers", label: "Providers", icon: Radio },
];

function parseFlashParam(value: string | undefined) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    systemSync?: string;
    processed?: string;
    sent?: string;
    failed?: string;
    remaining?: string;
    dlr?: string;
    scheduled?: string;
    resumed?: string;
    balances?: string;
  }>;
}) {
  const params = await searchParams;
  const [stats, operations, sms] = await Promise.all([
    getAdminDashboardOverview(),
    getAdminOperationsDashboard(),
    getAdminReportsOverview(),
  ]);
  const creditCover = await getCreditCoverSnapshot(stats.providerBalances);

  const systemSyncRan = params.systemSync === "1";

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Overview"
        description="Platform health, revenue, messaging volume, and items needing attention."
        icon={LayoutDashboard}
        actions={
          operations.counts.attention > 0 ? (
            <Link
              href="/admin/operations"
              className={cn(buttonVariants({ size: "sm" }), "gap-1")}
            >
              {operations.counts.attention} in queue
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : undefined
        }
      />

      {systemSyncRan && (
        <AdminAlert variant="success">
          System sync complete: processed {parseFlashParam(params.processed) ?? 0} pending SMS,{" "}
          {parseFlashParam(params.sent) ?? 0} sent, {parseFlashParam(params.failed) ?? 0} failed,{" "}
          {parseFlashParam(params.dlr) ?? 0} delivery update
          {(parseFlashParam(params.dlr) ?? 0) === 1 ? "" : "s"},{" "}
          {parseFlashParam(params.scheduled) ?? 0} scheduled campaign
          {(parseFlashParam(params.scheduled) ?? 0) === 1 ? "" : "s"} started,{" "}
          {parseFlashParam(params.resumed) ?? 0} due paused campaign
          {(parseFlashParam(params.resumed) ?? 0) === 1 ? "" : "s"} resumed, and{" "}
          {parseFlashParam(params.balances) ?? 0} provider balance
          {(parseFlashParam(params.balances) ?? 0) === 1 ? "" : "s"} checked.
        </AdminAlert>
      )}

      {!stats.mnotify.configured && (
        <AdminAlert variant="warning">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-semibold">SMS gateway not configured</p>
              <p className="text-xs mt-1 opacity-90">
                Add your mNotify API key to enable OTP and bulk SMS platform-wide.
              </p>
            </div>
            <Link href="/admin/providers" className={cn(buttonVariants({ size: "sm" }))}>
              Configure now
            </Link>
          </div>
        </AdminAlert>
      )}

      <ProviderBalancesPanel balances={stats.providerBalances} compact />

      <AdminPlatformOverview
        stats={stats}
        operations={operations}
        sms={sms}
        creditCover={creditCover}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Revenue"
          value={`GHS ${stats.totalRevenue.toFixed(2)}`}
          hint="Top-ups & credit purchases"
          variant="primary"
        />
        <AdminStatCard
          label="Open support"
          value={stats.openSupportTickets}
          variant={stats.openSupportTickets > 0 ? "warning" : "default"}
          href="/admin/support"
        />
        <AdminStatCard
          label="Pending payments"
          value={stats.pendingPayments}
          variant={stats.pendingPayments > 0 ? "warning" : "default"}
          href="/admin/payments"
        />
        <AdminStatCard
          label="Sender ID requests"
          value={stats.pendingSenderIds}
          variant={stats.pendingSenderIds > 0 ? "warning" : "default"}
          href="/admin/sender-ids"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <AdminCard title="Quick actions" description="Common admin tasks">
            <div className="grid gap-2 sm:grid-cols-2">
              {quickActions.map(({ href, label, icon: Icon, accent }) => {
                const count =
                  accent === "pending-payments"
                    ? stats.pendingPayments
                    : accent === "pending-sender"
                      ? stats.pendingSenderIds
                      : accent === "open-support"
                        ? stats.openSupportTickets
                        : 0;
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 rounded-xl border border-border/60 px-4 py-3.5 hover:border-primary/30 hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="flex-1 font-medium text-sm">{label}</span>
                    {count > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-amber-500/15 text-amber-800 dark:text-amber-200"
                      >
                        {count}
                      </Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                );
              })}
            </div>
          </AdminCard>
        </div>

        <div className="space-y-6">
          <AdminCard title="Recent members">
            {stats.recentMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members yet.</p>
            ) : (
              <ul className="divide-y divide-border/50 -mx-1">
                {stats.recentMembers.map((m) => (
                  <li key={m.id} className="flex justify-between gap-2 py-3 first:pt-0 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{m.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.phone}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold tabular-nums">
                        {m.smsCredit?.balance ?? 0} cr
                      </p>
                      {m.isVerified && (
                        <Badge variant="outline" className="text-[10px] mt-0.5">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/admin/members"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-3 hover:underline"
            >
              View all members
              <ArrowRight className="h-3 w-3" />
            </Link>
          </AdminCard>

          <AdminCard title="Pending payments">
            {stats.recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                All clear
              </p>
            ) : (
              <ul className="space-y-3">
                {stats.recentPayments.map((p) => (
                  <li
                    key={p.id}
                    className="text-sm border-b border-border/40 pb-3 last:border-0 last:pb-0"
                  >
                    <p className="font-medium">{p.user.fullName}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.currency} {p.amount.toString()} · {p.method}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-3 hover:underline"
            >
              Review payments
              <ArrowRight className="h-3 w-3" />
            </Link>
          </AdminCard>
        </div>
      </div>

      <AdminOperationsPanel data={operations} compact />
    </AdminPage>
  );
}
