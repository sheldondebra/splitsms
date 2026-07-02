import Link from "next/link";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminStatCard,
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
import { Users, Link2 } from "lucide-react";

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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard label="Total members" value={stats.totalMembers.toLocaleString()} variant="primary" />
        <AdminStatCard
          label="External platforms"
          value={stats.externalTotal.toLocaleString()}
          hint={`Connect ${stats.connectCount} · WP ${stats.wordpressCount} · Reseller ${stats.resellerCount}`}
        />
        <AdminStatCard label="New (7 days)" value={stats.newLast7} />
        <AdminStatCard
          label="Verified"
          value={stats.verifiedMembers.toLocaleString()}
          hint={
            stats.totalMembers > 0
              ? `${Math.round((stats.verifiedMembers / stats.totalMembers) * 100)}% of all`
              : undefined
          }
        />
        <AdminStatCard
          label="Suspended"
          value={stats.suspendedMembers}
          variant={stats.suspendedMembers > 0 ? "warning" : "default"}
        />
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
        <Card className="border-violet-500/20 bg-violet-500/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4 text-violet-600" />
              Recent Connect provisions
            </CardTitle>
            <CardDescription>Customers created via Connect API under a partner account</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {recentConnect.map((c) => (
                <li key={c.id} className="rounded-lg border border-border/60 bg-card px-3 py-2.5 text-sm">
                  <p className="font-medium truncate">{c.customerName}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{c.customerPhone}</p>
                  <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                    {c.externalRef && (
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono">ref: {c.externalRef}</span>
                    )}
                    <span>via {c.partnerName}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
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
