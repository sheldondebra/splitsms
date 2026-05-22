"use client";

import { setDefaultSenderIdAction } from "@/lib/actions/sender-ids";
import { SenderIdStatusBadge, SenderIdStatusRow } from "@/components/dashboard/sender-id-status-badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Star, Calendar } from "lucide-react";
import type { SenderIdStatus } from "@/lib/generated/prisma/client";

export type SenderIdItem = {
  id: string;
  value: string;
  countryCode: string;
  status: SenderIdStatus;
  isDefault: boolean;
  adminNote: string | null;
  createdAt: string;
};

export function SenderIdList({ items }: { items: SenderIdItem[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="space-y-3">
      {items.map((s) => (
        <li
          key={s.id}
          className={cn(
            "rounded-2xl border bg-card p-4 sm:p-5 transition-colors",
            s.status === "PENDING" && "border-amber-500/30 bg-amber-500/[0.04]",
            s.status === "APPROVED" && s.isDefault && "border-primary/30 ring-1 ring-primary/15",
            s.status === "REJECTED" && "border-destructive/20 opacity-95",
          )}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-xl sm:text-2xl font-bold tracking-wide">
                  {s.value}
                </p>
                {s.isDefault && s.status === "APPROVED" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    <Star className="h-3 w-3 fill-current" />
                    Default
                  </span>
                )}
                <SenderIdStatusBadge status={s.status} compact />
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Registered{" "}
                  {new Date(s.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span>Country: {s.countryCode}</span>
              </div>

              {s.status === "PENDING" && (
                <SenderIdStatusRow status="PENDING" />
              )}

              {s.status === "REJECTED" && (
                <div className="space-y-2">
                  <SenderIdStatusRow status="REJECTED" />
                  {s.adminNote && (
                    <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
                      <span className="font-medium text-foreground">Reason: </span>
                      {s.adminNote}
                    </p>
                  )}
                </div>
              )}

              {s.status === "APPROVED" && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  This Sender ID can be used when you send SMS.
                </p>
              )}
            </div>

            {s.status === "APPROVED" && !s.isDefault && (
              <form action={setDefaultSenderIdAction} className="shrink-0">
                <input type="hidden" name="id" value={s.id} />
                <Button type="submit" variant="outline" size="sm" className="h-9">
                  Set as default
                </Button>
              </form>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
