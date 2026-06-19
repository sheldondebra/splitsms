"use client";

import { setDefaultSenderIdAction } from "@/lib/actions/sender-ids";
import { SenderIdStatusBadge } from "@/components/dashboard/sender-id-status-badge";
import { memberSenderNote } from "@/lib/sms/member-facing";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import type { SenderIdStatus } from "@/lib/generated/prisma/client";

export type SenderIdItem = {
  id: string;
  value: string;
  countryCode: string;
  status: SenderIdStatus;
  isDefault: boolean;
  adminNote: string | null;
  providerSubmittedAt: string | null;
  createdAt: string;
};

export function SenderIdList({ items }: { items: SenderIdItem[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="divide-y divide-border/60 rounded-xl border border-border/60 overflow-hidden">
      {items.map((s) => {
        const denyReason = memberSenderNote(s.adminNote, s.status);

        return (
          <li
            key={s.id}
            className={cn(
              "flex flex-col gap-1.5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3",
              s.status === "PENDING" && "bg-amber-500/[0.04]",
              s.status === "REJECTED" && "bg-destructive/[0.03]",
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-sm font-bold tracking-wide text-foreground">
                  {s.value}
                </p>
                {s.isDefault && s.status === "APPROVED" && (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-primary/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    Default
                  </span>
                )}
                <SenderIdStatusBadge
                  status={s.status}
                  compact
                  providerSubmittedAt={s.providerSubmittedAt}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {s.countryCode}
                <span className="mx-1.5 text-border">·</span>
                {new Date(s.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              {s.status === "REJECTED" && denyReason && (
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                  <span className="font-medium text-foreground">Reason: </span>
                  {denyReason}
                </p>
              )}
            </div>

            {s.status === "APPROVED" && !s.isDefault && (
              <form action={setDefaultSenderIdAction} className="shrink-0">
                <input type="hidden" name="id" value={s.id} />
                <Button type="submit" variant="outline" size="sm" className="h-7 gap-1 px-2.5 text-[11px]">
                  <Star className="h-2.5 w-2.5" />
                  Set default
                </Button>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
