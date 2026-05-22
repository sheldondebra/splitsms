import Link from "next/link";
import { BadgeCheck, Plus, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SenderIdStatus } from "@/lib/generated/prisma/client";

const STATUS_COPY: Record<SenderIdStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  APPROVED: { label: "Active", variant: "default" },
  PENDING: { label: "Pending approval", variant: "secondary" },
  REJECTED: { label: "Not approved", variant: "destructive" },
};

export function SenderIdCard({
  senderIds,
}: {
  senderIds: { id: string; value: string; status: SenderIdStatus; isDefault: boolean }[];
}) {
  const approved = senderIds.filter((s) => s.status === "APPROVED");
  const primary = approved.find((s) => s.isDefault) ?? approved[0];
  const pending = senderIds.filter((s) => s.status === "PENDING").length;

  return (
    <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <BadgeCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your Sender ID
            </p>
            {primary ? (
              <>
                <p className="mt-1 text-2xl font-bold tracking-tight truncate">{primary.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Recipients see this name on every SMS you send
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 text-lg font-semibold">No Sender ID yet</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Register your brand name (e.g. MYSHOP) before sending messages
                </p>
              </>
            )}
          </div>
        </div>
        <Link
          href="/dashboard/sender-ids"
          className={cn(buttonVariants({ variant: primary ? "outline" : "default" }), "shrink-0 h-10")}
        >
          {primary ? "Manage" : (
            <>
              <Plus className="h-4 w-4 mr-1" />
              Get Sender ID
            </>
          )}
        </Link>
      </div>

      {senderIds.length > 0 && (
        <ul className="mt-5 pt-4 border-t border-border/60 space-y-2">
          {senderIds.slice(0, 3).map((s) => {
            const st = STATUS_COPY[s.status];
            return (
              <li key={s.id} className="flex items-center justify-between text-sm gap-2">
                <span className="font-medium font-mono">{s.value}</span>
                <Badge variant={st.variant} className="text-xs shrink-0">
                  {st.label}
                </Badge>
              </li>
            );
          })}
          {senderIds.length > 3 && (
            <li>
              <Link
                href="/dashboard/sender-ids"
                className="text-xs font-medium text-primary inline-flex items-center gap-1"
              >
                View all {senderIds.length} sender IDs
                <ChevronRight className="h-3 w-3" />
              </Link>
            </li>
          )}
        </ul>
      )}

      {pending > 0 && !primary && (
        <p className="mt-3 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
          {pending} request{pending > 1 ? "s" : ""} waiting for approval — you can send once approved.
        </p>
      )}
    </div>
  );
}
