import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MetricTone = "primary" | "success" | "warning" | "neutral";

type Metric = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href?: string;
  tone?: MetricTone;
};

const toneStyles: Record<MetricTone, { icon: string; value: string }> = {
  primary: {
    icon: "bg-primary/10 text-primary",
    value: "text-foreground",
  },
  success: {
    icon: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    value: "text-emerald-800 dark:text-emerald-300",
  },
  warning: {
    icon: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    value: "text-amber-800 dark:text-amber-300",
  },
  neutral: {
    icon: "bg-muted text-muted-foreground",
    value: "text-foreground",
  },
};

function MetricCell({ metric }: { metric: Metric }) {
  const tone = metric.tone ?? "neutral";
  const styles = toneStyles[tone];
  const Icon = metric.icon;

  const content = (
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          styles.icon,
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className={cn("text-lg font-bold tabular-nums tracking-tight leading-none", styles.value)}>
          {typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-muted-foreground truncate">{metric.label}</p>
      </div>
    </div>
  );

  const cellClass = cn(
    "px-3.5 py-3 transition-colors",
    metric.href && "hover:bg-muted/30",
  );

  if (metric.href) {
    return (
      <Link href={metric.href} className={cellClass}>
        {content}
      </Link>
    );
  }

  return <div className={cellClass}>{content}</div>;
}

export function DashboardMetrics({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border/50">
        {metrics.map((metric) => (
          <MetricCell key={metric.label} metric={metric} />
        ))}
      </div>
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
