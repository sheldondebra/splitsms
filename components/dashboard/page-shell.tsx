import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Consistent page wrapper — full width on mobile, constrained on desktop */
export function AppPage({
  children,
  className,
  narrow,
  medium,
}: {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
  medium?: boolean;
}) {
  return (
    <div
      className={cn(
        "app-page w-full min-w-0",
        narrow && "app-page-narrow",
        medium && "app-page-medium",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  mobileDescription,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  /** Shown under app bar on mobile instead of repeating the title */
  mobileDescription?: string;
}) {
  const mobileDesc = mobileDescription ?? description;

  return (
    <div className="page-header-block">
      <div className="hidden md:flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1 text-sm max-w-xl">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>

      {mobileDesc && (
        <p className="md:hidden text-sm text-muted-foreground leading-snug">{mobileDesc}</p>
      )}

      {actions && (
        <div className="md:hidden flex flex-col gap-2 sm:flex-row sm:flex-wrap">{actions}</div>
      )}
    </div>
  );
}

export function AppCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("app-card rounded-2xl border border-border/60 bg-card shadow-sm", className)}>
      {children}
    </div>
  );
}

export function MobileCardList({ children }: { children: ReactNode }) {
  return <ul className="app-mobile-list md:hidden space-y-2">{children}</ul>;
}

export function MobileCardItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "rounded-xl border border-border/60 bg-card p-4 shadow-sm active:scale-[0.99] transition-transform",
        className,
      )}
    >
      {children}
    </li>
  );
}
