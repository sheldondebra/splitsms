import Link from "next/link";
import { format } from "date-fns";
import { getAdminCampaignsDashboard } from "@/lib/admin/platform-dashboard";
import { adminUpdateCampaignStatusAction } from "@/lib/actions/admin-platform";
import {
  AdminPage,
  AdminPageHeader,
  AdminStatCard,
  AdminCard,
  AdminEmpty,
  AdminAlert,
  AdminListRow,
} from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  "all",
  "DRAFT",
  "SCHEDULED",
  "SENDING",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
] as const;

export default async function AdminCampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const data = await getAdminCampaignsDashboard(params.q, params.status);

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Campaigns"
        description="Monitor and intervene in member bulk SMS campaigns across the platform."
        icon={Megaphone}
      />

      {params.saved === "campaign" && (
        <AdminAlert variant="success">Campaign status updated.</AdminAlert>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="Active" value={data.stats.active} variant="primary" />
        <AdminStatCard label="In this view" value={data.campaigns.length} />
        <AdminStatCard
          label="Scheduled"
          value={data.stats.byStatus.find((s) => s.status === "SCHEDULED")?.count ?? 0}
        />
      </div>

      <AdminCard title="Filter campaigns">
        <form className="flex flex-col sm:flex-row gap-3">
          <Input
            name="q"
            placeholder="Search campaign or member…"
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
                {s === "all" ? "All statuses" : s}
              </option>
            ))}
          </select>
          <Button type="submit" variant="secondary">
            Apply
          </Button>
        </form>
      </AdminCard>

      <AdminCard title="Campaigns">
        {data.campaigns.length === 0 ? (
          <AdminEmpty>No campaigns match your filters.</AdminEmpty>
        ) : (
          <div className="-my-1">
            {data.campaigns.map((c) => (
              <AdminListRow key={c.id}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{c.name}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.recipientCount.toLocaleString()} recipients
                    {c.contactGroup ? ` · ${c.contactGroup.name}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.scheduledAt
                      ? `Scheduled ${format(c.scheduledAt, "PPp")}`
                      : `Created ${format(c.createdAt, "PP")}`}
                  </p>
                  <Link
                    href={`/admin/members/${c.user.id}?tab=products`}
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 px-2 mt-1")}
                  >
                    {c.user.fullName} · {c.user.phone}
                  </Link>
                </div>
                {["SCHEDULED", "SENDING", "PAUSED", "DRAFT"].includes(c.status) && (
                  <form
                    action={adminUpdateCampaignStatusAction}
                    className="flex flex-wrap items-center gap-2 shrink-0"
                  >
                    <input type="hidden" name="campaignId" value={c.id} />
                    <input type="hidden" name="returnTo" value="/admin/campaigns" />
                    <select
                      name="status"
                      defaultValue={c.status === "PAUSED" ? "PAUSED" : "CANCELLED"}
                      className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      {c.status !== "PAUSED" && <option value="PAUSED">Pause</option>}
                      <option value="CANCELLED">Cancel</option>
                      <option value="DRAFT">Revert to draft</option>
                    </select>
                    <Button type="submit" size="sm" variant="secondary">
                      Apply
                    </Button>
                  </form>
                )}
              </AdminListRow>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
