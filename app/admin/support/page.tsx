import Link from "next/link";
import { format } from "date-fns";
import { getAdminSupportDashboard } from "@/lib/admin/platform-dashboard";
import { loadSupportPresence } from "@/lib/support/presence";
import {
  AdminPage,
  AdminPageHeader,
  AdminStatCard,
  AdminCard,
  AdminEmpty,
  AdminAlert,
} from "@/components/admin/admin-page-shell";
import { AdminSupportTicketCard } from "@/components/admin/admin-support-ticket-card";
import { AdminSupportPresencePanel } from "@/components/admin/admin-support-presence-panel";
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
  searchParams: Promise<{ q?: string; status?: string; saved?: string; error?: string }>;
}) {
  const params = await searchParams;
  const [data, presence] = await Promise.all([
    getAdminSupportDashboard(params.q, params.status),
    loadSupportPresence(),
  ]);

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Support tickets"
        description="Reply to members, update ticket status, and track open requests."
        icon={LifeBuoy}
      />

      {params.saved === "ticket" && (
        <AdminAlert variant="success">Ticket status updated.</AdminAlert>
      )}
      {params.saved === "reply" && (
        <AdminAlert variant="success">
          Reply sent — the member was notified by email and SMS.
        </AdminAlert>
      )}
      {params.error === "reply" && (
        <AdminAlert variant="warning">Enter a reply message before sending.</AdminAlert>
      )}
      {params.error === "ticket" && (
        <AdminAlert variant="warning">Could not update that ticket.</AdminAlert>
      )}

      {params.saved === "presence" && (
        <AdminAlert variant="success">Support chat status updated for members.</AdminAlert>
      )}
      {params.error === "presence" && (
        <AdminAlert variant="warning">Could not update support chat status.</AdminAlert>
      )}

      <AdminCard
        title="Support chat status"
        description="Members see this live indicator in the dashboard support chat."
      >
        <AdminSupportPresencePanel presence={presence} />
      </AdminCard>

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
              <div key={t.id} className="space-y-2">
                <div className="flex justify-end">
                  <Link
                    href={`/admin/members/${t.user.id}?tab=activity`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "gap-1",
                    )}
                  >
                    {t.user.fullName}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <AdminSupportTicketCard
                  ticket={t}
                  returnTo="/admin/support"
                />
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
