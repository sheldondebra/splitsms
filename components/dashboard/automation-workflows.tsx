import Link from "next/link";
import {
  toggleAutomationAction,
  deleteAutomationAction,
} from "@/lib/actions/automation";
import { getTriggerMeta } from "@/lib/automation/catalog";
import { EmptyState } from "@/components/dashboard/empty-state";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Pause, Play, Trash2, Workflow, Zap, Clock } from "lucide-react";
import type { AutomationTrigger } from "@/lib/generated/prisma/client";

export type WorkflowRow = {
  id: string;
  name: string;
  message: string;
  trigger: AutomationTrigger;
  isActive: boolean;
  createdAt: Date;
};

function formatWhen(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AutomationWorkflows({ workflows }: { workflows: WorkflowRow[] }) {
  if (!workflows.length) {
    return (
      <EmptyState
        icon={Workflow}
        title="No workflows yet"
        description="Create a workflow to welcome new contacts or send birthday messages to your customers."
        actionLabel="Manage contacts"
        actionHref="/dashboard/contacts"
      />
    );
  }

  return (
    <div className="space-y-3">
      {workflows.map((w) => {
        const meta = getTriggerMeta(w.trigger);
        return (
          <AppCard key={w.id} className="overflow-hidden">
            <AppCardBody className="p-0">
              <div className="flex flex-col sm:flex-row sm:items-stretch">
                <div className="min-w-0 flex-1 p-5 sm:p-6">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold text-foreground">{w.name}</h3>
                    <Badge
                      variant={w.isActive ? "default" : "secondary"}
                      className={cn(
                        "shrink-0 text-[10px] uppercase tracking-wide",
                        w.isActive && "bg-emerald-600 hover:bg-emerald-600",
                      )}
                    >
                      {w.isActive ? "Active" : "Paused"}
                    </Badge>
                    {meta.live ? (
                      <Badge
                        variant="outline"
                        className="shrink-0 gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                      >
                        <Zap className="h-3 w-3" />
                        Live
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 text-muted-foreground">
                        Draft
                      </Badge>
                    )}
                  </div>

                  <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {w.message}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5" />
                      {meta.label}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Created {formatWhen(w.createdAt)}
                    </span>
                  </div>

                  {meta.hint && (
                    <p className="mt-2 text-xs text-muted-foreground/90">{meta.hint}</p>
                  )}
                </div>

                <div className="flex border-t border-border/60 bg-muted/20 sm:flex-col sm:border-l sm:border-t-0">
                  <form action={toggleAutomationAction} className="flex-1">
                    <input type="hidden" name="id" value={w.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      className="h-full min-h-11 w-full gap-2 rounded-none text-sm font-medium"
                    >
                      {w.isActive ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Enable
                        </>
                      )}
                    </Button>
                  </form>
                  <form action={deleteAutomationAction} className="flex-1">
                    <input type="hidden" name="id" value={w.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      className="h-full min-h-11 w-full gap-2 rounded-none text-sm font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </form>
                </div>
              </div>
            </AppCardBody>
          </AppCard>
        );
      })}
    </div>
  );
}

function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "muted";
}) {
  const styles =
    tone === "success"
      ? {
          box: "border-emerald-500/20 bg-emerald-500/10",
          value: "text-emerald-600 dark:text-emerald-400",
        }
      : tone === "muted"
        ? {
            box: "border-border/60 bg-muted/50",
            value: "text-muted-foreground",
          }
        : {
            box: "border-primary/20 bg-primary/10",
            value: "text-primary",
          };

  return (
    <div className={cn("rounded-2xl border p-5 shadow-sm sm:p-6", styles.box)}>
      <p className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums", styles.value)}>{value}</p>
    </div>
  );
}

export function AutomationStats({ workflows }: { workflows: WorkflowRow[] }) {
  const active = workflows.filter((w) => w.isActive).length;
  const paused = workflows.length - active;
  const live = workflows.filter((w) => getTriggerMeta(w.trigger).live && w.isActive).length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatTile label="Total" value={workflows.length} />
      <StatTile label="Active" value={active} tone="success" />
      <StatTile label="Paused" value={paused} tone="muted" />
      <StatTile label="Live triggers" value={live} tone="success" />
    </div>
  );
}

export function AutomationSenderBanner({ hasSender }: { hasSender: boolean }) {
  if (hasSender) return null;

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
      <p className="font-medium">Sender ID required</p>
      <p className="mt-1 text-amber-800/90 dark:text-amber-200/90">
        Live automations send SMS to your contacts using your approved Sender ID.{" "}
        <Link
          href="/dashboard/sender-ids"
          className={cn(
            buttonVariants({ variant: "link" }),
            "h-auto p-0 text-amber-900 dark:text-amber-100",
          )}
        >
          Request one now
        </Link>
      </p>
    </div>
  );
}
