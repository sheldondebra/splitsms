import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import { adminUpdateSmartFormStatusAction } from "@/lib/actions/admin-platform";
import type { AdminFormsDashboard } from "@/lib/admin/forms-dashboard";
import {
  buildAdminFormsHref,
  formsPageList,
} from "@/lib/admin/forms-list-url";
import {
  AdminAlert,
  AdminCard,
  AdminEmpty,
  AdminPage,
  AdminPageHeader,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  FileBarChart2,
  FileText,
  Inbox,
  MessageSquare,
  Shield,
  Users,
} from "lucide-react";

const STATUS_FILTERS = ["all", "DRAFT", "PUBLISHED", "CLOSED"] as const;

const STATUS_CLASS: Record<string, string> = {
  DRAFT: "border-border bg-muted/50 text-muted-foreground",
  PUBLISHED:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  CLOSED: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
};

function statusLabel(status: string) {
  if (status === "DRAFT") return "Draft";
  if (status === "PUBLISHED") return "Published";
  if (status === "CLOSED") return "Closed";
  return status;
}

export function AdminFormsView({
  data,
  saved,
  error,
}: {
  data: AdminFormsDashboard;
  saved?: string;
  error?: string;
}) {
  const { pagination, stats } = data;
  const rangeStart =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const rangeEnd = Math.min(pagination.page * pagination.pageSize, pagination.total);
  const filter = { q: data.query, status: data.statusFilter };
  const returnTo = buildAdminFormsHref({
    ...filter,
    page: pagination.page,
  });

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Smart Forms"
        description="Every member form on the platform — responses, views, and publish status."
        icon={FileText}
      />

      {saved === "form" && <AdminAlert variant="success">Form status updated.</AdminAlert>}
      {error === "form" && (
        <AdminAlert variant="warning">Could not update that form status.</AdminAlert>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <AdminStatCard label="Forms" value={stats.total.toLocaleString()} icon={FileText} variant="primary" />
        <AdminStatCard label="Published" value={stats.published.toLocaleString()} hint={`${stats.draft} draft · ${stats.closed} closed`} />
        <AdminStatCard label="Owners" value={stats.owners.toLocaleString()} icon={Users} />
        <AdminStatCard label="Responses" value={stats.totalResponses.toLocaleString()} icon={Inbox} />
        <AdminStatCard label="Last 24 hours" value={stats.responses24h.toLocaleString()} />
        <AdminStatCard
          label="Views"
          value={stats.views.toLocaleString()}
          icon={Eye}
          hint={`${stats.smsAutomations} SMS automations`}
        />
      </div>

      <AdminCard
        title="Forms"
        description={`${pagination.total.toLocaleString()} matching`}
      >
        <div className="-mx-5 -mt-5">
          <form
            action="/admin/forms"
            className="flex flex-col gap-2 border-b border-border/50 px-5 py-3 sm:flex-row sm:items-center"
          >
            <Input
              name="q"
              defaultValue={data.query}
              placeholder="Search name, short code, member, or ID…"
              className="h-9 text-sm sm:max-w-sm"
              aria-label="Search forms"
            />
            <select
              name="status"
              defaultValue={data.statusFilter}
              className="flex h-9 min-w-[160px] rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Filter by status"
            >
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All statuses" : statusLabel(status)}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" className="h-9">
              Apply
            </Button>
            {(data.query || data.statusFilter !== "all") && (
              <Link
                href="/admin/forms"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-9")}
              >
                Clear
              </Link>
            )}
          </form>
        </div>

        {data.forms.length === 0 ? (
          <div className="pt-4">
            <AdminEmpty dense>No forms match your filters.</AdminEmpty>
          </div>
        ) : (
          <>
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="whitespace-nowrap px-5 py-2.5 font-semibold">Form</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Owner</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Status</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-right">Views</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-right">Responses</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Last</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Flags</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold">Updated</th>
                    <th className="whitespace-nowrap px-5 py-2.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.forms.map((form) => {
                    const last = form.lastSubmissionAt ? new Date(form.lastSubmissionAt) : null;
                    const updated = new Date(form.updatedAt);
                    return (
                      <tr key={form.id} className="border-t border-border/40 hover:bg-muted/25">
                        <td className="max-w-[16rem] px-5 py-2.5 align-top">
                          <p className="truncate font-medium">{form.name}</p>
                          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                            /f/{form.shortCode}
                            <span className="text-muted-foreground/80"> · {form.fieldCount} fields</span>
                          </p>
                        </td>
                        <td className="max-w-[12rem] px-3 py-2.5 align-top">
                          <Link
                            href={`/admin/members/${form.owner.id}?tab=products`}
                            className="block truncate text-sm font-medium hover:underline"
                          >
                            {form.owner.fullName}
                          </Link>
                          <p className="truncate font-mono text-[11px] text-muted-foreground">
                            {form.owner.accountId ? `#${form.owner.accountId}` : form.owner.phone}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 align-top">
                          <Badge
                            variant="outline"
                            className={cn("h-5 px-1.5 text-[10px] font-semibold", STATUS_CLASS[form.status])}
                          >
                            {statusLabel(form.status)}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 align-top text-right tabular-nums">
                          {form.views.toLocaleString()}
                          {form.views > 0 ? (
                            <p className="text-[11px] text-muted-foreground">{form.conversionRate}% conv.</p>
                          ) : null}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 align-top text-right font-medium tabular-nums">
                          {form.responses.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 align-top">
                          {last ? (
                            <p className="text-xs" title={format(last, "PPpp")}>
                              {formatDistanceToNow(last, { addSuffix: true })}
                            </p>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <div className="flex flex-wrap gap-1">
                            {form.smsOn ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800 dark:text-sky-200">
                                <MessageSquare className="h-3 w-3" />
                                SMS
                              </span>
                            ) : null}
                            {form.captchaEnabled ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                <Shield className="h-3 w-3" />
                                Captcha
                              </span>
                            ) : null}
                            {form.saveToContacts ? (
                              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                Contacts
                              </span>
                            ) : null}
                            {!form.smsOn && !form.captchaEnabled && !form.saveToContacts ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 align-top">
                          <p className="text-xs tabular-nums" title={format(updated, "PPpp")}>
                            {format(updated, "MMM d, HH:mm")}
                          </p>
                        </td>
                        <td className="px-5 py-2.5 align-top">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/admin/forms/${form.id}/report`}
                              className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "h-8 gap-1 px-2 text-xs",
                              )}
                            >
                              <FileBarChart2 className="h-3.5 w-3.5" />
                              Report
                            </Link>
                            {form.status === "PUBLISHED" ? (
                              <a
                                href={`/f/${form.shortCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={cn(
                                  buttonVariants({ variant: "ghost", size: "sm" }),
                                  "h-8 w-8 px-0",
                                )}
                                title="View public form"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : null}
                            <form action={adminUpdateSmartFormStatusAction} className="flex items-center gap-1.5">
                              <input type="hidden" name="formId" value={form.id} />
                              <input type="hidden" name="returnTo" value={returnTo} />
                              <select
                                name="status"
                                defaultValue={form.status}
                                className="flex h-8 rounded-md border border-input bg-background px-2 text-xs"
                                aria-label={`Set status for ${form.name}`}
                              >
                                {STATUS_FILTERS.filter((s) => s !== "all").map((status) => (
                                  <option key={status} value={status}>
                                    {statusLabel(status)}
                                  </option>
                                ))}
                              </select>
                              <Button type="submit" size="sm" variant="secondary" className="h-8 px-2 text-xs">
                                Set
                              </Button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="-mx-5 -mb-5 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 px-5 py-2.5">
              <p className="text-xs tabular-nums text-muted-foreground">
                {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of{" "}
                {pagination.total.toLocaleString()}
              </p>
              {pagination.totalPages > 1 ? (
                <div className="flex items-center gap-1.5">
                  <Link
                    href={buildAdminFormsHref({ ...filter, page: Math.max(1, pagination.page - 1) })}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-8 gap-1 text-xs",
                      pagination.page <= 1 && "pointer-events-none opacity-50",
                    )}
                    aria-disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </Link>
                  {formsPageList(pagination.page, pagination.totalPages).map((item, idx) =>
                    item === "gap" ? (
                      <span key={`gap-${idx}`} className="px-1 text-xs text-muted-foreground">
                        …
                      </span>
                    ) : (
                      <Link
                        key={item}
                        href={buildAdminFormsHref({ ...filter, page: item })}
                        className={cn(
                          buttonVariants({
                            variant: item === pagination.page ? "default" : "outline",
                            size: "sm",
                          }),
                          "h-8 w-8 px-0 text-xs tabular-nums",
                        )}
                      >
                        {item}
                      </Link>
                    ),
                  )}
                  <Link
                    href={buildAdminFormsHref({
                      ...filter,
                      page: Math.min(pagination.totalPages, pagination.page + 1),
                    })}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "h-8 gap-1 text-xs",
                      pagination.page >= pagination.totalPages && "pointer-events-none opacity-50",
                    )}
                    aria-disabled={pagination.page >= pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : null}
            </div>
          </>
        )}
      </AdminCard>
    </AdminPage>
  );
}
