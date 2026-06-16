import Link from "next/link";
import { format } from "date-fns";
import { getAdminSupportDashboard } from "@/lib/admin/platform-dashboard";
import { adminUpdateSupportTicketAction } from "@/lib/actions/admin-platform";
import {
  AdminPage,
  AdminPageHeader,
  AdminStatCard,
  AdminCard,
  AdminEmpty,
  AdminAlert,
} from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { LifeBuoy, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["all", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const data = await getAdminSupportDashboard(params.q, params.status);

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Support tickets"
        description="Review and update member support requests from across the platform."
        icon={LifeBuoy}
      />

      {params.saved === "ticket" && (
        <AdminAlert variant="success">Ticket status updated.</AdminAlert>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="Open tickets" value={data.stats.open} variant="primary" />
        <AdminStatCard label="In this view" value={data.tickets.length} />
        <AdminStatCard
          label="Statuses tracked"
          value={data.stats.byStatus.length}
          hint="OPEN · IN_PROGRESS · RESOLVED · CLOSED"
        />
      </div>

      <AdminCard title="Filter tickets">
        <form className="flex flex-col sm:flex-row gap-3">
          <Input
            name="q"
            placeholder="Search subject, message, or member…"
            defaultValue={data.query}
            className="sm:max-w-xs"
          />
          <select
            name="status"
            defaultValue={data.statusFilter}
            className="flex h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All statuses" : s.replace("_", " ")}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>
      </AdminCard>

      <AdminCard
        title="Tickets"
        description={
          data.tickets.length === 0
            ? "No tickets match your filters"
            : `${data.tickets.length} ticket${data.tickets.length !== 1 ? "s" : ""}`
        }
      >
        {data.tickets.length === 0 ? (
          <AdminEmpty>No support tickets found.</AdminEmpty>
        ) : (
          <div className="space-y-4">
            {data.tickets.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-border/60 p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{t.subject}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {t.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                      {t.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(t.createdAt, "PPp")}
                    </p>
                  </div>
                  <div className="shrink-0 space-y-2 sm:text-right">
                    <Link
                      href={`/admin/members/${t.user.id}?tab=activity`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "gap-1 w-full sm:w-auto",
                      )}
                    >
                      {t.user.fullName}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <p className="text-xs text-muted-foreground">{t.user.phone}</p>
                  </div>
                </div>
                <form action={adminUpdateSupportTicketAction} className="flex flex-wrap gap-2 items-center">
                  <input type="hidden" name="ticketId" value={t.id} />
                  <input type="hidden" name="returnTo" value="/admin/support" />
                  <select
                    name="status"
                    defaultValue={t.status}
                    className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {STATUS_FILTERS.filter((s) => s !== "all").map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" variant="secondary">
                    Update status
                  </Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
