import Link from "next/link";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminAlert,
} from "@/components/admin/admin-page-shell";
import { AdminSignupsChart } from "@/components/admin/admin-signups-chart";
import { MembersSourceChart } from "@/components/admin/members-source-chart";
import { AdminMembersFilters } from "@/components/admin/admin-members-filters";
import { AdminMembersTable } from "@/components/admin/admin-members-table";
import type { AdminMembersDashboard } from "@/lib/admin/members-dashboard";
import { membersListParamsFromSearch } from "@/lib/admin/members-list-url";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BadgeCheck,
  Link2,
  Phone,
  ShieldAlert,
  UserPlus,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function bulkFlashMessage(flash?: {
  saved?: string;
  error?: string;
  count?: string;
  failed?: string;
}) {
  if (!flash?.saved && !flash?.error) return null;

  if (flash.error === "bulk_none") {
    return (
      <AdminAlert variant="warning">Select at least one member before running a bulk action.</AdminAlert>
    );
  }
  if (flash.error === "bulk_notfound") {
    return <AdminAlert variant="warning">Selected members could not be found.</AdminAlert>;
  }
  if (flash.error === "bulk_delete_failed") {
    return (
      <AdminAlert variant="warning">
        Could not delete one or more members — they may have linked records blocking removal.
      </AdminAlert>
    );
  }
  if (flash.error === "bulk_outreach_channel") {
    return <AdminAlert variant="warning">Select at least SMS or email for bulk messaging.</AdminAlert>;
  }
  if (flash.error === "bulk_outreach_sms" || flash.error === "bulk_outreach_email") {
    return <AdminAlert variant="warning">Fill in the message fields before sending.</AdminAlert>;
  }
  if (flash.error === "bulk_invalid") {
    return <AdminAlert variant="warning">Unknown bulk action.</AdminAlert>;
  }

  if (flash.saved?.startsWith("bulk_")) {
    const count = flash.count ?? "0";
    const failed = flash.failed ? Number(flash.failed) : 0;
    const action = flash.saved.replace("bulk_", "");
    const labels: Record<string, string> = {
      verify: "verified",
      unverify: "unverified",
      activate: "activated",
      suspend: "suspended",
      block: "blocked",
      delete: "deleted",
      send_message: "messaged",
    };
    const verb = labels[action] ?? "updated";
    return (
      <AdminAlert variant="success">
        {count} member{count === "1" ? "" : "s"} {verb}.
        {failed > 0 ? ` ${failed} could not be reached (missing contact or delivery failed).` : ""}
      </AdminAlert>
    );
  }

  return null;
}

export function AdminMembersView({
  data,
  flash,
}: {
  data: AdminMembersDashboard;
  flash?: { saved?: string; error?: string; count?: string; failed?: string };
}) {
  const {
    stats,
    signupChart,
    sourceChart,
    rows,
    query,
    source,
    status,
    joined,
    sort,
    country,
    page,
    totalPages,
    filteredTotal,
    countries,
    recentConnect,
  } = data;

  const chartSignups = signupChart.map((d) => ({ date: d.date, signups: d.signups }));
  const bulkFlash = bulkFlashMessage(flash);
  const rangeStart = filteredTotal === 0 ? 0 : (page - 1) * data.pageSize + 1;
  const rangeEnd = Math.min(page * data.pageSize, filteredTotal);
  const verifiedPct =
    stats.totalMembers > 0
      ? Math.round((stats.verifiedMembers / stats.totalMembers) * 100)
      : 0;

  const metricItems = [
    {
      label: "Total members",
      value: stats.totalMembers.toLocaleString(),
      hint: null as string | null,
      icon: Users,
      hot: true as boolean,
      warn: false,
    },
    {
      label: "External platforms",
      value: stats.externalTotal.toLocaleString(),
      hint: `Connect ${stats.connectCount} · WP ${stats.wordpressCount} · Reseller ${stats.resellerCount}`,
      icon: Link2,
      hot: false,
      warn: false,
    },
    {
      label: "New (7 days)",
      value: stats.newLast7.toLocaleString(),
      hint: null,
      icon: UserPlus,
      hot: false,
      warn: false,
    },
    {
      label: "Verified",
      value: stats.verifiedMembers.toLocaleString(),
      hint: stats.totalMembers > 0 ? `${verifiedPct}% of all` : null,
      icon: BadgeCheck,
      hot: false,
      warn: false,
    },
    {
      label: "Suspended",
      value: stats.suspendedMembers.toLocaleString(),
      hint: null,
      icon: ShieldAlert,
      hot: false,
      warn: stats.suspendedMembers > 0,
    },
  ];

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Members"
        description="Search, filter, and manage member accounts from Connect, WordPress, reseller, and direct signups."
        icon={Users}
        actions={
          <Link href="/admin/analytics" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Analytics
          </Link>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="grid grid-cols-2 xl:grid-cols-5 divide-x divide-y xl:divide-y-0 divide-border/50">
          {metricItems.map(({ label, value, hint, icon: Icon, hot, warn }) => (
            <div
              key={label}
              className={cn(
                "flex items-start gap-2.5 px-3.5 py-3.5 min-w-0",
                hot && "bg-primary/[0.04]",
                warn && "bg-amber-500/[0.04]",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                  hot
                    ? "bg-primary/12 text-primary"
                    : warn
                      ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                      : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-lg font-bold tabular-nums leading-none",
                    hot && "text-primary",
                    warn && "text-amber-700 dark:text-amber-300",
                  )}
                >
                  {value}
                </p>
                <p className="mt-1 text-[11px] font-medium leading-tight text-foreground">{label}</p>
                {hint && (
                  <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{hint}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Signups — last 30 days</CardTitle>
            <CardDescription>New member accounts per day</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminSignupsChart data={chartSignups} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Acquisition source</CardTitle>
            <CardDescription>How members joined the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <MembersSourceChart data={sourceChart} total={stats.totalMembers} />
          </CardContent>
        </Card>
      </div>

      {recentConnect.length > 0 && (
        <AdminCard
          title="Recent Connect provisions"
          description="Customers created via Connect API under a partner account"
          dense
          actions={
            <Link
              href="/admin/members?source=connect"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View all Connect
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/10">
            <ul className="divide-y divide-border/40">
              {recentConnect.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/admin/members/${c.customerId}`}
                    className="group flex items-start gap-3 px-3.5 py-3 transition-colors hover:bg-background/70"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sky-500/12 text-sky-700 dark:text-sky-300">
                      <Link2 className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {c.customerName}
                        </p>
                        <p className="text-[10px] text-muted-foreground shrink-0">
                          {formatDistanceToNow(c.createdAt, { addSuffix: true })}
                        </p>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                        <span className="min-w-0 truncate">{c.customerPhone}</span>
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                        {c.externalRef && (
                          <span className="rounded-md border border-border/60 bg-background/80 px-1.5 py-0.5 font-mono">
                            ref: {c.externalRef}
                          </span>
                        )}
                        <span>via {c.partnerName}</span>
                      </div>
                    </div>
                    <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </AdminCard>
      )}

      <AdminMembersFilters
        params={membersListParamsFromSearch({
          q: query,
          source,
          status,
          country,
          joined,
          sort,
          page: String(page),
        })}
        countries={countries}
        filteredTotal={filteredTotal}
      />

      {bulkFlash}

      <AdminCard
        title="Member directory"
        description={
          filteredTotal === 0
            ? "No members match your filters"
            : `Showing ${rangeStart}–${rangeEnd} of ${filteredTotal.toLocaleString()}`
        }
      >
        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No members match this filter.</p>
        ) : (
          <AdminMembersTable
            rows={rows}
            query={query ?? ""}
            source={source}
            status={status}
            joined={joined}
            sort={sort}
            country={country}
            page={page}
            totalPages={totalPages}
          />
        )}
      </AdminCard>
    </AdminPage>
  );
}
