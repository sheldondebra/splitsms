import type { ReactNode } from "react";
import { Send, Percent, Megaphone, BadgeCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Metric = {
  label: string;
  value: string | number;
  icon: LucideIcon;
};

export function DashboardMetrics({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="rounded-xl border border-border/50 bg-card/80 px-4 py-3.5 flex items-center gap-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium truncate">{label}</p>
            <p className="text-lg font-bold tabular-nums tracking-tight truncate">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardAlert({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-4 py-2.5 text-sm flex flex-wrap items-center justify-between gap-2",
        variant === "warning"
          ? "border border-amber-500/25 bg-amber-500/8 text-amber-950 dark:text-amber-100"
          : "border border-primary/20 bg-primary/5 text-foreground",
      )}
    >
      {children}
    </div>
  );
}
