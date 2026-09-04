"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { retryFailedMessagesAction } from "@/lib/actions/messages";
import {
  type MessageStatusFilter,
  MESSAGE_FILTER_OPTIONS,
  getMessageStatusMeta,
  formatReportWhen,
  buildReportsQuery,
} from "@/lib/reports/message-meta";
import { formatCampaignDisplayName } from "@/lib/campaigns/meta";
import { DashboardChartsPanel } from "@/components/dashboard/dashboard-charts-panel";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ExpandableMessage } from "@/components/admin/expandable-message";
import {
  AppCard,
  AppCardBody,
  AppCardTitle,
  MobileCardList,
  MobileCardItem,
} from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Download,
  Globe,
  Megaphone,
  RefreshCw,
  Search,
  Send,
} from "lucide-react";

export type MessageLogRow = {
  id: string;
  recipient: string;
  body: string;
  status: string;
  countryCode: string | null;
  senderId: string;
  smsUnits: number;
  cost: number | null;
  failureReason: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  createdAt: string;
  campaignId: string | null;
  campaignName: string | null;
  memberId?: string | null;
  memberName?: string | null;
  memberPhone?: string | null;
};

export type CampaignOption = {
  id: string;
  name: string;
  status: string;
  memberName?: string | null;
};

function campaignOptionLabel(c: CampaignOption) {
  const name = formatCampaignDisplayName(c.name);
  return c.memberName ? `${name} · ${c.memberName}` : name;
}

export type CampaignReport = {
  id: string;
  name: string;
  status: string;
  message: string;
  recipientCount: number;
  delivered: number;
  failed: number;
  pending: number;
  sent: number;
  total: number;
  deliveryPct: number;
  cost: number;
};

export type ReportsDashboardProps = {
  messages: MessageLogRow[];
  total: number;
  page: number;
  totalPages: number;
  filters: {
    campaign?: string;
    status?: string;
    country?: string;
    q?: string;
    userId?: string;
    member?: string;
    period?: string;
  };
  overview: {
    totalMessages: number;
    messagesToday: number;
    deliveryRate: number;
    delivered: number;
    failed: number;
    pending: number;
    sent: number;
    charts: {
      dailySms: { date: string; sent?: number }[];
      deliveryChart: { name: string; value: number; fill?: string }[];
      countryChart: { country: string; count: number }[];
    };
  };
  campaigns: CampaignOption[];
  campaignReport: CampaignReport | null;
  failedInView: number;
  exportUrl: string;
  basePath?: string;
  showMemberColumn?: boolean;
  showRetry?: boolean;
  emptyAction?: { label: string; href: string };
  memberFilter?: string;
  showQuickLinks?: boolean;
};

function MessageDetails({ message }: { message: MessageLogRow }) {
  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span>
          <span className="font-medium text-foreground">Sender:</span> {message.senderId}
        </span>
        <span>
          <span className="font-medium text-foreground">Units:</span> {message.smsUnits}
        </span>
        {message.cost != null && (
          <span>
            <span className="font-medium text-foreground">Cost:</span> {message.cost.toFixed(4)}
          </span>
        )}
        {message.campaignName && (
          <span>
            <span className="font-medium text-foreground">Campaign:</span>{" "}
            {formatCampaignDisplayName(message.campaignName)}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span>Sent: {formatReportWhen(message.sentAt)}</span>
        <span>Delivered: {formatReportWhen(message.deliveredAt)}</span>
        {message.failedAt && <span>Failed: {formatReportWhen(message.failedAt)}</span>}
      </div>
      {message.status === "FAILED" && message.failureReason && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-destructive">
          {message.failureReason}
        </p>
      )}
      <p className="font-mono text-[10px]">{message.id}</p>
    </div>
  );
}

function MessageCard({
  message,
  expanded,
  onToggle,
}: {
  message: MessageLogRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = getMessageStatusMeta(message.status);
  const Icon = meta.icon;

  return (
    <>
      <div className="flex w-full items-start gap-3">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-start gap-3 text-left">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
              meta.badgeClass,
            )}
          >
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-foreground">{message.recipient}</p>
              <p className={cn("shrink-0 text-sm font-semibold", meta.textClass)}>{meta.label}</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatReportWhen(message.createdAt)}
              {message.countryCode ? ` · ${message.countryCode}` : ""}
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </button>
      </div>
      <div className="mt-2 pl-[3.25rem]">
        <ExpandableMessage
          body={message.body}
          className="max-w-none text-xs"
          collapsedClassName="line-clamp-2"
        />
      </div>
      {expanded && (
        <div className="mt-4 border-t border-border/50 pt-4">
          <MessageDetails message={message} />
        </div>
      )}
    </>
  );
}

export function ReportsDashboard({
  messages,
  total,
  page,
  totalPages,
  filters,
  overview,
  campaigns,
  campaignReport,
  failedInView,
  exportUrl,
  basePath = "/dashboard/reports",
  showMemberColumn = false,
  showRetry = true,
  emptyAction = { label: "Send SMS", href: "/dashboard/send" },
  memberFilter,
  showQuickLinks = true,
}: ReportsDashboardProps) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState(filters.q ?? "");
  const [memberSearch, setMemberSearch] = useState(memberFilter ?? "");

  const statusFilter = (filters.status ?? "all") as MessageStatusFilter;
  const periodToday = filters.period === "today";
  const filterBase = useMemo(
    () => ({
      campaign: filters.campaign,
      status: filters.status,
      country: filters.country,
      q: filters.q,
      userId: filters.userId,
      member: filters.member,
      period: filters.period,
    }),
    [filters],
  );

  function goTo(patch: Record<string, string | undefined | null>) {
    router.push(buildReportsQuery(filterBase, patch, basePath));
  }

  const topCountries = overview.charts.countryChart.slice(0, 5);
  const maxCountry = topCountries[0]?.count ?? 1;

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total messages", value: overview.totalMessages.toLocaleString() },
          { label: "Delivery rate", value: `${overview.deliveryRate}%` },
          {
            label: "Delivered",
            value: overview.delivered.toLocaleString(),
            accent: "text-emerald-600 dark:text-emerald-400",
          },
          { label: "Failed", value: overview.failed.toLocaleString(), accent: "text-destructive" },
          { label: "Pending", value: overview.pending.toLocaleString() },
          { label: "Today", value: overview.messagesToday.toLocaleString() },
        ].map(({ label, value, accent }) => (
          <div
            key={label}
            className="rounded-2xl border border-border/60 bg-card px-4 py-4 shadow-sm"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className={cn("mt-1 text-lg font-bold tabular-nums", accent)}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5 xl:gap-8">
        <div className="space-y-6 xl:col-span-3">
          <DashboardChartsPanel
            dailySms={overview.charts.dailySms}
            deliveryChart={overview.charts.deliveryChart}
            messagesToday={overview.messagesToday}
            deliveryRate={overview.deliveryRate}
            delivered={overview.delivered}
            failed={overview.failed}
            pending={overview.pending}
            totalMessages={overview.totalMessages}
          />
        </div>

        <AppCard className="xl:col-span-2">
          <AppCardBody className="space-y-4">
            <AppCardTitle
              title="Top countries"
              description="Messages by destination"
              icon={Globe}
              className="mb-0"
            />
            {topCountries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No country data yet.</p>
            ) : (
              <ul className="space-y-3">
                {topCountries.map((c) => (
                  <li key={c.country}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-medium">{c.country}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {c.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.round((c.count / maxCountry) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AppCardBody>
        </AppCard>
      </div>

      {campaignReport && (
        <AppCard className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
          <AppCardBody className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Campaign report
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  {formatCampaignDisplayName(campaignReport.name)}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {campaignReport.message}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {campaignReport.status.toLowerCase()}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Recipients", value: campaignReport.recipientCount.toLocaleString() },
                { label: "Delivered", value: campaignReport.delivered.toLocaleString() },
                { label: "Failed", value: campaignReport.failed.toLocaleString() },
                { label: "Success rate", value: `${campaignReport.deliveryPct}%` },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border bg-background/80 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
                </div>
              ))}
            </div>
            <Link
              href="/dashboard/campaigns"
              className="inline-flex text-sm font-semibold text-primary hover:underline"
            >
              ← All campaigns
            </Link>
          </AppCardBody>
        </AppCard>
      )}

      <AppCard>
        <AppCardBody className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <AppCardTitle
              title="Message log"
              description={`${total.toLocaleString()} message${total === 1 ? "" : "s"}${totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}`}
              icon={BarChart3}
              className="mb-0"
            />
            <div className="flex flex-wrap gap-2">
              {showRetry && failedInView > 0 && (
                <form action={retryFailedMessagesAction}>
                  {filters.campaign && (
                    <input type="hidden" name="campaignId" value={filters.campaign} />
                  )}
                  <Button type="submit" variant="outline" className="h-11 gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Retry failed ({failedInView})
                  </Button>
                </form>
              )}
              <a href={exportUrl}>
                <Button type="button" variant="outline" className="h-11 gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </a>
            </div>
          </div>

          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              goTo({
                q: search.trim() || null,
                member: memberSearch.trim() || null,
                page: null,
              });
            }}
          >
            <div
              className={cn(
                "grid items-end gap-3",
                showMemberColumn
                  ? "sm:grid-cols-2 xl:grid-cols-4"
                  : "sm:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {showMemberColumn && (
                <div className="space-y-1.5">
                  <Label htmlFor="report-member">Member</Label>
                  <Input
                    id="report-member"
                    placeholder="Name, phone, or email…"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="h-11"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="report-search">Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="report-search"
                    placeholder="Phone or message…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-11 pl-9"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-country">Country</Label>
                <Input
                  id="report-country"
                  placeholder="e.g. GH"
                  defaultValue={filters.country && filters.country !== "all" ? filters.country : ""}
                  onBlur={(e) =>
                    goTo({ country: e.target.value.trim().toUpperCase() || null, page: null })
                  }
                  className="h-11 uppercase"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-campaign">Campaign</Label>
                <select
                  id="report-campaign"
                  value={filters.campaign ?? ""}
                  onChange={(e) => goTo({ campaign: e.target.value || null, page: null })}
                  className="h-11 w-full truncate rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">All campaigns</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id} title={campaignOptionLabel(c)}>
                      {campaignOptionLabel(c)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="h-10 px-5">
                Search
              </Button>
              {(filters.q ||
                filters.country ||
                filters.campaign ||
                filters.status ||
                filters.member ||
                filters.userId ||
                filters.period) && (
                <Link
                  href={basePath}
                  className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium hover:bg-muted/50"
                >
                  Clear filters
                </Link>
              )}
            </div>
          </form>

          <div className="flex gap-2 overflow-x-auto pb-1 app-scroll-x">
            {basePath.startsWith("/admin") ? (
              <Link
                href={buildReportsQuery(
                  filterBase,
                  {
                    period: periodToday ? null : "today",
                    status: null,
                    page: null,
                  },
                  basePath,
                )}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  periodToday
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted",
                )}
              >
                Sent today
              </Link>
            ) : null}
            {MESSAGE_FILTER_OPTIONS.map((o) => (
              <Link
                key={o.value}
                href={buildReportsQuery(
                  filterBase,
                  {
                    status: o.value === "all" ? null : o.value,
                    period: null,
                    page: null,
                  },
                  basePath,
                )}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  !periodToday && statusFilter === o.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted",
                )}
              >
                {o.label}
              </Link>
            ))}
          </div>

          {messages.length === 0 ? (
            <EmptyState
              icon={Send}
              title="No messages to show"
              description="Try adjusting filters, or send SMS to see delivery results here."
              actionLabel={emptyAction.label}
              actionHref={emptyAction.href}
            />
          ) : (
            <>
              <MobileCardList>
                {messages.map((m) => (
                  <MobileCardItem key={m.id}>
                    <MessageCard
                      message={m}
                      expanded={expandedId === m.id}
                      onToggle={() => setExpandedId((id) => (id === m.id ? null : m.id))}
                    />
                  </MobileCardItem>
                ))}
              </MobileCardList>

              <div className="hidden overflow-x-auto rounded-xl border md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                      {showMemberColumn && (
                        <th className="px-5 py-3 font-medium">Member</th>
                      )}
                      <th className="px-5 py-3 font-medium">Recipient</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Country</th>
                      <th className="hidden px-5 py-3 font-medium lg:table-cell">Campaign</th>
                      <th className="px-5 py-3 font-medium text-right">When</th>
                      <th className="w-10 px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((m) => {
                      const meta = getMessageStatusMeta(m.status);
                      const Icon = meta.icon;
                      const expanded = expandedId === m.id;
                      return (
                        <Fragment key={m.id}>
                          <tr
                            className={cn(
                              "border-b border-border/40 last:border-0",
                              expanded && "bg-muted/15",
                            )}
                          >
                            {showMemberColumn && (
                              <td className="px-5 py-3.5">
                                {m.memberId ? (
                                  <Link
                                    href={`/admin/members/${m.memberId}?tab=messaging`}
                                    className="font-medium text-primary hover:underline"
                                  >
                                    {m.memberName ?? m.memberPhone ?? "Member"}
                                  </Link>
                                ) : (
                                  "—"
                                )}
                                {m.memberPhone && (
                                  <p className="mt-0.5 text-[10px] text-muted-foreground font-mono">
                                    {m.memberPhone}
                                  </p>
                                )}
                              </td>
                            )}
                            <td className="max-w-xs px-5 py-3.5">
                              <p className="font-medium">{m.recipient}</p>
                              <ExpandableMessage
                                body={m.body}
                                className="mt-0.5 max-w-none text-xs"
                                collapsedClassName="line-clamp-1"
                              />
                            </td>
                            <td className="px-5 py-3.5">
                              <Badge variant="outline" className={cn("gap-1", meta.badgeClass)}>
                                <Icon className="h-3 w-3" />
                                {meta.label}
                              </Badge>
                            </td>
                            <td className="px-5 py-3.5 text-muted-foreground">
                              {m.countryCode ?? "—"}
                            </td>
                            <td className="hidden max-w-[140px] truncate px-5 py-3.5 text-muted-foreground lg:table-cell">
                              {m.campaignName
                                ? formatCampaignDisplayName(m.campaignName)
                                : "—"}
                            </td>
                            <td className="whitespace-nowrap px-5 py-3.5 text-right text-xs text-muted-foreground">
                              {formatReportWhen(m.createdAt)}
                            </td>
                            <td className="px-3 py-3.5">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => setExpandedId((id) => (id === m.id ? null : m.id))}
                                aria-label={expanded ? "Hide details" : "Show details"}
                              >
                                {expanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </td>
                          </tr>
                          {expanded && (
                            <tr key={`${m.id}-detail`} className="border-b border-border/40 bg-muted/10">
                              <td colSpan={showMemberColumn ? 7 : 6} className="px-5 py-4">
                                <MessageDetails message={m} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              {page > 1 && (
                <Link
                  href={buildReportsQuery(filterBase, { page: String(page - 1) }, basePath)}
                  className="inline-flex h-11 items-center rounded-xl border px-5 text-sm font-semibold hover:bg-muted/50"
                >
                  Previous
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={buildReportsQuery(filterBase, { page: String(page + 1) }, basePath)}
                  className="inline-flex h-11 items-center rounded-xl border px-5 text-sm font-semibold hover:bg-muted/50"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </AppCardBody>
      </AppCard>

      {showQuickLinks && (
        <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
          <Link
            href="/dashboard/send"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/60 px-5 text-sm font-semibold hover:bg-muted/50"
          >
            <Send className="h-4 w-4" />
            Send SMS
          </Link>
          <Link
            href="/dashboard/campaigns"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/60 px-5 text-sm font-semibold hover:bg-muted/50"
          >
            <Megaphone className="h-4 w-4" />
            Campaigns
          </Link>
        </div>
      )}
    </div>
  );
}
