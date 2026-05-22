import { getSession } from "@/lib/auth/session";
import { getMessageLogs } from "@/lib/analytics/dashboard";
import { retryFailedMessagesAction } from "@/lib/actions/messages";
import { ReportsFilters } from "@/components/dashboard/reports-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10) || 1;

  const { items, total, totalPages } = await getMessageLogs(session.userId, {
    campaignId: params.campaign,
    status: params.status,
    countryCode: params.country,
    search: params.q,
    page,
    pageSize: 50,
  });

  const failedCount = items.filter((m) => m.status === "FAILED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">SMS logs</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} messages · page {page} of {totalPages || 1}
          </p>
        </div>
        {failedCount > 0 && (
          <form action={retryFailedMessagesAction}>
            {params.campaign && (
              <input type="hidden" name="campaignId" value={params.campaign} />
            )}
            <Button type="submit" variant="outline">
              Retry failed in view
            </Button>
          </form>
        )}
      </div>

      {params.retried && (
        <p className="text-sm text-green-600 dark:text-green-400">
          Retry queued for {params.retried} message(s).
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportsFilters
            campaignId={params.campaign}
            status={params.status ?? "all"}
            country={params.country ?? "all"}
            q={params.q}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery log</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Delivered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No messages match your filters
                  </TableCell>
                </TableRow>
              ) : (
                items.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-xs">{m.recipient}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.status}</Badge>
                    </TableCell>
                    <TableCell>{m.countryCode ?? "—"}</TableCell>
                    <TableCell className="max-w-[120px] truncate">
                      {m.campaign?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {m.sentAt?.toLocaleString() ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {m.deliveredAt?.toLocaleString() ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex gap-2 mt-4 justify-center">
              {page > 1 && (
                <a
                  href={`?${new URLSearchParams({ ...params, page: String(page - 1) } as Record<string, string>).toString()}`}
                  className="text-sm text-primary hover:underline"
                >
                  Previous
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`?${new URLSearchParams({ ...params, page: String(page + 1) } as Record<string, string>).toString()}`}
                  className="text-sm text-primary hover:underline"
                >
                  Next
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
