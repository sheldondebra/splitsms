"use client";

import { useState } from "react";
import Link from "next/link";
import { SenderIdList, type SenderIdItem } from "@/components/dashboard/sender-id-list";
import { SenderIdRequestForm } from "@/components/dashboard/sender-id-request-form";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  AppCard,
  AppCardBody,
  AppCardTitle,
} from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SenderIdStatus } from "@/lib/generated/prisma/client";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  Info,
  Search,
  Send,
  Star,
  XCircle,
} from "lucide-react";

type StatusFilter = "all" | SenderIdStatus;

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Denied" },
];

export type SenderIdsDashboardProps = {
  items: SenderIdItem[];
  defaultId: SenderIdItem | null;
};

export function SenderIdsDashboard({ items, defaultId }: SenderIdsDashboardProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const approved = items.filter((s) => s.status === "APPROVED");
  const pending = items.filter((s) => s.status === "PENDING");
  const rejected = items.filter((s) => s.status === "REJECTED");

  const filtered = (() => {
    const q = query.trim().toLowerCase();
    return items.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.value.toLowerCase().includes(q) ||
        s.countryCode.toLowerCase().includes(q) ||
        (s.adminNote?.toLowerCase().includes(q) ?? false)
      );
    });
  })();

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: items.length, icon: BadgeCheck },
          {
            label: "Approved",
            value: approved.length,
            icon: CheckCircle2,
            accent: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Pending",
            value: pending.length,
            icon: Clock,
            accent: "text-amber-600 dark:text-amber-400",
          },
          {
            label: "Denied",
            value: rejected.length,
            icon: XCircle,
            accent: "text-destructive",
          },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div
            key={label}
            className="rounded-2xl border border-border/60 bg-card px-4 py-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
            </div>
            <p className={cn("mt-1 text-lg font-bold tabular-nums", accent)}>{value}</p>
          </div>
        ))}
      </div>

      {defaultId ? (
        <AppCard className="overflow-hidden border-2 border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card">
          <AppCardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Active default
              </p>
              <p className="mt-2 font-mono text-3xl font-bold tracking-wide text-foreground sm:text-4xl">
                {defaultId.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Recipients see this name on SMS · {defaultId.countryCode}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-600">
                <CheckCircle2 className="h-3 w-3" />
                Approved
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Star className="h-3 w-3 fill-current" />
                Default
              </Badge>
              <Link
                href="/dashboard/send"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
                Send SMS
              </Link>
            </div>
          </AppCardBody>
        </AppCard>
      ) : (
        <AppCard className="border-dashed">
          <AppCardBody className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No approved Sender ID yet. Register your brand name below — it will show as{" "}
              <span className="font-medium text-amber-700 dark:text-amber-400">pending</span> until
              approved.
            </p>
          </AppCardBody>
        </AppCard>
      )}

      <div className="grid gap-6 xl:grid-cols-5 xl:gap-8">
        <div className="space-y-5 xl:col-span-3">
          <AppCard>
            <AppCardBody className="space-y-5">
              <AppCardTitle
                title="Your Sender IDs"
                description={
                  items.length === 0
                    ? "Register your first brand name"
                    : `${filtered.length} of ${items.length} shown`
                }
                icon={BadgeCheck}
                className="mb-0"
              />

              {items.length > 0 && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search Sender ID or country…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="h-11 pl-9"
                    />
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1 app-scroll-x">
                    {FILTER_OPTIONS.map((o) => (
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
                </>
              )}

              {items.length === 0 ? (
                <EmptyState
                  icon={BadgeCheck}
                  title="No Sender ID yet"
                  description="Register your brand name on the right. It appears as pending until our team approves it."
                />
              ) : filtered.length === 0 ? (
                <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
                  No Sender IDs match your filters.
                </p>
              ) : (
                <SenderIdList items={filtered} />
              )}
            </AppCardBody>
          </AppCard>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <AppCard>
            <AppCardBody className="space-y-5">
              <AppCardTitle
                title="Register new"
                description="1–11 characters, letters and numbers only"
                icon={BadgeCheck}
                className="mb-0"
              />

              <div className="rounded-xl border border-border/60 bg-muted/25 px-4 py-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p>
                      Examples:{" "}
                      <span className="font-mono font-semibold text-foreground">MYBRAND</span>,{" "}
                      <span className="font-mono font-semibold text-foreground">ACMEGH</span>
                    </p>
                    <p className="mt-2 text-xs leading-relaxed">
                      After submit, status shows as pending with a loading indicator. You cannot send
                      bulk SMS until approved.
                    </p>
                  </div>
                </div>
              </div>

              <SenderIdRequestForm />
            </AppCardBody>
          </AppCard>

          <AppCard>
            <AppCardBody className="space-y-4 text-sm text-muted-foreground">
              <h3 className="font-semibold text-foreground">How approval works</h3>
              <ul className="space-y-3">
                {[
                  {
                    icon: Clock,
                    title: "Pending",
                    text: "Under review — usually 1–2 business days.",
                    className: "text-amber-700 dark:text-amber-400",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Approved",
                    text: "Ready to use when sending SMS and campaigns.",
                    className: "text-emerald-600 dark:text-emerald-400",
                  },
                  {
                    icon: XCircle,
                    title: "Denied",
                    text: "Try a different name. Check the reason if provided.",
                    className: "text-destructive",
                  },
                ].map(({ icon: Icon, title, text, className }) => (
                  <li key={title} className="flex gap-3">
                    <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", className)} />
                    <div>
                      <p className="font-medium text-foreground">{title}</p>
                      <p className="text-xs leading-relaxed">{text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </AppCardBody>
          </AppCard>
        </div>
      </div>
    </div>
  );
}
