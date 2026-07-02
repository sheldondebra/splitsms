import type { ReactNode } from "react";
import Link from "next/link";
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
        "admin-page w-full min-w-0 space-y-6 md:space-y-8",
        narrow && "max-w-3xl",
        wide && "max-w-none",
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
  description?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
}) {
  return (
    <div className="admin-page-header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      {(Icon || description) && (
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl pt-0.5">
              <span className="sr-only">{title}</span>
              {description}
            </p>
          )}
        </div>
      )}
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function AdminStatCard({
  label,
  value,
  hint,
  icon: Icon,
  variant = "default",
  className,
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  variant?: "default" | "primary" | "danger" | "warning";
  className?: string;
  href?: string;
}) {
  const variants = {
    default: "border-border/60 bg-card",
    primary: "border-primary/25 bg-primary/5",
    danger: "border-destructive/25 bg-destructive/5",
    warning: "border-amber-500/30 bg-amber-500/8",
  };

  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        {Icon && (
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 opacity-70",
              variant === "primary" && "text-primary",
              variant === "danger" && "text-destructive",
              variant === "warning" && "text-amber-600 dark:text-amber-400",
            )}
          />
        )}
      </div>
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
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </>
  );

  const cardClass = cn(
    "rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md block",
    variants[variant],
    href && "hover:border-primary/30 cursor-pointer",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {inner}
      </Link>
    );
  }

  return <div className={cardClass}>{inner}</div>;
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
    success: "border-emerald-500/30 bg-emerald-500/10",
    warning: "border-amber-500/30 bg-amber-500/10",
  };
  return (
    <div className={cn("rounded-xl border px-4 py-3.5 text-sm", styles[variant])}>
      {children}
    </div>
  );
}

export function AdminCard({
  children,
  className,
  title,
  description,
  actions,
  dense,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  dense?: boolean;
}) {
  return (
    <div
      className={cn(
        "border border-border/60 bg-card overflow-hidden",
        dense ? "rounded-xl shadow-none" : "rounded-2xl shadow-sm",
        className,
      )}
    >
      {(title || description || actions) && (
        <div
          className={cn(
            "flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between border-b border-border/50 bg-muted/15",
            dense ? "px-4 py-3" : "px-5 py-4",
          )}
        >
          <div>
            {title && <h2 className="font-semibold text-sm">{title}</h2>}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      <div className={dense ? "p-4" : "p-5"}>{children}</div>
    </div>
  );
}

export function AdminEmpty({
  children,
  dense,
}: {
  children: ReactNode;
  dense?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border/70 bg-muted/20 text-center text-sm text-muted-foreground",
        dense ? "px-4 py-8" : "px-6 py-12",
      )}
    >
      {children}
    </div>
  );
}

export function AdminListRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4 border-b border-border/50 last:border-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
