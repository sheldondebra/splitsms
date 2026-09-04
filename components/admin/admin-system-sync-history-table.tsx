"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDown, CheckCircle2, XCircle } from "lucide-react";
import type { SystemSyncHistoryEntry } from "@/lib/admin/system-sync-history";

function SyncRow({ entry }: { entry: SystemSyncHistoryEntry }) {
  const [expanded, setExpanded] = useState(false);
  const failedTasks = entry.tasks.filter((task) => !task.ok);

  return (
    <>
      <tr className="align-top">
        <td className="py-3 pr-3">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 text-left"
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                expanded && "rotate-180",
              )}
            />
            <span>
              <span className="block text-xs font-medium whitespace-nowrap tabular-nums">
                {format(entry.createdAt, "MMM d, yyyy · HH:mm:ss")}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {formatDistanceToNow(entry.createdAt, { addSuffix: true })}
              </span>
            </span>
          </button>
        </td>
        <td className="py-3 pr-3">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              entry.ok
                ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300"
                : "border-amber-500/40 text-amber-800 dark:text-amber-200",
            )}
          >
            {entry.ok ? "OK" : `${failedTasks.length} issue${failedTasks.length === 1 ? "" : "s"}`}
          </Badge>
        </td>
        <td className="py-3 pr-3 text-xs tabular-nums">{entry.summary.sent}</td>
        <td className="py-3 pr-3 text-xs tabular-nums">{entry.summary.failed}</td>
        <td className="py-3 pr-3 text-xs tabular-nums">{entry.summary.deliveryRowsUpdated}</td>
        <td className="py-3 pr-3 text-xs tabular-nums">{entry.summary.providerBalancesChecked}</td>
        <td className="py-3 text-xs text-muted-foreground">{entry.actorName}</td>
      </tr>
      {expanded ? (
        <tr>
          <td colSpan={7} className="bg-muted/15 px-3 pb-4 pt-1">
            <ul className="space-y-1.5 rounded-lg border border-border/60 bg-background/60 p-3">
              {entry.tasks.map((task) => {
                const Icon = task.ok ? CheckCircle2 : XCircle;
                return (
                  <li key={task.id} className="flex items-start gap-2 text-xs">
                    <Icon
                      className={cn(
                        "mt-0.5 h-3.5 w-3.5 shrink-0",
                        task.ok ? "text-emerald-600" : "text-destructive",
                      )}
                    />
                    <div>
                      <p className="font-medium text-foreground">{task.label}</p>
                      <p className="text-muted-foreground">{task.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </td>
        </tr>
      ) : null}
    </>
  );
}

export function AdminSystemSyncHistoryTable({ entries }: { entries: SystemSyncHistoryEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="pb-2 pr-3 font-semibold">When</th>
            <th className="pb-2 pr-3 font-semibold">Status</th>
            <th className="pb-2 pr-3 font-semibold">Sent</th>
            <th className="pb-2 pr-3 font-semibold">Failed</th>
            <th className="pb-2 pr-3 font-semibold">Delivery updated</th>
            <th className="pb-2 pr-3 font-semibold">Balances checked</th>
            <th className="pb-2 font-semibold">Triggered by</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {entries.map((entry) => (
            <SyncRow key={entry.id} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
