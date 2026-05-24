"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  cancelCampaignAction,
  pauseCampaignAction,
  resumeCampaignAction,
} from "@/lib/actions/campaigns";
import {
  type CampaignFilter,
  CAMPAIGN_FILTER_OPTIONS,
  RECURRENCE_LABELS,
  computeDeliveryRate,
  formatCampaignWhen,
  getCampaignStatusMeta,
} from "@/lib/campaigns/meta";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AppCard, AppCardBody, AppCardTitle } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  Megaphone,
  Pause,
  Play,
  Search,
  Trash2,
  Users,
} from "lucide-react";

export type CampaignRow = {
  id: string;
  name: string;
  message: string;
  status: string;
  recipientCount: number;
  scheduledAt: string | null;
  recurrence: string;
  countryCode: string;
  contactGroupName: string | null;
  createdAt: string;
  estimatedCost: number | null;
  stats: {
    total: number;
    delivered: number;
    failed: number;
    sent: number;
    pending: number;
  };
};

export type CampaignsDashboardProps = {
  campaigns: CampaignRow[];
  smsCredits: number;
  summary: {
    total: number;
    scheduled: number;
    sending: number;
    completed: number;
    totalRecipients: number;
  };
};

function formatCreated(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CampaignActions({ campaign }: { campaign: CampaignRow }) {
  const canPause = campaign.status === "SCHEDULED";
  const canResume = campaign.status === "PAUSED";
  const canCancel = ["SCHEDULED", "PAUSED", "DRAFT"].includes(campaign.status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/dashboard/reports?campaign=${campaign.id}`}
        className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary/10"
      >
        View logs
      </Link>
      {canPause && (
        <form action={pauseCampaignAction}>
          <input type="hidden" name="id" value={campaign.id} />
          <Button type="submit" size="sm" variant="outline" className="h-9 gap-1.5">
            <Pause className="h-3.5 w-3.5" />
            Pause
          </Button>
        </form>
      )}
      {canResume && (
        <form action={resumeCampaignAction}>
          <input type="hidden" name="id" value={campaign.id} />
          <Button type="submit" size="sm" variant="outline" className="h-9 gap-1.5">
            <Play className="h-3.5 w-3.5" />
            Resume
          </Button>
        </form>
      )}
      {canCancel && (
        <form action={cancelCampaignAction}>
          <input type="hidden" name="id" value={campaign.id} />
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            className="h-9 gap-1.5 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </form>
      )}
    </div>
  );
}

function DeliveryProgress({ campaign }: { campaign: CampaignRow }) {
  const { stats } = campaign;
  const rate = computeDeliveryRate(stats);
  const hasMessages = stats.total > 0;

  if (!hasMessages && campaign.status === "SCHEDULED") {
    return (
      <p className="text-xs text-muted-foreground">
        Scheduled for {formatCampaignWhen(campaign.scheduledAt) ?? "later"}
      </p>
    );
  }

  if (!hasMessages) {
    return (
      <p className="text-xs text-muted-foreground">
        {campaign.recipientCount.toLocaleString()} recipients queued
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{stats.delivered.toLocaleString()} delivered</span>
        <span>{stats.sent.toLocaleString()} sent</span>
        {stats.failed > 0 && (
          <span className="text-destructive">{stats.failed.toLocaleString()} failed</span>
        )}
        {stats.pending > 0 && <span>{stats.pending.toLocaleString()} pending</span>}
        <span className="font-semibold text-foreground">{rate}% complete</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            stats.failed > 0 && rate < 100 ? "bg-primary" : "bg-emerald-500",
          )}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
    </div>
  );
}

function CampaignCard({
  campaign,
  expanded,
  onToggle,
}: {
  campaign: CampaignRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = getCampaignStatusMeta(campaign.status);
  const StatusIcon = meta.icon;
  const recurrenceLabel = RECURRENCE_LABELS[campaign.recurrence];

  return (
    <AppCard className="overflow-hidden">
      <AppCardBody className="p-0">
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          <div className="min-w-0 flex-1 p-5 sm:p-6 lg:p-8">
            <div className="mb-3 flex flex-wrap items-start gap-2">
              <h3 className="min-w-0 flex-1 truncate text-lg font-semibold text-foreground">
                {campaign.name}
              </h3>
              <Badge variant="outline" className={cn("shrink-0 gap-1 capitalize", meta.badgeClass)}>
                <StatusIcon
                  className={cn("h-3 w-3", campaign.status === "SENDING" && "animate-spin")}
                />
                {meta.label}
              </Badge>
            </div>

            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {campaign.message}
            </p>

            <div className="mt-4">
              <DeliveryProgress campaign={campaign} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {(campaign.recipientCount || campaign.stats.total).toLocaleString()} recipients
              </span>
              {campaign.contactGroupName && <span>{campaign.contactGroupName}</span>}
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Created {formatCreated(campaign.createdAt)}
              </span>
              {campaign.scheduledAt && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatCampaignWhen(campaign.scheduledAt)}
                </span>
              )}
              {recurrenceLabel && <span>Repeats · {recurrenceLabel}</span>}
              <span>{campaign.countryCode}</span>
            </div>

            <div className="lg:hidden">
              <button
                type="button"
                onClick={onToggle}
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary"
              >
                {expanded ? (
                  <>
                    Hide actions <ChevronUp className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    Show actions <ChevronDown className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
              {expanded && (
                <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
                  {campaign.estimatedCost != null && (
                    <p className="text-xs text-muted-foreground">
                      Estimated cost:{" "}
                      <span className="font-semibold text-foreground">
                        {campaign.estimatedCost.toFixed(2)}
                      </span>
                    </p>
                  )}
                  <CampaignActions campaign={campaign} />
                </div>
              )}
            </div>
          </div>

          <div className="hidden flex-col justify-center gap-3 border-t border-border/60 bg-muted/15 p-5 sm:p-6 lg:flex lg:w-72 lg:border-l lg:border-t-0 xl:w-80">
            {campaign.estimatedCost != null && (
              <p className="text-xs text-muted-foreground">
                Est. cost{" "}
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {campaign.estimatedCost.toFixed(2)}
                </span>
              </p>
            )}
            <CampaignActions campaign={campaign} />
          </div>
        </div>
      </AppCardBody>
    </AppCard>
  );
}

export function CampaignsDashboard({ campaigns, smsCredits, summary }: CampaignsDashboardProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q) ||
        (c.contactGroupName?.toLowerCase().includes(q) ?? false) ||
        c.countryCode.toLowerCase().includes(q)
      );
    });
  }, [campaigns, query, statusFilter]);

  if (campaigns.length === 0) {
    return (
      <EmptyState
        icon={Megaphone}
        title="No campaigns yet"
        description="Send bulk SMS to a contact group or pasted numbers. Schedule for later or send immediately."
        actionLabel="Create campaign"
        actionHref="/dashboard/campaigns/new"
      />
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Total campaigns", value: summary.total.toString(), icon: Megaphone },
          { label: "Scheduled", value: summary.scheduled.toString(), icon: Calendar },
          { label: "Sending", value: summary.sending.toString(), icon: BarChart3 },
          { label: "Completed", value: summary.completed.toString(), icon: BarChart3 },
          {
            label: "SMS credits",
            value: smsCredits.toLocaleString(),
            icon: Coins,
            className: "col-span-2 sm:col-span-1",
          },
        ].map(({ label, value, icon: Icon, className }) => (
          <div
            key={label}
            className={cn(
              "rounded-2xl border border-border/60 bg-card px-4 py-4 shadow-sm",
              className,
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
            </div>
            <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <AppCard>
        <AppCardBody className="space-y-5">
          <AppCardTitle
            title="Your campaigns"
            description={`${filtered.length} of ${campaigns.length} shown · ${summary.totalRecipients.toLocaleString()} total recipients`}
            icon={Megaphone}
            className="mb-0"
          />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, message, group, country…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 pl-9"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 app-scroll-x">
            {CAMPAIGN_FILTER_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setStatusFilter(o.value)}
                className={cn(
                  "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  statusFilter === o.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
              No campaigns match your filters.
            </p>
          ) : (
            <div className="space-y-4">
              {filtered.map((c) => (
                <CampaignCard
                  key={c.id}
                  campaign={c}
                  expanded={expandedId === c.id}
                  onToggle={() => setExpandedId((id) => (id === c.id ? null : c.id))}
                />
              ))}
            </div>
          )}
        </AppCardBody>
      </AppCard>
    </div>
  );
}
