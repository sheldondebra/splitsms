"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { extractDisplayFields } from "@/lib/smart-forms/export";
import { retryRespondentSmsBulkAction } from "@/lib/actions/smart-form-automation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ClipboardList, Download, RefreshCw, Search, Send } from "lucide-react";

export type ResponseRow = {
  id: string;
  submittedAt: string;
  source: string | null;
  contactSaveStatus: string;
  smsStatus: string;
  smsError: string | null;
  reviewedAt: string | null;
  answers: { fieldKey: string; fieldLabel: string; value: string }[];
};

const CONTACT_BADGE: Record<string, string> = {
  SAVED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  SKIPPED: "bg-muted text-muted-foreground",
  FAILED: "bg-destructive/10 text-destructive",
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

const SMS_BADGE: Record<string, string> = {
  SENT: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  DELIVERED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  FAILED: "bg-destructive/10 text-destructive",
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  SKIPPED: "bg-muted text-muted-foreground",
};

const SMS_SENT_STATUSES = new Set(["SENT", "DELIVERED"]);

function getAnswerValue(row: ResponseRow, fieldKey: string) {
  return row.answers.find((answer) => answer.fieldKey === fieldKey)?.value ?? "";
}

function isNameOrPhoneField(field: { key: string; label: string }) {
  const text = `${field.key} ${field.label}`.toLowerCase();
  return text.includes("name") || text.includes("phone");
}

function buildSendToUrl(rows: ResponseRow[]) {
  const phones = rows
    .map((row) => extractDisplayFields(row.answers).phone)
    .filter((phone): phone is string => Boolean(phone));
  if (phones.length === 0) return "";
  const params = new URLSearchParams({ to: phones.join(",") });
  return `/dashboard/send?${params.toString()}`;
}

export function ResponsesDashboard({
  formId,
  formName,
  responses,
}: {
  formId: string;
  formName: string;
  responses: ResponseRow[];
}) {
  const router = useRouter();
  const [isRetrying, startRetry] = useTransition();
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [contactFilter, setContactFilter] = useState("all");
  const [smsFilter, setSmsFilter] = useState("all");
  const [reviewedFilter, setReviewedFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const sources = useMemo(() => {
    const set = new Set(responses.map((r) => r.source).filter(Boolean) as string[]);
    return ["all", ...Array.from(set)];
  }, [responses]);

  const fieldColumns = useMemo(() => {
    const columns = new Map<string, string>();
    for (const row of responses) {
      for (const answer of row.answers) {
        if (!columns.has(answer.fieldKey)) {
          columns.set(answer.fieldKey, answer.fieldLabel);
        }
      }
    }
    return Array.from(columns, ([key, label]) => ({ key, label }));
  }, [responses]);

  const filterableFieldColumns = useMemo(
    () => fieldColumns.filter((field) => !isNameOrPhoneField(field)),
    [fieldColumns],
  );

  const fieldFilterOptions = useMemo(() => {
    const options = new Map<string, string[]>();
    for (const field of fieldColumns) {
      const values = new Set<string>();
      for (const row of responses) {
        const value = getAnswerValue(row, field.key).trim();
        if (value) values.add(value);
      }
      options.set(field.key, Array.from(values).sort((a, b) => a.localeCompare(b)));
    }
    return options;
  }, [fieldColumns, responses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const activeFieldFilters = Object.entries(fieldFilters).filter(([, value]) => value.trim());
    return responses.filter((row) => {
      if (sourceFilter !== "all" && row.source !== sourceFilter) return false;
      if (contactFilter !== "all" && row.contactSaveStatus !== contactFilter) return false;
      if (smsFilter === "sent" && !SMS_SENT_STATUSES.has(row.smsStatus)) return false;
      if (smsFilter === "not_sent" && SMS_SENT_STATUSES.has(row.smsStatus)) return false;
      if (
        smsFilter !== "all" &&
        smsFilter !== "sent" &&
        smsFilter !== "not_sent" &&
        row.smsStatus !== smsFilter
      ) {
        return false;
      }
      if (reviewedFilter === "reviewed" && !row.reviewedAt) return false;
      if (reviewedFilter === "unreviewed" && row.reviewedAt) return false;
      for (const [fieldKey, value] of activeFieldFilters) {
        if (getAnswerValue(row, fieldKey).trim() !== value.trim()) {
          return false;
        }
      }
      if (!q) return true;
      const { name, phone, email } = extractDisplayFields(row.answers);
      const hay = [name, phone, email, ...row.answers.map((a) => a.value)].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [responses, query, sourceFilter, contactFilter, smsFilter, reviewedFilter, fieldFilters]);

  const stats = useMemo(
    () => [
      { label: "Visible", value: filtered.length, hint: `${responses.length} total` },
      {
        label: "Reviewed",
        value: responses.filter((row) => row.reviewedAt).length,
        hint: "Checked submissions",
      },
      {
        label: "Contacts saved",
        value: responses.filter((row) => row.contactSaveStatus === "SAVED").length,
        hint: "Added to contacts",
      },
      {
        label: "SMS failed",
        value: responses.filter((row) => row.smsStatus === "FAILED").length,
        hint: "Needs attention",
        hot: responses.some((row) => row.smsStatus === "FAILED"),
      },
    ],
    [filtered.length, responses],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const visibleRows = filtered.slice(pageStart, pageStart + pageSize);
  const fieldFilterCount = Object.values(fieldFilters).filter((value) => value.trim()).length;
  const selectedRows = responses.filter((row) => selected.has(row.id));
  const selectedSendHref = buildSendToUrl(selectedRows);
  const resendScopeRows = selected.size > 0 ? selectedRows : filtered;
  const resendTargetRows = resendScopeRows.filter((row) => !SMS_SENT_STATUSES.has(row.smsStatus));

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((r) => r.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateFieldFilter(fieldKey: string, value: string) {
    setPage(1);
    setFieldFilters((prev) => {
      const next = { ...prev };
      if (value) next[fieldKey] = value;
      else delete next[fieldKey];
      return next;
    });
  }

  function retryNotSentSms() {
    if (resendTargetRows.length === 0) {
      toast.info("No not-sent SMS to resend.");
      return;
    }

    startRetry(async () => {
      const result = await retryRespondentSmsBulkAction(
        formId,
        resendTargetRows.map((row) => row.id),
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("SMS resend complete", {
        description: `${result.sent} sent, ${result.failed} failed, ${result.skipped} skipped.`,
      });
      router.refresh();
    });
  }

  const exportHref =
    selected.size > 0
      ? `/api/dashboard/forms/${formId}/responses/export?ids=${[...selected].join(",")}`
      : `/api/dashboard/forms/${formId}/responses/export`;

  if (responses.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No responses yet"
        description="Publish your form and share the short link to start collecting submissions."
        actionLabel="Share form"
        actionHref={`/dashboard/forms/${formId}/share`}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
            placeholder="Search name, phone, email…"
            className="pl-9 h-11"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => {
              setPage(1);
              setSourceFilter(e.target.value);
            }}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            {sources.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All sources" : s}
              </option>
            ))}
          </select>
          <select
            value={contactFilter}
            onChange={(e) => {
              setPage(1);
              setContactFilter(e.target.value);
            }}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="all">All contact status</option>
            <option value="SAVED">Saved</option>
            <option value="SKIPPED">Skipped</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
          <select
            value={smsFilter}
            onChange={(e) => {
              setPage(1);
              setSmsFilter(e.target.value);
            }}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="all">All SMS status</option>
            <option value="sent">SMS sent</option>
            <option value="not_sent">SMS not sent</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
            <option value="NONE">None</option>
            <option value="SKIPPED">Skipped</option>
          </select>
          <select
            value={reviewedFilter}
            onChange={(e) => {
              setPage(1);
              setReviewedFilter(e.target.value);
            }}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="all">All review status</option>
            <option value="reviewed">Reviewed</option>
            <option value="unreviewed">Unreviewed</option>
          </select>
          <a href={exportHref} className={cn(buttonVariants({ size: "lg" }), "h-10 gap-2")}>
            <Download className="h-4 w-4" />
            Export CSV{selected.size > 0 ? ` (${selected.size})` : ""}
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/15 px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Excel-style full data table</p>
          <p className="text-xs text-muted-foreground">
            Every submitted field is shown as a column. Use dropdown filters to narrow the data.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedSendHref ? (
            <a
              href={selectedSendHref}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 gap-1.5")}
            >
              <Send className="h-3.5 w-3.5" />
              Send SMS to selected
            </a>
          ) : (
            <Button type="button" variant="outline" size="sm" disabled className="h-8 gap-1.5">
              <Send className="h-3.5 w-3.5" />
              Send SMS to selected
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            disabled={isRetrying || resendTargetRows.length === 0}
            onClick={retryNotSentSms}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRetrying && "animate-spin")} />
            {selected.size > 0 ? "Resend selected not sent" : "Resend all not sent"}
          </Button>
          <span className="text-xs text-muted-foreground">
            {fieldColumns.length} data field{fieldColumns.length === 1 ? "" : "s"} detected
          </span>
          {fieldFilterCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                setPage(1);
                setFieldFilters({});
              }}
            >
              Clear {fieldFilterCount} field filter{fieldFilterCount === 1 ? "" : "s"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.label}
            className={cn(
              "rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm",
              item.hot && "border-destructive/30 bg-destructive/[0.04]",
            )}
          >
            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
            <p
              className={cn(
                "mt-1 text-2xl font-bold tracking-tight",
                item.hot && "text-destructive",
              )}
            >
              {item.value}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
          </div>
        ))}
      </div>

      {filterableFieldColumns.length > 0 ? (
        <AppCard>
          <AppCardBody className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Data field filters</p>
                <p className="text-xs text-muted-foreground">
                  Filters are created from submitted fields. Name and phone fields stay visible but are
                  not included here.
                </p>
              </div>
              {fieldFilterCount > 0 ? (
                <Badge variant="secondary" className="text-xs">
                  {fieldFilterCount} active
                </Badge>
              ) : null}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filterableFieldColumns.map((field) => (
                <label key={field.key} className="space-y-1.5">
                  <span className="block truncate text-xs font-medium text-muted-foreground">
                    {field.label}
                  </span>
                  <select
                    value={fieldFilters[field.key] ?? ""}
                    onChange={(e) => updateFieldFilter(field.key, e.target.value)}
                    className="h-9 w-full rounded-lg border border-input bg-background px-2 text-sm"
                    title={`Filter ${field.label}`}
                  >
                    <option value="">All {field.label}</option>
                    {(fieldFilterOptions.get(field.key) ?? []).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </AppCardBody>
        </AppCard>
      ) : null}

      <AppCard>
        <AppCardBody className="p-0 overflow-x-auto">
          <table className="w-full min-w-[960px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left">
                <th className="sticky left-0 z-20 w-10 border-b border-r bg-muted/60 p-3">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="border-b bg-muted/60 p-3 font-medium">Submitted</th>
                {fieldColumns.map((field) => (
                  <th key={field.key} className="min-w-[220px] border-b bg-muted/60 p-3 font-medium">
                    {field.label}
                  </th>
                ))}
                <th className="border-b bg-muted/60 p-3 font-medium">Source</th>
                <th className="border-b bg-muted/60 p-3 font-medium">Contact</th>
                <th className="border-b bg-muted/60 p-3 font-medium">SMS</th>
                <th className="border-b bg-muted/60 p-3 font-medium">Reviewed</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-muted/20">
                  <td className="sticky left-0 z-10 border-b border-r bg-background p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleOne(row.id)}
                      aria-label="Select row"
                    />
                  </td>
                  <td className="border-b p-3 whitespace-nowrap text-muted-foreground">
                    {new Date(row.submittedAt).toLocaleString()}
                  </td>
                  {fieldColumns.map((field) => {
                    const value = getAnswerValue(row, field.key);
                    return (
                      <td key={`${row.id}-${field.key}`} className="max-w-[320px] border-b p-3 align-top">
                        <span className="whitespace-pre-wrap break-words">{value || "—"}</span>
                      </td>
                    );
                  })}
                  <td className="border-b p-3">{row.source ?? "—"}</td>
                  <td className="border-b p-3">
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", CONTACT_BADGE[row.contactSaveStatus])}
                    >
                      {row.contactSaveStatus.toLowerCase()}
                    </Badge>
                  </td>
                  <td className="border-b p-3">
                    <Badge variant="secondary" className={cn("text-xs", SMS_BADGE[row.smsStatus])}>
                      {row.smsStatus.toLowerCase()}
                    </Badge>
                  </td>
                  <td className="border-b p-3">
                    <Badge variant={row.reviewedAt ? "secondary" : "outline"} className="text-xs">
                      {row.reviewedAt ? "reviewed" : "open"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No responses match your filters.</p>
          ) : null}
        </AppCardBody>
      </AppCard>

      <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length === 0 ? 0 : pageStart + 1}-
          {Math.min(pageStart + pageSize, filtered.length)} of {filtered.length} filtered responses
          for {formName}.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value));
            }}
            className="h-8 rounded-lg border bg-background px-2 text-xs"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
