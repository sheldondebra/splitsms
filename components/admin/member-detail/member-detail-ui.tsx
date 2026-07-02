import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MemberAvatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : name.slice(0, 2);
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/20 text-lg font-bold text-primary uppercase">
      {initials}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 ring-emerald-500/20",
    SUSPENDED: "bg-amber-500/15 text-amber-900 dark:text-amber-200 ring-amber-500/25",
    BLOCKED: "bg-destructive/15 text-destructive ring-destructive/25",
    APPROVED: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 ring-emerald-500/20",
    PENDING: "bg-amber-500/15 text-amber-900 dark:text-amber-200 ring-amber-500/25",
    REJECTED: "bg-destructive/15 text-destructive ring-destructive/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset",
        map[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

export function SectionLabel({
  icon: Icon,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-2 mb-4">
      {Icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

export function InfoRow({
  label,
  value,
  mono,
  compact,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-b border-border/40 last:border-0",
        compact ? "py-2" : "py-2.5",
      )}
    >
      <span className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
        {label}
      </span>
      <span
        className={cn(
          "font-medium text-right",
          compact ? "text-xs" : "text-sm",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function DetailTile({
  label,
  value,
  hint,
  icon: Icon,
  mono,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-muted/15 px-3 py-2.5 min-w-0",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {Icon && <Icon className="h-3 w-3 shrink-0" />}
        <span className="truncate">{label}</span>
      </div>
      <p className={cn("mt-1 text-sm font-semibold truncate", mono && "font-mono text-xs")}>
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[10px] text-muted-foreground truncate">{hint}</p>}
    </div>
  );
}

export function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-2 pt-3 border-t border-border/50 mt-3">{children}</div>
  );
}
