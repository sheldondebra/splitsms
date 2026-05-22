import { getSession } from "@/lib/auth/session";
import { getMessageLogs, getDashboardOverview } from "@/lib/analytics/dashboard";
import { retryFailedMessagesAction } from "@/lib/actions/messages";
import { ReportSummary } from "@/components/dashboard/report-summary";
import { ReportsFilters } from "@/components/dashboard/reports-filters";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { AppPage, PageHeader, AppCard } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, BarChart3 } from "lucide-react";
import { STATUS_LABELS } from "@/lib/ux/messages";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    campaign?: string;
    status?: string;
    country?: string;
    q?: string;
    page?: string;
    retried?: string;
    sent?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10) || 1;

  const [overview, { items, total, totalPages }] = await Promise.all([
    getDashboardOverview(session.userId),
    getMessageLogs(session.userId, {
      campaignId: params.campaign,
      status: params.status,
      countryCode: params.country,
      search: params.q,
      page,
      pageSize: 30,
    }),
  ]);

  const failedInView = items.filter((m) => m.status === "FAILED").length;

  return (
    <AppPage medium>
      <PageHeader
        title="Message results"
        description="See which messages were delivered, failed, or still on the way."
        icon={BarChart3}
        mobileDescription="Delivery status for your recent messages."
      />

      {params.sent && (
        <FriendlyAlert success="1" successMessage="Your messages were sent successfully." />
      )}
      {params.retried && (
        <FriendlyAlert
          success="1"
          successMessage={`We are resending ${params.retried} failed message(s).`}
        />
      )}

      <ReportSummary
        delivered={overview.delivered}
        failed={overview.failed}
        pending={overview.pending}
      />

      {failedInView > 0 && (
        <form action={retryFailedMessagesAction}>
          {params.campaign && (
            <input type="hidden" name="campaignId" value={params.campaign} />
          )}
          <Button type="submit" variant="outline" className="w-full md:w-auto min-h-11">
            Try sending failed messages again
          </Button>
        </form>
      )}

      <details className="app-card rounded-2xl px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium min-h-11 flex items-center touch-target-lg">
          Advanced filters
        </summary>
        <div className="mt-4 pt-4 border-t">
          <ReportsFilters
            campaignId={params.campaign}
            status={params.status ?? "all"}
            country={params.country ?? "all"}
            q={params.q}
          />
        </div>
      </details>

      <AppCard>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Recent messages</CardTitle>
          <p className="text-sm text-muted-foreground">
            {total} message{total === 1 ? "" : "s"}
            {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
          </p>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              icon={Send}
              title="No messages to show yet"
              description="When you send SMS, your delivery results will appear here."
              actionLabel="Send SMS"
              actionHref="/dashboard/send"
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((m) => (
                <li key={m.id} className="flex justify-between gap-3 py-4 first:pt-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{m.recipient}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{m.body}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-semibold ${
                        m.status === "DELIVERED"
                          ? "text-emerald-600"
                          : m.status === "FAILED"
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }`}
                    >
                      {STATUS_LABELS[m.status] ?? m.status}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {m.createdAt.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {totalPages > 1 && (
            <div className="flex gap-6 mt-6 justify-center text-sm font-medium">
              {page > 1 && (
                <a
                  href={`?${new URLSearchParams({ ...params, page: String(page - 1) } as Record<string, string>).toString()}`}
                  className="text-primary hover:underline min-h-11 flex items-center"
                >
                  Previous
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`?${new URLSearchParams({ ...params, page: String(page + 1) } as Record<string, string>).toString()}`}
                  className="text-primary hover:underline min-h-11 flex items-center"
                >
                  Next
                </a>
              )}
            </div>
          )}
        </CardContent>
      </AppCard>
    </AppPage>
  );
}
