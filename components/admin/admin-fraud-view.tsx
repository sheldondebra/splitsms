import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminStatCard,
  AdminEmpty,
  AdminAlert,
} from "@/components/admin/admin-page-shell";
import type { getAdminFraudDashboard } from "@/lib/admin/fraud-dashboard";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ShieldAlert,
  AlertTriangle,
  Ban,
  BarChart3,
  ArrowRight,
  Search,
  MessageSquareX,
} from "lucide-react";

type FraudData = Awaited<ReturnType<typeof getAdminFraudDashboard>>;

function buildHref(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const q = sp.toString();
  return `/admin/fraud${q ? `?${q}` : ""}`;
}

function RiskBadge({ risk }: { risk: "HIGH" | "MEDIUM" }) {
  return (
    <Badge
      variant={risk === "HIGH" ? "destructive" : "outline"}
      className={cn(
        risk === "MEDIUM" &&
          "border-amber-500/50 text-amber-800 dark:text-amber-200 bg-amber-500/10",
      )}
    >
      {risk}
    </Badge>
  );
}

function AccountStatusBadge({ status }: { status: string }) {
  if (status === "ACTIVE") return null;
  return (
    <Badge variant="destructive" className="text-[10px]">
      {status}
    </Badge>
  );
}

function FailureBar({ rate }: { rate: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="h-2 flex-1 max-w-[80px] rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            rate >= 50 ? "bg-destructive" : rate >= 30 ? "bg-amber-500" : "bg-emerald-500",
          )}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums w-9 text-right">{rate}%</span>
    </div>
  );
}

export function AdminFraudView({ data }: { data: FraudData }) {
  const { stats, flags, topFailureReasons, periodDays, riskFilter, query } = data;

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Fraud monitoring"
        description="Accounts with abnormal SMS failure rates. Review flagged members and open their profile to suspend or adjust access."
        icon={ShieldAlert}
        actions={
          <Link
            href="/admin/analytics"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Analytics
          </Link>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/60 bg-muted/20 p-1">
          {data.periodOptions.map((d) => (
            <Link
              key={d}
              href={buildHref({ days: String(d), risk: riskFilter !== "all" ? riskFilter : undefined, q: query })}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                periodDays === d
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60",
              )}
            >
              {d}d
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", "HIGH", "MEDIUM"] as const).map((r) => (
            <Link
              key={r}
              href={buildHref({
                days: String(periodDays),
                risk: r === "all" ? undefined : r,
                q: query,
              })}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                riskFilter === r
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-muted/40",
              )}
            >
              {r === "all" ? "All risks" : r}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <AdminStatCard
          label="Flagged"
          value={stats.flagged}
          hint={`Last ${periodDays} days`}
          icon={ShieldAlert}
          variant={stats.flagged > 0 ? "warning" : "default"}
        />
        <AdminStatCard
          label="High risk"
          value={stats.high}
          variant={stats.high > 0 ? "danger" : "default"}
          icon={AlertTriangle}
        />
        <AdminStatCard
          label="Medium risk"
          value={stats.medium}
          variant={stats.medium > 0 ? "warning" : "default"}
        />
        <AdminStatCard
          label="Platform fail rate"
          value={`${stats.platformFailureRate}%`}
          hint={`${stats.platformFailed.toLocaleString()} / ${stats.platformTotal.toLocaleString()} msgs`}
          variant={stats.platformFailureRate > 10 ? "danger" : "default"}
          icon={MessageSquareX}
        />
        <AdminStatCard
          label="Suspended / blocked"
          value={stats.suspendedAccounts}
          icon={Ban}
          variant={stats.suspendedAccounts > 0 ? "warning" : "default"}
        />
      </div>

      {stats.flagged === 0 && stats.platformFailureRate <= 10 && (
        <AdminAlert variant="success">
          No elevated-risk members match your filters. Platform delivery looks healthy for the
          selected period.
        </AdminAlert>
      )}

      {topFailureReasons.length > 0 && (
        <AdminCard
          title="Top failure reasons"
          description={`Most common SMS errors · ${periodDays}d`}
        >
          <div className="flex flex-wrap gap-2">
            {topFailureReasons.map(({ reason, count }) => (
              <div
                key={reason}
                className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs max-w-full"
              >
                <span className="truncate max-w-[280px]" title={reason}>
                  {reason}
                </span>
                <span className="rounded-full bg-destructive/15 text-destructive px-2 py-0.5 font-semibold tabular-nums shrink-0">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      <AdminCard
        title="Flagged accounts"
        description={
          query
            ? `Search: “${query}” · ${flags.length} result${flags.length !== 1 ? "s" : ""}`
            : `${flags.length} member${flags.length !== 1 ? "s" : ""} · failure rate vs messages in period`
        }
        actions={
          <form className="flex gap-2" action="/admin/fraud" method="get">
            <input type="hidden" name="days" value={periodDays} />
            {riskFilter !== "all" && <input type="hidden" name="risk" value={riskFilter} />}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Name, phone, email…"
                className="h-9 w-full sm:w-48 rounded-lg border border-input bg-background pl-8 pr-3 text-xs"
              />
            </div>
            {query && (
              <Link
                href={buildHref({ days: String(periodDays), risk: riskFilter !== "all" ? riskFilter : undefined })}
                className="inline-flex h-9 items-center rounded-lg border px-3 text-xs text-muted-foreground hover:bg-muted/50"
              >
                Clear
              </Link>
            )}
          </form>
        }
      >
        {flags.length === 0 ? (
          <AdminEmpty>
            {query
              ? "No flagged accounts match your search."
              : "No elevated risk accounts for this period and filter."}
          </AdminEmpty>
        ) : (
          <>
            <ul className="md:hidden divide-y divide-border/50 -mx-1">
              {flags.map((f) => (
                <li key={f.userId} className="py-4 first:pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/members/${f.userId}`}
                        className="font-semibold text-sm hover:text-primary"
                      >
                        {f.fullName}
                      </Link>
                      <p className="text-xs text-muted-foreground font-mono">{f.phone}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <RiskBadge risk={f.risk} />
                        <AccountStatusBadge status={f.accountStatus} />
                      </div>
                    </div>
                    <FailureBar rate={f.failureRate} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 tabular-nums">
                    {f.failedInPeriod} failed / {f.totalInPeriod} in period
                    {f.apiErrors24h > 0 && ` · ${f.apiErrors24h} API errors (24h)`}
                  </p>
                  {f.recentReason && (
                    <p className="text-[11px] text-destructive/90 mt-1 line-clamp-2">{f.recentReason}</p>
                  )}
                  <Link
                    href={`/admin/members/${f.userId}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-2"
                  >
                    Review account
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden md:block rounded-xl border border-border/50 overflow-hidden -mx-1">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[880px]">
                  <thead>
                    <tr className="bg-muted/30 text-left text-xs text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Member</th>
                      <th className="px-4 py-3 font-medium">Risk</th>
                      <th className="px-4 py-3 font-medium">Fail rate</th>
                      <th className="px-4 py-3 font-medium">Volume</th>
                      <th className="px-4 py-3 font-medium">Last error</th>
                      <th className="px-4 py-3 font-medium text-right">API (24h)</th>
                      <th className="px-4 py-3 font-medium w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {flags.map((f, i) => (
                      <tr
                        key={f.userId}
                        className={cn(
                          "border-t border-border/40",
                          i % 2 === 0 ? "bg-transparent" : "bg-muted/10",
                        )}
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/members/${f.userId}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {f.fullName}
                          </Link>
                          <p className="text-xs text-muted-foreground font-mono">{f.phone}</p>
                          {f.email && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                              {f.email}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <RiskBadge risk={f.risk} />
                            <AccountStatusBadge status={f.accountStatus} />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <FailureBar rate={f.failureRate} />
                        </td>
                        <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                          <span className="text-destructive font-medium">{f.failedInPeriod}</span>
                          {" / "}
                          {f.totalInPeriod}
                        </td>
                        <td className="px-4 py-3 max-w-[240px]">
                          {f.recentReason ? (
                            <>
                              <p className="text-xs line-clamp-2" title={f.recentReason}>
                                {f.recentReason}
                              </p>
                              {f.lastFailedAt && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {formatDistanceToNow(f.lastFailedAt, { addSuffix: true })}
                                </p>
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {f.apiErrors24h > 0 ? (
                            <span className="text-amber-700 dark:text-amber-300 font-medium">
                              {f.apiErrors24h}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/members/${f.userId}`}
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </AdminCard>

      <AdminCard title="How risk is scored" description="Rules applied per member in the selected window">
        <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
          <li>
            <strong className="text-foreground">High:</strong> ≥50% failures with 10+ messages in period, or
            ≥20 failed messages.
          </li>
          <li>
            <strong className="text-foreground">Medium:</strong> ≥30% failures with 5+ messages, or ≥10
            failed messages.
          </li>
          <li>
            Suspended and blocked accounts show a badge — use the member profile to manage access,
            credits, and sender IDs.
          </li>
        </ul>
      </AdminCard>
    </AdminPage>
  );
}
