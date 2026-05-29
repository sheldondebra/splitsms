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
import type { AdminMembersDashboard } from "@/lib/admin/members-dashboard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
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
  Search,
} from "lucide-react";

function buildHref(params: { q?: string; source?: string }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.source && params.source !== "all") sp.set("source", params.source);
  const qs = sp.toString();
  return `/admin/members${qs ? `?${qs}` : ""}`;
}

const SOURCE_FILTERS = [
  { id: "all", label: "All" },
  { id: "external", label: "External" },
  { id: "connect", label: "Connect" },
  { id: "wordpress", label: "WordPress" },
  { id: "reseller", label: "Reseller" },
  { id: "direct", label: "Direct" },
] as const;

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

export function AdminMembersView({ data }: { data: AdminMembersDashboard }) {
  const { stats, signupChart, sourceChart, rows, query, source, recentConnect } = data;

  const chartSignups = signupChart.map((d) => ({ date: d.date, signups: d.signups }));

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Members"
        description="Member directory with signup trends and users from Connect, WordPress, and reseller platforms."
        icon={Users}
        actions={
          <Link href="/admin/analytics" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            Analytics
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard
          label="Total members"
          value={stats.totalMembers.toLocaleString()}
          variant="primary"
        />
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
            <CardDescription>
              Customers created via Connect API under a partner account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {recentConnect.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-border/60 bg-card px-3 py-2.5 text-sm"
                >
                  <p className="font-medium truncate">{c.customerName}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{c.customerPhone}</p>
                  <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                    {c.externalRef && (
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono">
                        ref: {c.externalRef}
                      </span>
                    )}
                    <span>via {c.partnerName}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/60 bg-muted/20 p-1">
          {SOURCE_FILTERS.map((f) => (
            <Link
              key={f.id}
              href={buildHref({ q: query, source: f.id })}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                source === f.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <form className="flex gap-2 w-full sm:w-auto" action="/admin/members" method="get">
          {source !== "all" && <input type="hidden" name="source" value={source} />}
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              defaultValue={query}
              placeholder="Name, phone, email, external ref…"
              className="h-9 pl-8 text-sm"
            />
          </div>
        </form>
      </div>

      <AdminCard
        title="Member directory"
        description={
          source === "all"
            ? `Showing up to ${stats.listed} members · newest first`
            : `Filtered: ${source} · ${stats.listed} shown`
        }
      >
        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No members match this filter.</p>
        ) : (
          <div className="divide-y divide-border/50">
            {rows.map((m) => {
              const isHeld = m.accountStatus === "SUSPENDED" || m.accountStatus === "BLOCKED";
              return (
                <div
                  key={m.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between group hover:bg-muted/15 -mx-1 px-1 rounded-lg transition-colors"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/members/${m.id}`}
                        className="font-semibold hover:text-primary truncate"
                      >
                        {m.fullName}
                      </Link>
                      <SourceBadge source={m.source} />
                      {isHeld ? (
                        <Badge variant="destructive" className="text-[10px]">
                          {m.accountStatus}
                        </Badge>
                      ) : m.isVerified ? (
                        <Badge
                          variant="outline"
                          className="gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px]"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Unverified
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono">{m.phone}</span>
                      {m.email && <span className="truncate max-w-[200px]">{m.email}</span>}
                      <span className="inline-flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {m.countryName}
                      </span>
                      <span>
                        Joined{" "}
                        {formatDistanceToNow(m.createdAt, { addSuffix: true })}
                      </span>
                      {m.lastActiveAt && (
                        <span>
                          Active{" "}
                          {formatDistanceToNow(m.lastActiveAt, { addSuffix: true })}
                        </span>
                      )}
                    </div>

                    {m.connect && (
                      <p className="text-xs text-violet-700 dark:text-violet-300">
                        Connect · partner{" "}
                        <Link
                          href={`/admin/members/${m.connect.partnerId}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {m.connect.partnerName}
                        </Link>
                        {m.connect.externalRef && (
                          <span className="font-mono ml-1.5 text-muted-foreground">
                            ref {m.connect.externalRef}
                          </span>
                        )}
                        {m.connect.label && m.connect.label !== m.fullName && (
                          <span className="text-muted-foreground"> · {m.connect.label}</span>
                        )}
                      </p>
                    )}

                    {m.reseller && (
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        Reseller sub-account · {m.reseller.businessName}
                      </p>
                    )}

                    {m.wordpressSites.length > 0 && (
                      <p className="text-xs text-sky-800 dark:text-sky-200 truncate">
                        WordPress · {m.wordpressSites.map((s) => s.siteUrl).join(", ")}
                        {m.counts.wordpressSites > m.wordpressSites.length &&
                          ` +${m.counts.wordpressSites - m.wordpressSites.length} more`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right text-sm">
                      <p className="font-semibold tabular-nums">{m.credits} credits</p>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {m.walletCurrency} {m.walletBalance.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {m.counts.messages.toLocaleString()} SMS · {m.counts.apiKeys} keys ·{" "}
                        {m.counts.senderIds} sender
                      </p>
                    </div>
                    <Link
                      href={`/admin/members/${m.id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent opacity-70 group-hover:opacity-100 group-hover:border-border group-hover:bg-muted transition-all"
                      aria-label={`Manage ${m.fullName}`}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
