import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { AdminSignupsChart } from "@/components/admin/admin-signups-chart";
import { MembersSourceChart } from "@/components/admin/members-source-chart";
import { AdminMembersFilters } from "@/components/admin/admin-members-filters";
import type { AdminMembersDashboard } from "@/lib/admin/members-dashboard";
import {
  buildMembersListHref,
  membersListParamsFromSearch,
} from "@/lib/admin/members-list-url";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Users,
  CheckCircle2,
  ArrowRight,
  Link2,
  Puzzle,
  Store,
  Globe,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

function SourceBadge({ source }: { source: AdminMembersDashboard["rows"][0]["source"] }) {
  const config = {
    connect: {
      icon: Link2,
      className: "border-violet-500/30 bg-violet-500/10 text-violet-800 dark:text-violet-300",
      label: "Connect",
    },
    wordpress: {
      icon: Puzzle,
      className: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-300",
      label: "WordPress",
    },
    reseller: {
      icon: Store,
      className: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
      label: "Reseller",
    },
    direct: {
      icon: UserPlus,
      className: "border-border bg-muted/50 text-muted-foreground",
      label: "Direct",
    },
  }[source];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 text-[10px] font-medium", config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function SortHeader({
  label,
  field,
  currentSort,
  listParams,
}: {
  label: string;
  field: string;
  currentSort: string;
  listParams: ReturnType<typeof membersListParamsFromSearch>;
}) {
  const active = currentSort === field;
  return (
    <Link
      href={buildMembersListHref({ ...listParams, sort: field, page: 1 })}
      className={cn(
        "inline-flex items-center gap-1 hover:text-foreground",
        active && "text-foreground font-semibold",
      )}
    >
      {label}
    </Link>
  );
}

export function AdminMembersView({ data }: { data: AdminMembersDashboard }) {
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

  const listParams = membersListParamsFromSearch({
    q: query,
    source,
    status,
    country,
    joined,
    sort,
    page: String(page),
  });

  const chartSignups = signupChart.map((d) => ({ date: d.date, signups: d.signups }));
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

      <AdminMembersFilters params={listParams} countries={countries} filteredTotal={filteredTotal} />

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
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>
                    <SortHeader label="Member" field="name" currentSort={sort} listParams={listParams} />
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <SortHeader label="Credits" field="credits" currentSort={sort} listParams={listParams} />
                  </TableHead>
                  <TableHead>
                    <SortHeader label="Wallet" field="wallet" currentSort={sort} listParams={listParams} />
                  </TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((m) => {
                  const isHeld = m.accountStatus === "SUSPENDED" || m.accountStatus === "BLOCKED";
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="max-w-[180px]">
                        <Link href={`/admin/members/${m.id}`} className="font-semibold hover:text-primary truncate block">
                          {m.fullName}
                        </Link>
                        <p className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {m.countryName}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-mono text-xs">{m.phone}</p>
                        {m.email && (
                          <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">{m.email}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <SourceBadge source={m.source} />
                        {m.connect?.externalRef && (
                          <p className="text-[10px] text-muted-foreground font-mono mt-1 truncate max-w-[120px]">
                            {m.connect.externalRef}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {isHeld ? (
                            <Badge variant="destructive" className="text-[10px] w-fit">
                              {m.accountStatus}
                            </Badge>
                          ) : m.isVerified ? (
                            <Badge
                              variant="outline"
                              className="gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] w-fit"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px] w-fit">
                              Unverified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm font-medium">{m.credits.toLocaleString()}</TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {m.walletCurrency} {m.walletBalance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground">
                        <p>Joined {formatDistanceToNow(m.createdAt, { addSuffix: true })}</p>
                        {m.lastActiveAt && (
                          <p>Active {formatDistanceToNow(m.lastActiveAt, { addSuffix: true })}</p>
                        )}
                        <p className="mt-0.5">
                          {m.counts.messages.toLocaleString()} SMS · {m.counts.senderIds} senders
                        </p>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/members/${m.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent hover:border-border hover:bg-muted"
                          aria-label={`Manage ${m.fullName}`}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
                <p className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  {page > 1 ? (
                    <Link
                      href={buildMembersListHref({ ...listParams, page: page - 1 })}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Link>
                  ) : (
                    <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "opacity-40 pointer-events-none gap-1")}>
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </span>
                  )}
                  {page < totalPages ? (
                    <Link
                      href={buildMembersListHref({ ...listParams, page: page + 1 })}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "opacity-40 pointer-events-none gap-1")}>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </AdminCard>
    </AdminPage>
  );
}
