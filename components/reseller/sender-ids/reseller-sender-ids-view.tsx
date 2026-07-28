"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  Search,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import type { ResellerSenderIdsDashboard } from "@/lib/reseller/sender-ids";
import type { SenderIdStatus } from "@/lib/generated/prisma/client";
import { SenderIdStatusBadge } from "@/components/dashboard/sender-id-status-badge";
import {
  ResellerCard,
  ResellerPage,
  ResellerPageHeader,
  ResellerStatCard,
} from "@/components/reseller/reseller-page-shell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | SenderIdStatus;

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ResellerSenderIdsView({ data }: { data: ResellerSenderIdsDashboard }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.items.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.value.toLowerCase().includes(q) ||
        item.countryCode.toLowerCase().includes(q) ||
        item.owner.fullName.toLowerCase().includes(q) ||
        item.owner.phone.toLowerCase().includes(q) ||
        (item.adminNote?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [data.items, query, statusFilter]);

  return (
    <ResellerPage>
      <ResellerPageHeader
        title="Sender IDs"
        description="All sender names across your clients — approved, pending, and rejected."
        icon={BadgeCheck}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ResellerStatCard label="Total" value={data.stats.total} />
        <ResellerStatCard
          label="Approved"
          value={data.stats.approved}
          hint="Ready to send"
          accent
        />
        <ResellerStatCard
          label="Pending"
          value={data.stats.pending}
          hint="Awaiting review"
        />
        <ResellerStatCard
          label="Rejected"
          value={data.stats.rejected}
          hint="Denied / not usable"
        />
      </div>

      <ResellerCard
        title="Directory"
        description="Filter by status or search by sender name, client, or country."
        headerRight={
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sender or client…"
              className="pl-8"
            />
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === opt.value
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:bg-muted/40",
              )}
            >
              {opt.label}
              <span className="ml-1.5 tabular-nums opacity-70">
                {opt.value === "all"
                  ? data.stats.total
                  : opt.value === "APPROVED"
                    ? data.stats.approved
                    : opt.value === "PENDING"
                      ? data.stats.pending
                      : data.stats.rejected}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/70 px-4 py-10 text-center">
            <XCircle className="mx-auto size-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-foreground">No sender IDs found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.items.length === 0
                ? "When clients request sender names, they will show up here."
                : "Try another status filter or search term."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60 rounded-xl border border-border/60 overflow-hidden">
            {filtered.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 bg-card px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-base font-semibold tracking-wide text-foreground">
                      {item.value}
                    </p>
                    <SenderIdStatusBadge
                      status={item.status}
                      compact
                      providerSubmittedAt={item.providerSubmittedAt}
                    />
                    {item.isDefault ? (
                      <Badge className="gap-1 bg-primary/15 text-primary hover:bg-primary/15">
                        <Star className="size-3" />
                        Default
                      </Badge>
                    ) : null}
                    {item.status === "REJECTED" ? (
                      <Badge variant="outline" className="gap-1 text-muted-foreground">
                        <Trash2 className="size-3" />
                        Not usable
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {item.countryCode}
                    <span className="mx-1.5 text-border">·</span>
                    Requested {formatDate(item.createdAt)}
                    {item.adminNote ? (
                      <>
                        <span className="mx-1.5 text-border">·</span>
                        <span className="text-destructive/90">{item.adminNote}</span>
                      </>
                    ) : null}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-1 sm:items-end">
                  {item.owner.isResellerOwner ? (
                    <Badge variant="secondary">Your account</Badge>
                  ) : (
                    <Link
                      href={`/reseller/users/${item.owner.userId}`}
                      className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                    >
                      {item.owner.fullName}
                    </Link>
                  )}
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {item.owner.phone}
                    {item.owner.isSuspended ? " · Suspended" : null}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ResellerCard>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: CheckCircle2,
            title: "Approved",
            body: "Clients can send SMS using these names.",
            className: "text-emerald-600 dark:text-emerald-400",
          },
          {
            icon: Clock,
            title: "Pending",
            body: "Submitted and waiting for platform or provider review.",
            className: "text-amber-600 dark:text-amber-400",
          },
          {
            icon: XCircle,
            title: "Rejected",
            body: "Denied sender names that cannot be used for sending.",
            className: "text-destructive",
          },
        ].map(({ icon: Icon, title, body, className }) => (
          <div
            key={title}
            className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3.5"
          >
            <div className="flex items-center gap-2">
              <Icon className={cn("size-4", className)} />
              <p className="text-sm font-semibold">{title}</p>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>
    </ResellerPage>
  );
}
