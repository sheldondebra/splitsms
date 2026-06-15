"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { deleteSmartFormAction } from "@/lib/actions/smart-forms";
import { DuplicateSmartFormButton } from "@/components/smart-forms/duplicate-smart-form-button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  ClipboardList,
  Copy,
  ExternalLink,
  FileText,
  MessageSquare,
  Pencil,
  QrCode,
  Search,
  Trash2,
} from "lucide-react";

export type SmartFormRow = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  shortCode: string;
  slug: string;
  fieldCount: number;
  views: number;
  submissions: number;
  conversionRate: number;
  qrScans: number;
  contactGroupName: string | null;
  saveToContacts: boolean;
  lastSubmissionAt: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-muted text-muted-foreground" },
  PUBLISHED: { label: "Published", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  CLOSED: { label: "Closed", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
};

const FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "CLOSED", label: "Closed" },
] as const;

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function copyShortLink(shortCode: string, siteUrl: string) {
  const url = `${siteUrl}/f/${shortCode}`;
  void navigator.clipboard.writeText(url);
}

export function SmartFormsDashboard({
  forms,
  siteUrl,
  summary,
  limits,
}: {
  forms: SmartFormRow[];
  siteUrl: string;
  summary: { total: number; published: number; draft: number; submissions: number };
  limits: { maxForms: number; usedForms: number; remaining: number; atLimit: boolean };
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTER_OPTIONS)[number]["value"]>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return forms.filter((form) => {
      if (filter !== "all" && form.status !== filter) return false;
      if (!q) return true;
      return (
        form.name.toLowerCase().includes(q) ||
        (form.description?.toLowerCase().includes(q) ?? false) ||
        form.shortCode.toLowerCase().includes(q)
      );
    });
  }, [forms, query, filter]);

  if (forms.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No forms yet"
        description="Create your first Smart Form to collect contacts and automate SMS follow-ups."
        actionLabel="Create form"
        actionHref="/dashboard/forms/create"
      />
    );
  }

  return (
    <div className="space-y-6">
      {limits.atLimit ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          You have reached your form limit ({limits.maxForms}). Delete an unused form to create a new one.
        </p>
      ) : limits.remaining <= 3 ? (
        <p className="rounded-lg border bg-muted px-4 py-3 text-sm text-muted-foreground">
          {limits.remaining} of {limits.maxForms} forms remaining on your plan.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total forms", value: summary.total },
          { label: "Published", value: summary.published },
          { label: "Drafts", value: summary.draft },
          { label: "Submissions", value: summary.submissions },
        ].map((stat) => (
          <AppCard key={stat.label}>
            <AppCardBody className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{stat.value}</p>
            </AppCardBody>
          </AppCard>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search forms…"
            className="pl-9 h-11"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={cn(
                "h-9 rounded-lg px-3 text-sm font-medium transition-colors",
                filter === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((form) => {
          const status = STATUS_META[form.status] ?? STATUS_META.DRAFT;
          const publicUrl = `${siteUrl}/f/${form.shortCode}`;

          return (
            <AppCard key={form.id}>
              <AppCardBody className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold truncate">{form.name}</h3>
                      <Badge variant="secondary" className={cn("shrink-0", status.className)}>
                        {status.label}
                      </Badge>
                    </div>
                    {form.description ? (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                        {form.description}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground">Views</p>
                    <p className="font-semibold tabular-nums">{form.views}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Submissions</p>
                    <p className="font-semibold tabular-nums">{form.submissions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conversion</p>
                    <p className="font-semibold tabular-nums">{form.conversionRate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">QR scans</p>
                    <p className="font-semibold tabular-nums">{form.qrScans}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{form.fieldCount} fields</span>
                  {form.contactGroupName ? <span>Group: {form.contactGroupName}</span> : null}
                  <span>Last submission: {formatDate(form.lastSubmissionAt)}</span>
                  <span>Created {formatDate(form.createdAt)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t">
                  <Link
                    href={`/dashboard/forms/${form.id}/builder`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary/10"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                  {form.status === "PUBLISHED" ? (
                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary/10"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => copyShortLink(form.shortCode, siteUrl)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary/10"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy link
                  </button>
                  <Link
                    href={`/dashboard/forms/${form.id}/responses`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:bg-muted"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    Responses
                  </Link>
                  <Link
                    href={`/dashboard/forms/${form.id}/analytics`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:bg-muted"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Analytics
                  </Link>
                  <Link
                    href={`/dashboard/forms/${form.id}/automation`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:bg-muted"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    SMS
                  </Link>
                  <Link
                    href={`/dashboard/forms/${form.id}/share`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-muted-foreground hover:bg-muted"
                  >
                    <QrCode className="h-3.5 w-3.5" />
                    Share
                  </Link>
                  <DuplicateSmartFormButton formId={form.id} />
                  <form action={deleteSmartFormAction} className="ml-auto">
                    <input type="hidden" name="id" value={form.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      className="h-9 gap-1.5 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </form>
                </div>
              </AppCardBody>
            </AppCard>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No forms match your filters.</p>
      ) : null}
    </div>
  );
}
