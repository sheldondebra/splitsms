import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { getSystemSyncHistory } from "@/lib/admin/system-sync-history";
import {
  AdminPage,
  AdminPageHeader,
  AdminCard,
  AdminEmpty,
  AdminStatCard,
} from "@/components/admin/admin-page-shell";
import { AdminSystemSyncHistoryTable } from "@/components/admin/admin-system-sync-history-table";
import { AdminSystemSyncButton } from "@/components/admin/admin-system-sync-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Send,
  History,
  BadgeCheck,
  Radio,
} from "lucide-react";

export default async function AdminSystemSyncPage() {
  const history = await getSystemSyncHistory(30);
  const last = history[0];

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="System sync"
        description="Every full system sync — SMS delivery, campaigns, provider balances, and sender ID carrier status — with a record of what was fixed and what still needs attention."
        icon={RefreshCw}
        actions={
          <>
            <AdminSystemSyncButton />
            <Link
              href="/admin"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
          </>
        }
      />

      {!last ? (
        <AdminEmpty>
          No system sync has been run yet. Use “System sync” in the top bar or the button above to
          run one.
        </AdminEmpty>
      ) : (
        <>
          <AdminCard
            title="Last sync"
            description={`${formatDistanceToNow(last.createdAt, { addSuffix: true })} · triggered by ${last.actorName}`}
            actions={
              <Badge
                variant="outline"
                className={cn(
                  last.ok
                    ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                    : "border-amber-500/40 text-amber-800 dark:text-amber-200",
                )}
              >
                {last.ok
                  ? "All checks passed"
                  : `${last.tasks.filter((t) => !t.ok).length} issue${
                      last.tasks.filter((t) => !t.ok).length === 1 ? "" : "s"
                    } found`}
              </Badge>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AdminStatCard
                label="SMS sent"
                value={last.summary.sent}
                hint={`${last.summary.failed} failed · ${last.summary.remaining} remaining`}
                icon={Send}
              />
              <AdminStatCard
                label="Delivery reports updated"
                value={last.summary.deliveryRowsUpdated}
                icon={History}
              />
              <AdminStatCard
                label="Provider balances checked"
                value={last.summary.providerBalancesChecked}
                icon={Radio}
              />
              <AdminStatCard
                label="Sender IDs checked"
                value={last.summary.senderIdsChecked}
                hint={`${last.summary.senderIdsApproved} approved · ${last.summary.senderIdsPending} pending`}
                icon={BadgeCheck}
              />
            </div>

            <ul className="mt-4 space-y-1.5 rounded-lg border border-border/60 bg-muted/10 p-3">
              {last.tasks.map((task) => {
                const Icon = task.ok ? CheckCircle2 : XCircle;
                return (
                  <li key={task.id} className="flex items-start gap-2 text-sm">
                    <Icon
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        task.ok ? "text-emerald-600" : "text-destructive",
                      )}
                    />
                    <div>
                      <p className="font-medium text-foreground">{task.label}</p>
                      <p className="text-xs text-muted-foreground">{task.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </AdminCard>

          <AdminCard
            title="Sync history"
            description={`${history.length} recent run${history.length === 1 ? "" : "s"}`}
            dense
          >
            <AdminSystemSyncHistoryTable entries={history} />
          </AdminCard>
        </>
      )}
    </AdminPage>
  );
}
