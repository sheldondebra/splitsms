"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteSmartFormAction, duplicateSmartFormAction } from "@/lib/actions/smart-forms";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Check,
  ClipboardList,
  Copy,
  ExternalLink,
  FileBarChart2,
  FileText,
  Loader2,
  MessageSquare,
  MoreHorizontal,
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

function SmartFormCard({ form, siteUrl }: { form: SmartFormRow; siteUrl: string }) {
  const router = useRouter();
  const deleteFormRef = useRef<HTMLFormElement>(null);
  const [copied, setCopied] = useState(false);
  const [duplicating, startDuplicate] = useTransition();
  const status = STATUS_META[form.status] ?? STATUS_META.DRAFT;
  const publicUrl = `${siteUrl}/f/${form.shortCode}`;

  const stats = [
    { label: "Views", value: form.views },
    { label: "Submissions", value: form.submissions },
    { label: "Conversion", value: `${form.conversionRate}%` },
    { label: "QR scans", value: form.qrScans },
  ];

  function copyShortLink() {
    void navigator.clipboard.writeText(publicUrl).then(
      () => {
        setCopied(true);
        toast.success("Link copied");
        window.setTimeout(() => setCopied(false), 1600);
      },
      () => toast.error("Couldn’t copy the link"),
    );
  }

  function duplicateForm() {
    startDuplicate(async () => {
      const result = await duplicateSmartFormAction(form.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Form duplicated");
      router.push(`/dashboard/forms/${result.newFormId}/builder`);
    });
  }

  function confirmDelete() {
    if (!window.confirm(`Delete “${form.name}”? This cannot be undone.`)) return;
    deleteFormRef.current?.requestSubmit();
  }

  return (
    <AppCard className="overflow-hidden">
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold leading-tight">{form.name}</h3>
              <Badge variant="secondary" className={cn("shrink-0", status.className)}>
                {status.label}
              </Badge>
            </div>
            {form.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{form.description}</p>
            ) : null}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`More actions for ${form.name}`}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              {form.status === "PUBLISHED" ? (
                <DropdownMenuLinkItem href={publicUrl} render={<a href={publicUrl} target="_blank" rel="noopener noreferrer" />}>
                  <ExternalLink className="h-4 w-4" />
                  Open live form
                </DropdownMenuLinkItem>
              ) : null}
              <DropdownMenuLinkItem
                href={`/dashboard/forms/${form.id}/responses`}
                render={<Link href={`/dashboard/forms/${form.id}/responses`} />}
              >
                <ClipboardList className="h-4 w-4" />
                Responses
              </DropdownMenuLinkItem>
              <DropdownMenuLinkItem
                href={`/dashboard/forms/${form.id}/analytics`}
                render={<Link href={`/dashboard/forms/${form.id}/analytics`} />}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </DropdownMenuLinkItem>
              <DropdownMenuLinkItem
                href={`/dashboard/forms/${form.id}/report`}
                render={<Link href={`/dashboard/forms/${form.id}/report`} />}
              >
                <FileBarChart2 className="h-4 w-4" />
                Report
              </DropdownMenuLinkItem>
              <DropdownMenuLinkItem
                href={`/dashboard/forms/${form.id}/builder?tab=sms`}
                render={<Link href={`/dashboard/forms/${form.id}/builder?tab=sms`} />}
              >
                <MessageSquare className="h-4 w-4" />
                SMS
              </DropdownMenuLinkItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={duplicating} onClick={duplicateForm}>
                {duplicating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={confirmDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-xl border border-border/60 bg-muted/30 sm:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                "px-3 py-2.5",
                index % 2 === 0 && "border-r border-border/60",
                index < 2 && "border-b border-border/60 sm:border-b-0",
                "sm:border-r sm:last:border-r-0",
              )}
            >
              <p className="text-[11px] leading-none text-muted-foreground">{stat.label}</p>
              <p className="mt-1.5 text-sm font-semibold tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {form.fieldCount} fields
          {form.contactGroupName ? ` · ${form.contactGroupName}` : ""}
          {" · "}Last {formatDate(form.lastSubmissionAt)}
          {" · "}Created {formatDate(form.createdAt)}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
          <Button size="lg" render={<Link href={`/dashboard/forms/${form.id}/builder`} />}>
            <Pencil />
            Edit
          </Button>
          <Button size="lg" variant="outline" render={<Link href={`/dashboard/forms/${form.id}/share`} />}>
            <QrCode />
            Share
          </Button>
          <Button type="button" size="lg" variant="outline" onClick={copyShortLink}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>

        <form ref={deleteFormRef} action={deleteSmartFormAction} className="hidden">
          <input type="hidden" name="id" value={form.id} />
        </form>
      </div>
    </AppCard>
  );
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

  const counts = useMemo(
    () => ({
      all: forms.length,
      DRAFT: forms.filter((form) => form.status === "DRAFT").length,
      PUBLISHED: forms.filter((form) => form.status === "PUBLISHED").length,
      CLOSED: forms.filter((form) => form.status === "CLOSED").length,
    }),
    [forms],
  );

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
            <AppCardBody className="p-4 sm:p-4 lg:p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{stat.value}</p>
            </AppCardBody>
          </AppCard>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card px-3 py-3 sm:flex-row sm:items-center sm:px-4">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search forms…"
            className="h-10 bg-background pl-9"
          />
        </div>
        <div
          role="tablist"
          aria-label="Filter forms by status"
          className="inline-flex h-10 w-full items-center rounded-xl bg-muted p-1 sm:w-auto"
        >
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={filter === opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                "inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors sm:flex-none",
                filter === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
              <span className="tabular-nums text-xs opacity-70">{counts[opt.value]}</span>
            </button>
          ))}
        </div>
        <p className="hidden text-xs text-muted-foreground lg:ml-auto lg:block">
          {filtered.length} of {forms.length}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((form) => (
          <SmartFormCard key={form.id} form={form} siteUrl={siteUrl} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No forms match your filters.</p>
      ) : null}
    </div>
  );
}
