"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { extractDisplayFields } from "@/lib/smart-forms/export";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ClipboardList, Download, Search } from "lucide-react";

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

export function ResponsesDashboard({
  formId,
  formName,
  responses,
}: {
  formId: string;
  formName: string;
  responses: ResponseRow[];
}) {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [contactFilter, setContactFilter] = useState("all");
  const [reviewedFilter, setReviewedFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const sources = useMemo(() => {
    const set = new Set(responses.map((r) => r.source).filter(Boolean) as string[]);
    return ["all", ...Array.from(set)];
  }, [responses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return responses.filter((row) => {
      if (sourceFilter !== "all" && row.source !== sourceFilter) return false;
      if (contactFilter !== "all" && row.contactSaveStatus !== contactFilter) return false;
      if (reviewedFilter === "reviewed" && !row.reviewedAt) return false;
      if (reviewedFilter === "unreviewed" && row.reviewedAt) return false;
      if (!q) return true;
      const { name, phone, email } = extractDisplayFields(row.answers);
      const hay = [name, phone, email, ...row.answers.map((a) => a.value)].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [responses, query, sourceFilter, contactFilter, reviewedFilter]);

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
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, email…"
            className="pl-9 h-11"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
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
            onChange={(e) => setContactFilter(e.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="all">All contact status</option>
            <option value="SAVED">Saved</option>
            <option value="SKIPPED">Skipped</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
          <select
            value={reviewedFilter}
            onChange={(e) => setReviewedFilter(e.target.value)}
            className="h-10 rounded-lg border bg-background px-3 text-sm"
          >
            <option value="all">All review status</option>
            <option value="reviewed">Reviewed</option>
            <option value="unreviewed">Unreviewed</option>
          </select>
          <a
            href={exportHref}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <Download className="h-4 w-4" />
            Export CSV{selected.size > 0 ? ` (${selected.size})` : ""}
          </a>
        </div>
      </div>

      <AppCard>
        <AppCardBody className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="p-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="p-3 font-medium">Submitted</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium">Phone</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Source</th>
                <th className="p-3 font-medium">Contact</th>
                <th className="p-3 font-medium">SMS</th>
                <th className="p-3 font-medium">Reviewed</th>
                <th className="p-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const { name, phone, email } = extractDisplayFields(row.answers);
                return (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={() => toggleOne(row.id)}
                        aria-label="Select row"
                      />
                    </td>
                    <td className="p-3 whitespace-nowrap text-muted-foreground">
                      {new Date(row.submittedAt).toLocaleString()}
                    </td>
                    <td className="p-3">{name || "—"}</td>
                    <td className="p-3 font-mono text-xs">{phone || "—"}</td>
                    <td className="p-3">{email || "—"}</td>
                    <td className="p-3">{row.source ?? "—"}</td>
                    <td className="p-3">
                      <Badge
                        variant="secondary"
                        className={cn("text-xs", CONTACT_BADGE[row.contactSaveStatus])}
                      >
                        {row.contactSaveStatus.toLowerCase()}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-xs" title={row.smsError ?? undefined}>
                        {row.smsStatus.toLowerCase()}
                      </span>
                    </td>
                    <td className="p-3">{row.reviewedAt ? "Yes" : "No"}</td>
                    <td className="p-3">
                      <Link
                        href={`/dashboard/forms/${formId}/responses/${row.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No responses match your filters.</p>
          ) : null}
        </AppCardBody>
      </AppCard>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {responses.length} responses for {formName}.
      </p>
    </div>
  );
}
