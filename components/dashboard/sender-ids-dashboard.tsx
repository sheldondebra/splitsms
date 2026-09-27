"use client";

import { useState } from "react";
import Link from "next/link";
import { SenderIdList, type SenderIdItem } from "@/components/dashboard/sender-id-list";
import { SenderIdRequestForm } from "@/components/dashboard/sender-id-request-form";
import {
  AppCard,
  AppCardBody,
} from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SenderIdStatus } from "@/lib/generated/prisma/client";
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
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
  canRegister?: boolean;
};

export function SenderIdsDashboard({
  items,
  defaultId,
  canRegister = true,
}: SenderIdsDashboardProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const approved = items.filter((s) => s.status === "APPROVED");
  const pending = items.filter((s) => s.status === "PENDING");
  const rejected = items.filter((s) => s.status === "REJECTED");
  const needsFirstId = approved.length === 0;

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

  const counts = {
    all: items.length,
    APPROVED: approved.length,
    PENDING: pending.length,
    REJECTED: rejected.length,
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                defaultId
                  ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
                  : pending.length > 0
                    ? "bg-amber-500/12 text-amber-800 ring-amber-500/20 dark:text-amber-200"
                    : "bg-primary/10 text-primary ring-primary/15",
              )}
            >
              <BadgeCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {defaultId
                  ? `Default: ${defaultId.value}`
                  : pending.length > 0
                    ? "Waiting for approval"
                    : "Register a Sender ID to send branded SMS"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {defaultId
                  ? `Recipients see this name on their phone · ${defaultId.countryCode}`
                  : pending.length > 0
                    ? `${pending.length} ${pending.length === 1 ? "request" : "requests"} under SplitSMS review`
                    : "Pick a brand name (3–11 characters). We review it in 1–2 business days."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {defaultId ? (
              <Link
                href="/dashboard/send"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "h-9 gap-1.5 rounded-xl",
                )}
              >
                <Send className="h-3.5 w-3.5" />
                Send SMS
              </Link>
            ) : null}
            {canRegister && !needsFirstId ? (
              <a
                href="#register-sender-id"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-9 gap-1.5 rounded-xl",
                )}
              >
                Register another
              </a>
            ) : null}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total",
              value: items.length,
              icon: BadgeCheck,
              hint: "All registered names",
              tone: "default" as const,
            },
            {
              label: "Approved",
              value: approved.length,
              icon: CheckCircle2,
              hint: "Ready to send with",
              tone: "ok" as const,
            },
            {
              label: "Pending",
              value: pending.length,
              icon: Clock,
              hint: "In review",
              tone: "warn" as const,
            },
            {
              label: "Denied",
              value: rejected.length,
              icon: XCircle,
              hint: "Try a different name",
              tone: "danger" as const,
            },
          ].map(({ label, value, icon: Icon, hint, tone }, index, arr) => (
            <div
              key={label}
              className={cn(
                "p-4",
                index < arr.length - 1 && "border-b border-border/50 sm:border-b-0",
                index % 2 === 0 && "sm:border-r",
                index < 2 && "xl:border-b-0",
                index < 3 && "xl:border-r",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg ring-1",
                    tone === "ok" &&
                      "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
                    tone === "warn" &&
                      "bg-amber-500/12 text-amber-800 ring-amber-500/20 dark:text-amber-200",
                    tone === "danger" &&
                      "bg-destructive/12 text-destructive ring-destructive/20",
                    tone === "default" &&
                      "bg-primary/10 text-primary ring-primary/15",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {label}
                </p>
              </div>
              <p
                className={cn(
                  "mt-3 text-2xl font-bold tabular-nums tracking-tight",
                  tone === "ok" && "text-emerald-700 dark:text-emerald-300",
                  tone === "warn" && "text-amber-800 dark:text-amber-200",
                  tone === "danger" && value > 0 && "text-destructive",
                )}
              >
                {value}
              </p>
              <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>
            </div>
          ))}
        </div>
      </div>

      {defaultId ? (
        <AppCard className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card">
          <AppCardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                Active default
              </p>
              <p className="mt-2 font-mono text-3xl font-bold tracking-wide sm:text-4xl">
                {defaultId.value}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Recipients see this name on SMS · {defaultId.countryCode}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
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
                className={cn(
                  buttonVariants(),
                  "h-11 gap-2 rounded-xl px-5",
                )}
              >
                <Send className="h-4 w-4" />
                Send SMS
              </Link>
            </div>
          </AppCardBody>
        </AppCard>
      ) : null}

      {/* Registration first when user still needs an approved ID */}
      {canRegister && needsFirstId ? (
        <div
          id="register-sender-id"
          className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-sm"
        >
          <div className="border-b border-border/50 bg-gradient-to-br from-primary/[0.10] via-background to-muted/20 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
                  <BadgeCheck className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    Register your Sender ID
                  </h2>
                  <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                    This is the brand name people see instead of a phone number. Pick a
                    name, tell us why you need it, and submit — we’ll email you when it’s
                    approved.
                  </p>
                </div>
              </div>
            </div>
            <ol className="mt-4 grid gap-2 sm:grid-cols-3">
              {[
                { n: "1", title: "Choose a name", text: "3–11 letters or numbers" },
                { n: "2", title: "Add a short reason", text: "Helps us approve faster" },
                { n: "3", title: "Wait for review", text: "Usually 1–2 business days" },
              ].map((step) => (
                <li
                  key={step.n}
                  className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-background/70 px-3 py-2.5"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/12 text-[11px] font-bold text-primary">
                    {step.n}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="text-[11px] text-muted-foreground">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="px-4 py-5 sm:px-6 sm:py-6">
            <SenderIdRequestForm
              variant="hero"
              onRegistered={() => setStatusFilter("PENDING")}
            />
          </div>
        </div>
      ) : null}

      {!canRegister && needsFirstId ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-card px-6 py-12 text-center">
          <p className="text-sm font-semibold">Registration is temporarily unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sender ID registration is turned off right now. Try again later or contact support.
          </p>
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-6",
          canRegister && !needsFirstId ? "xl:grid-cols-5 xl:gap-8" : "",
        )}
      >
        <div
          className={cn(
            "space-y-5",
            canRegister && !needsFirstId && "xl:col-span-3",
          )}
        >
          {(items.length > 0 || !needsFirstId) && (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <h2 className="text-sm font-semibold">Your Sender IDs</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {items.length === 0
                      ? "None yet"
                      : `${filtered.length} of ${items.length} shown`}
                  </p>
                </div>
              </div>

              {items.length > 0 ? (
                <div className="space-y-3 border-b border-border/50 px-4 py-3 sm:px-5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search Sender ID or country…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="h-10 rounded-xl bg-background pl-9"
                    />
                  </div>
                  <div
                    role="tablist"
                    aria-label="Filter Sender IDs"
                    className="inline-flex h-10 w-full items-center overflow-x-auto rounded-xl bg-muted/70 p-1"
                  >
                    {FILTER_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        role="tab"
                        aria-selected={statusFilter === o.value}
                        onClick={() => setStatusFilter(o.value)}
                        className={cn(
                          "inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors",
                          statusFilter === o.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {o.label}
                        <span className="tabular-nums text-[11px] text-muted-foreground">
                          {counts[o.value]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="p-3 sm:p-4">
                {items.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Registered names will appear here after you submit.
                  </p>
                ) : filtered.length === 0 ? (
                  <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
                    No Sender IDs match your filters.
                  </p>
                ) : (
                  <SenderIdList items={filtered} />
                )}
              </div>
            </div>
          )}

          {needsFirstId && items.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
              <div className="border-b border-border/50 px-4 py-3.5 sm:px-5">
                <h2 className="text-sm font-semibold">Requests in progress</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Pending and denied requests while you wait for an approved name
                </p>
              </div>
              <div className="p-3 sm:p-4">
                <SenderIdList items={items} />
              </div>
            </div>
          ) : null}
        </div>

        {canRegister && !needsFirstId ? (
          <div className="space-y-6 xl:col-span-2">
            <div
              id="register-sender-id"
              className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"
            >
              <div className="border-b border-border/50 px-4 py-3.5 sm:px-5">
                <h2 className="text-sm font-semibold">Register another</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  3–11 characters · letters and numbers only
                </p>
              </div>
              <div className="px-4 py-4 sm:px-5 sm:py-5">
                <SenderIdRequestForm onRegistered={() => setStatusFilter("PENDING")} />
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-4 sm:px-5">
              <h3 className="text-sm font-semibold">How approval works</h3>
              <ul className="mt-3 space-y-3">
                {[
                  {
                    icon: Clock,
                    title: "Pending",
                    text: "Under SplitSMS review — usually 1–2 business days.",
                    className: "text-amber-700 dark:text-amber-300",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Approved",
                    text: "Ready to use when sending SMS and campaigns.",
                    className: "text-emerald-700 dark:text-emerald-300",
                  },
                  {
                    icon: XCircle,
                    title: "Denied",
                    text: "Try a different name. Check the reason if provided.",
                    className: "text-destructive",
                  },
                ].map(({ icon: Icon, title, text, className }) => (
                  <li key={title} className="flex gap-3 text-sm">
                    <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", className)} />
                    <div>
                      <p className="font-medium text-foreground">{title}</p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {text}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>

      {needsFirstId ? (
        <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3.5 sm:px-5">
          <h3 className="text-sm font-semibold">After you register</h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: Clock,
                title: "Pending",
                text: "We review your name — usually 1–2 business days.",
                className: "text-amber-700 dark:text-amber-300",
              },
              {
                icon: CheckCircle2,
                title: "Approved",
                text: "Use it as the from-name when you send SMS.",
                className: "text-emerald-700 dark:text-emerald-300",
              },
              {
                icon: XCircle,
                title: "Denied",
                text: "Pick another name and register again.",
                className: "text-destructive",
              },
            ].map(({ icon: Icon, title, text, className }) => (
              <li key={title} className="flex gap-2.5 text-sm">
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", className)} />
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
