import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminPage({
  children,
  className,
  narrow,
  wide,
}: {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "admin-page space-y-6 md:space-y-8",
        narrow && "max-w-3xl",
        wide && "max-w-7xl",
        !narrow && !wide && "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminPageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0 md:hidden">
          <p className="text-sm text-muted-foreground leading-snug">{description}</p>
        </div>
        <div className="min-w-0 hidden md:block">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function AdminStatCard({
  label,
  value,
  hint,
  trend,
  variant = "default",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "primary" | "danger" | "warning";
  className?: string;
}) {
  const variants = {
    default: "border-border/60",
    primary: "border-primary/25 bg-primary/5",
    danger: "border-destructive/25 bg-destructive/5",
    warning: "border-amber-500/25 bg-amber-500/8",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-sm",
        variants[variant],
        className,
      )}
    >
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tabular-nums tracking-tight",
          variant === "danger" && "text-destructive",
          variant === "primary" && "text-primary",
          variant === "warning" && "text-amber-700 dark:text-amber-300",
        )}
      >
        {value}
      </p>
      {hint && (
        <p
          className={cn(
            "mt-1 text-xs text-muted-foreground",
            trend === "down" && "text-destructive",
            trend === "up" && "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export function AdminAlert({
  children,
  variant = "info",
}: {
  children: ReactNode;
  variant?: "info" | "success" | "warning";
}) {
  const styles = {
    info: "border-primary/30 bg-primary/5",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
    warning: "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-100",
  };
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", styles[variant])}>
      {children}
    </div>
  );
}

export function AdminCard({
  children,
  className,
  title,
  description,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden", className)}>
      {(title || description) && (
        <div className="px-5 py-4 border-b border-border/50 bg-muted/20">
          {title && <h2 className="font-semibold">{title}</h2>}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
