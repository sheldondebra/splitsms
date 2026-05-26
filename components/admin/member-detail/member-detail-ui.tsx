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
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-medium text-right", mono && "font-mono text-xs")}>
        {value}
      </span>
    </div>
  );
}

export function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-2 pt-3 border-t border-border/50 mt-3">{children}</div>
  );
}
