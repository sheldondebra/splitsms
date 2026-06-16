import Link from "next/link";
import { format } from "date-fns";
import { getAdminFormsDashboard } from "@/lib/admin/platform-dashboard";
import { adminUpdateSmartFormStatusAction } from "@/lib/actions/admin-platform";
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
import { FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = ["all", "DRAFT", "PUBLISHED", "CLOSED"] as const;

export default async function AdminFormsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const data = await getAdminFormsDashboard(params.q, params.status);

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="Smart Forms"
        description="Platform-wide view of member forms, response counts, and publish status."
        icon={FileText}
      />

      {params.saved === "form" && (
        <AdminAlert variant="success">Form status updated.</AdminAlert>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="Forms in view" value={data.forms.length} variant="primary" />
        <AdminStatCard label="Total responses" value={data.stats.totalResponses.toLocaleString()} />
        <AdminStatCard
          label="Published"
          value={data.stats.byStatus.find((s) => s.status === "PUBLISHED")?.count ?? 0}
        />
      </div>

      <AdminCard title="Filter forms">
        <form className="flex flex-col sm:flex-row gap-3">
          <Input
            name="q"
            placeholder="Search name, short code, or member…"
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

      <AdminCard title="Forms">
        {data.forms.length === 0 ? (
          <AdminEmpty>No forms match your filters.</AdminEmpty>
        ) : (
          <div className="-my-1">
            {data.forms.map((f) => (
              <AdminListRow key={f.id}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{f.name}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {f.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    /f/{f.shortCode} · {f._count.fields} fields · {f._count.responses} responses
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Updated {format(f.updatedAt, "PP")}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Link
                      href={`/admin/members/${f.user.id}?tab=products`}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 px-2")}
                    >
                      {f.user.fullName}
                    </Link>
                    {f.status === "PUBLISHED" && (
                      <a
                        href={`/f/${f.shortCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "h-7 px-2 gap-1",
                        )}
                      >
                        View public
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
                <form action={adminUpdateSmartFormStatusAction} className="flex items-center gap-2 shrink-0">
                  <input type="hidden" name="formId" value={f.id} />
                  <input type="hidden" name="returnTo" value="/admin/forms" />
                  <select
                    name="status"
                    defaultValue={f.status}
                    className="flex h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {STATUS_FILTERS.filter((s) => s !== "all").map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" size="sm" variant="secondary">
                    Set
                  </Button>
                </form>
              </AdminListRow>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}
