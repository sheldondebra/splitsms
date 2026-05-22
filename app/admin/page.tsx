import Link from "next/link";
import { getAdminDashboardOverview } from "@/lib/analytics/admin-dashboard";
import {
  AdminPage,
  AdminPageHeader,
  AdminStatCard,
  AdminAlert,
  AdminCard,
} from "@/components/admin/admin-page-shell";
import { AdminVolumeChart } from "@/components/dashboard/admin-volume-chart";
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
} from "lucide-react";

const quickActions: {
  href: string;
  label: string;
  icon: typeof Users;
  accent?: "pending-payments" | "pending-sender";
}[] = [
  { href: "/admin/sender-ids", label: "Sender IDs", icon: BadgeCheck, accent: "pending-sender" },
  { href: "/admin/payments", label: "Payments", icon: CreditCard, accent: "pending-payments" },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/pricing", label: "SMS pricing", icon: DollarSign },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/mnotify", label: "Gateway setup", icon: Radio },
];

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardOverview();

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Overview"
        description="Platform health, revenue, messaging volume, and items needing attention."
        icon={LayoutDashboard}
      />

      {!stats.mnotify.configured && (
        <AdminAlert variant="warning">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-semibold">SMS gateway not configured</p>
              <p className="text-xs mt-1 opacity-90">
                Add your mNotify API key to enable OTP and bulk SMS platform-wide.
              </p>
            </div>
            <Link href="/admin/mnotify" className={cn(buttonVariants({ size: "sm" }))}>
              Configure now
            </Link>
          </div>
        </AdminAlert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Members"
          value={stats.members.toLocaleString()}
          hint="Registered accounts"
          variant="primary"
        />
        <AdminStatCard
          label="SMS today"
          value={stats.messagesToday.toLocaleString()}
          hint={`${stats.messages.toLocaleString()} all-time`}
          trend="up"
        />
        <AdminStatCard
          label="Revenue"
          value={`GHS ${stats.totalRevenue.toFixed(2)}`}
          hint="Top-ups & credit purchases"
        />
        <AdminStatCard
          label="Failed SMS"
          value={stats.failedMessages.toLocaleString()}
          hint={`${stats.failureRate}% failure rate`}
          variant={stats.failureRate > 5 ? "danger" : "default"}
          trend={stats.failureRate > 5 ? "down" : "neutral"}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard
          label="Pending payments"
          value={stats.pendingPayments}
          variant={stats.pendingPayments > 0 ? "warning" : "default"}
        />
        <AdminStatCard
          label="Sender ID requests"
          value={stats.pendingSenderIds}
          variant={stats.pendingSenderIds > 0 ? "warning" : "default"}
        />
        <AdminStatCard
          label="Active campaigns"
          value={stats.activeCampaigns}
          hint="Sending or scheduled"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <AdminCard title="Platform SMS volume" description="Last 14 days">
            <AdminVolumeChart data={stats.dailyVolume} />
          </AdminCard>

          <AdminCard title="Quick actions" description="Common admin tasks">
            <div className="grid gap-2 sm:grid-cols-2">
              {quickActions.map(({ href, label, icon: Icon, accent }) => {
                const count =
                  accent === "pending-payments"
                    ? stats.pendingPayments
                    : accent === "pending-sender"
                      ? stats.pendingSenderIds
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
                      <Badge variant="secondary" className="bg-amber-500/15 text-amber-800 dark:text-amber-200">
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
          <AdminCard
            title="Provider"
            description={stats.mnotify.configured ? "Gateway connected" : "Setup required"}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  stats.mnotify.configured ? "bg-emerald-500" : "bg-amber-500 animate-pulse",
                )}
              />
              <span className="text-sm font-medium">
                {stats.providerHealth === "healthy" ? "Operational" : "Needs configuration"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Run <code className="text-[10px] bg-muted px-1 rounded">npm run worker:sms</code> with
              Redis for live queue processing.
            </p>
          </AdminCard>

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
                  <li key={p.id} className="text-sm border-b border-border/40 pb-3 last:border-0 last:pb-0">
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
    </AdminPage>
  );
}
