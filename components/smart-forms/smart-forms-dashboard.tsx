"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteSmartFormAction, duplicateSmartFormAction } from "@/lib/actions/smart-forms";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
  CheckCircle2,
  ClipboardList,
  Copy,
  ExternalLink,
  Eye,
  FileBarChart2,
  FileStack,
  FileText,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  QrCode,
  Search,
  Send,
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

const STATUS_META: Record<string, { label: string; className: string; ring: string }> = {
  DRAFT: {
    label: "Draft",
    className: "border-border/70 bg-muted/60 text-muted-foreground",
    ring: "bg-muted text-muted-foreground ring-border/60",
  },
  PUBLISHED: {
    label: "Published",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    ring: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  },
  CLOSED: {
    label: "Closed",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
    ring: "bg-amber-500/12 text-amber-800 ring-amber-500/20 dark:text-amber-200",
  },
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
  const status = STATUS_META[form.status] ?? STATUS_META.DRAFT!;
  const publicUrl = `${siteUrl}/f/${form.shortCode}`;
  const published = form.status === "PUBLISHED";

  const stats = [
    { label: "Views", value: form.views.toLocaleString(), icon: Eye },
    {
      label: "Submissions",
      value: form.submissions.toLocaleString(),
      icon: ClipboardList,
    },
    { label: "Conversion", value: `${form.conversionRate}%`, icon: Send },
    { label: "QR scans", value: form.qrScans.toLocaleString(), icon: QrCode },
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
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex items-start gap-3 border-b border-border/50 px-4 py-4 sm:px-5">
        <span
          className={cn(
            "mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1",
            status.ring,
          )}
        >
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold tracking-tight">{form.name}</h3>
            <Badge
              variant="outline"
              className={cn("shrink-0 text-[10px] font-semibold", status.className)}
            >
              {status.label}
            </Badge>
          </div>
          {form.description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {form.description}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {form.fieldCount} field{form.fieldCount === 1 ? "" : "s"}
              {form.contactGroupName ? ` · saves to ${form.contactGroupName}` : ""}
            </p>
          )}
          <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
            /f/{form.shortCode}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`More actions for ${form.name}`}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            {published ? (
              <DropdownMenuLinkItem
                href={publicUrl}
                render={<a href={publicUrl} target="_blank" rel="noopener noreferrer" />}
              >
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
              SMS automation
            </DropdownMenuLinkItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={duplicating} onClick={duplicateForm}>
              {duplicating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 border-b border-border/50 sm:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={cn(
                "px-3.5 py-3",
                index % 2 === 0 && "border-r border-border/50",
                index < 2 && "border-b border-border/50 sm:border-b-0",
                index < 3 && "sm:border-r",
              )}
            >
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Icon className="h-3 w-3" />
                {stat.label}
              </div>
              <p className="mt-1.5 text-sm font-semibold tabular-nums tracking-tight">
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4 sm:px-5">
        <p className="text-xs text-muted-foreground">
          Last response {formatDate(form.lastSubmissionAt)}
          <span className="mx-1.5 text-border">·</span>
          Created {formatDate(form.createdAt)}
        </p>

        <div className="mt-auto flex flex-wrap gap-2">
          <Link
            href={`/dashboard/forms/${form.id}/builder`}
            className={cn(buttonVariants(), "h-10 gap-1.5 rounded-xl")}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>
          <Link
            href={`/dashboard/forms/${form.id}/share`}
            className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-1.5 rounded-xl")}
          >
            <QrCode className="h-3.5 w-3.5" />
            Share
          </Link>
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-1.5 rounded-xl"
            onClick={copyShortLink}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy link"}
          </Button>
        </div>
      </div>

      <form ref={deleteFormRef} action={deleteSmartFormAction} className="hidden">
        <input type="hidden" name="id" value={form.id} />
      </form>
    </div>
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

  const empty = forms.length === 0;
  const createHref = limits.atLimit
    ? "/dashboard/forms?error=limit"
    : "/dashboard/forms/create";

  return (
    <div className="space-y-6">
      {limits.atLimit ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Form limit reached ({limits.maxForms}). Delete an unused form to create a new one.
        </p>
      ) : limits.remaining <= 3 && !empty ? (
        <p className="rounded-xl border border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          {limits.remaining} of {limits.maxForms} forms remaining on your plan.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                summary.published > 0
                  ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300"
                  : "bg-primary/10 text-primary ring-primary/15",
              )}
            >
              {summary.published > 0 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </span>
            <div>
              <p className="text-sm font-semibold">
                {empty
                  ? "Create your first Smart Form"
                  : summary.published > 0
                    ? `${summary.published.toLocaleString()} live form${summary.published === 1 ? "" : "s"}`
                    : "Forms ready to publish"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {empty
                  ? "Collect contacts, share a short link or QR, and automate SMS replies."
                  : `${summary.submissions.toLocaleString()} total submissions · ${limits.usedForms}/${limits.maxForms} plan slots used`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/forms/templates"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 gap-1.5 rounded-xl",
              )}
            >
              <FileStack className="h-3.5 w-3.5" />
              Templates
            </Link>
            <Link
              href={createHref}
              aria-disabled={limits.atLimit}
              className={cn(
                buttonVariants({ size: "sm" }),
                "h-9 gap-1.5 rounded-xl",
                limits.atLimit && "pointer-events-none opacity-60",
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              Create form
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Total",
              value: summary.total,
              icon: FileText,
              hint: "All forms",
              tone: "primary" as const,
            },
            {
              label: "Published",
              value: summary.published,
              icon: CheckCircle2,
              hint: "Live & shareable",
              tone: "ok" as const,
            },
            {
              label: "Drafts",
              value: summary.draft,
              icon: Pencil,
              hint: "Still editing",
              tone: "neutral" as const,
            },
            {
              label: "Submissions",
              value: summary.submissions,
              icon: ClipboardList,
              hint: "Across all forms",
              tone: "neutral" as const,
            },
          ].map(({ label, value, icon: Icon, hint, tone }, index) => (
            <div
              key={label}
              className={cn(
                "p-4",
                index < 3 && "border-b border-border/50 xl:border-b-0 xl:border-r",
                index % 2 === 0 && "sm:border-r xl:border-r",
                index < 2 && "xl:border-b-0",
                tone === "primary" && "bg-primary/[0.03]",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg ring-1",
                    tone === "primary" && "bg-primary/10 text-primary ring-primary/15",
                    tone === "ok" &&
                      "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
                    tone === "neutral" &&
                      "bg-muted text-muted-foreground ring-border/60",
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
                  tone === "primary" && "text-primary",
                  tone === "ok" && "text-emerald-700 dark:text-emerald-300",
                )}
              >
                {value.toLocaleString()}
              </p>
              <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>
            </div>
          ))}
        </div>
      </div>

      {empty ? (
        <div className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-sm">
          <div className="border-b border-border/50 bg-gradient-to-br from-primary/[0.10] via-background to-muted/20 px-4 py-5 sm:px-6">
            <h2 className="text-lg font-semibold tracking-tight">Get started</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Build a form from scratch or start from a template. Share a short link or QR
              code, then automate SMS when someone submits.
            </p>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
            {[
              {
                href: createHref,
                icon: Plus,
                title: "Create blank form",
                text: "Name it, add fields, then publish when ready.",
                primary: true,
                disabled: limits.atLimit,
              },
              {
                href: "/dashboard/forms/templates",
                icon: FileStack,
                title: "Browse templates",
                text: "Start from contact, RSVP, or feedback layouts.",
                primary: false,
                disabled: false,
              },
              {
                href: "/dashboard/contacts",
                icon: ClipboardList,
                title: "View contacts",
                text: "Submissions can save straight into your address book.",
                primary: false,
                disabled: false,
              },
            ].map(({ href, icon: Icon, title, text, primary, disabled }) => (
              <Link
                key={title}
                href={disabled ? "/dashboard/forms?error=limit" : href}
                aria-disabled={disabled}
                className={cn(
                  "group rounded-xl border p-4 transition-colors",
                  primary
                    ? "border-primary/30 bg-primary/[0.05] hover:bg-primary/[0.08]"
                    : "border-border/60 bg-muted/10 hover:border-primary/30 hover:bg-primary/[0.04]",
                  disabled && "pointer-events-none opacity-60",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg ring-1",
                    primary
                      ? "bg-primary/15 text-primary ring-primary/20"
                      : "bg-primary/10 text-primary ring-primary/15",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="mt-3 text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1 lg:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, description, or short code…"
                  aria-label="Search forms"
                  className="h-10 rounded-xl bg-background pl-9"
                />
              </div>
              <div
                role="tablist"
                aria-label="Filter forms by status"
                className="inline-flex h-10 w-full items-center overflow-x-auto rounded-xl bg-muted/70 p-1 lg:w-auto"
              >
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="tab"
                    aria-selected={filter === opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={cn(
                      "inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors lg:flex-none",
                      filter === opt.value
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {opt.label}
                    <span className="tabular-nums text-[11px] text-muted-foreground">
                      {counts[opt.value]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {forms.length}
              </span>{" "}
              forms
              {query.trim() ? ` matching “${query.trim()}”` : null}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="px-4 py-14 text-center sm:px-8">
              <p className="text-sm font-medium">No forms match</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Try another search or clear the status filter.
              </p>
              <button
                type="button"
                className="mt-4 text-sm font-semibold text-primary hover:underline"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-4 p-3 sm:p-4 lg:grid-cols-2">
              {filtered.map((form) => (
                <SmartFormCard key={form.id} form={form} siteUrl={siteUrl} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
