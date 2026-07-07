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
  computeDeliveryRate,
  formatCampaignDate,
  formatCampaignDisplayName,
  formatCampaignWhen,
  getCampaignStatusMeta,
} from "@/lib/campaigns/meta";
import { CampaignsStats } from "@/components/dashboard/campaigns-stats";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Megaphone, Pause, Play, Search, Trash2 } from "lucide-react";

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

function recipientCount(campaign: CampaignRow) {
  return campaign.recipientCount || campaign.stats.total;
}

function CampaignStatusBadge({ status }: { status: string }) {
  const meta = getCampaignStatusMeta(status);
  const StatusIcon = meta.icon;

  return (
    <Badge
      variant="outline"
      className={cn("h-6 gap-1 px-2 text-[11px] font-medium capitalize", meta.badgeClass)}
    >
      <StatusIcon className={cn("h-3 w-3", status === "SENDING" && "animate-spin")} />
      {meta.label}
    </Badge>
  );
}

function DeliveryCell({ campaign }: { campaign: CampaignRow }) {
  const { stats } = campaign;
  const rate = computeDeliveryRate(stats);
  const count = recipientCount(campaign);

  if (campaign.status === "SCHEDULED" && campaign.scheduledAt) {
    return (
      <span className="text-xs text-muted-foreground">
        {formatCampaignWhen(campaign.scheduledAt)}
      </span>
    );
  }

  if (stats.total <= 0) {
    return <span className="text-xs text-muted-foreground tabular-nums">{count} queued</span>;
  }

  return (
    <div className="space-y-1.5 min-w-[88px]">
      <div className="flex items-center justify-between gap-2 text-xs tabular-nums">
        <span className="font-semibold text-foreground">{rate}%</span>
        {stats.failed > 0 && (
          <span className="text-destructive">{stats.failed} failed</span>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
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

function CampaignActions({ campaign }: { campaign: CampaignRow }) {
  const canPause = campaign.status === "SCHEDULED";
  const canResume = campaign.status === "PAUSED";
  const canCancel = ["SCHEDULED", "PAUSED", "DRAFT"].includes(campaign.status);

  return (
    <div className="flex items-center justify-end gap-0.5">
      {campaign.status === "DRAFT" && (
        <Link
          href={`/dashboard/send?draft=${campaign.id}`}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-primary hover:bg-primary/10"
        >
          Continue
        </Link>
      )}
      <Link
        href={`/dashboard/reports?campaign=${campaign.id}`}
        className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-primary hover:bg-primary/10"
      >
        Logs
        <ArrowUpRight className="h-3 w-3" />
      </Link>
      {canPause && (
        <form action={pauseCampaignAction}>
          <input type="hidden" name="id" value={campaign.id} />
          <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label="Pause">
            <Pause className="h-3.5 w-3.5" />
          </Button>
        </form>
      )}
      {canResume && (
        <form action={resumeCampaignAction}>
          <input type="hidden" name="id" value={campaign.id} />
          <Button type="submit" size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label="Resume">
            <Play className="h-3.5 w-3.5" />
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
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            aria-label="Cancel"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </form>
      )}
    </div>
  );
}

function CampaignMobileRow({ campaign }: { campaign: CampaignRow }) {
  const displayName = formatCampaignDisplayName(campaign.name);
  const count = recipientCount(campaign);

  return (
    <div className="px-4 py-3.5 space-y-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {campaign.message}
          </p>
        </div>
        <CampaignStatusBadge status={campaign.status} />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {count.toLocaleString()} recipient{count === 1 ? "" : "s"} · {formatCampaignDate(campaign.createdAt)}
          </p>
          <div className="mt-2 max-w-[160px]">
            <DeliveryCell campaign={campaign} />
          </div>
        </div>
        <CampaignActions campaign={campaign} />
      </div>
    </div>
  );
}

export function CampaignsDashboard({ campaigns, smsCredits, summary }: CampaignsDashboardProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return campaigns.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      const displayName = formatCampaignDisplayName(c.name).toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        displayName.includes(q) ||
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
    <div className="space-y-4">
      <CampaignsStats
        total={summary.total}
        scheduled={summary.scheduled}
        sending={summary.sending}
        completed={summary.completed}
        smsCredits={smsCredits}
      />

      <AppCard>
        <AppCardBody className="space-y-0 p-0">
          <div className="border-b border-border/50 bg-muted/15 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative min-w-0 flex-1 lg:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, message, or group…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-10 bg-background pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground shrink-0">
                {filtered.length} of {campaigns.length} campaigns
              </p>
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5 app-scroll-x">
              {CAMPAIGN_FILTER_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setStatusFilter(o.value)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    statusFilter === o.value
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "bg-background text-muted-foreground ring-1 ring-border/60 hover:bg-muted/50",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              No campaigns match your filters.
            </p>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6">Campaign</TableHead>
                      <TableHead className="w-[112px]">Status</TableHead>
                      <TableHead className="w-[96px] text-right">Recipients</TableHead>
                      <TableHead className="w-[120px]">Delivery</TableHead>
                      <TableHead className="w-[84px]">Date</TableHead>
                      <TableHead className="w-[96px] pr-6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((campaign) => {
                      const displayName = formatCampaignDisplayName(campaign.name);
                      const count = recipientCount(campaign);

                      return (
                        <TableRow key={campaign.id} className="group">
                          <TableCell className="pl-6 py-3.5 align-top">
                            <p className="truncate text-sm font-semibold text-foreground max-w-[420px]">
                              {displayName}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground max-w-[480px]">
                              {campaign.message}
                            </p>
                            {campaign.contactGroupName && (
                              <p className="mt-1 text-[11px] text-muted-foreground/80">
                                Group · {campaign.contactGroupName}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="align-top py-3.5">
                            <CampaignStatusBadge status={campaign.status} />
                          </TableCell>
                          <TableCell className="align-top py-3.5 text-right text-sm tabular-nums">
                            {count.toLocaleString()}
                          </TableCell>
                          <TableCell className="align-top py-3.5">
                            <DeliveryCell campaign={campaign} />
                          </TableCell>
                          <TableCell className="align-top py-3.5 text-xs text-muted-foreground tabular-nums">
                            {formatCampaignDate(campaign.createdAt)}
                          </TableCell>
                          <TableCell className="align-top py-3.5 pr-6">
                            <CampaignActions campaign={campaign} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden divide-y divide-border/50">
                {filtered.map((campaign) => (
                  <CampaignMobileRow key={campaign.id} campaign={campaign} />
                ))}
              </div>
            </>
          )}
        </AppCardBody>
      </AppCard>
    </div>
  );
}
