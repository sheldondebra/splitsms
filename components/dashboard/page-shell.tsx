import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Consistent page wrapper — full width on mobile, constrained on desktop */
export function AppPage({
  children,
  className,
  narrow,
  medium,
  wide,
}: {
  children: ReactNode;
  className?: string;
  /** Forms / settings — ~768px */
  narrow?: boolean;
  /** Focused flows — ~1152px */
  medium?: boolean;
  /** Default for data-heavy pages — full main column width */
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "app-page w-full min-w-0",
        narrow && "app-page-narrow",
        medium && !wide && "app-page-medium",
        (wide || (!narrow && !medium)) && "app-page-wide",
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {(Icon || description || mobileDesc) && (
          <div className="flex items-start gap-3 min-w-0">
            {Icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
            )}
            {(description || mobileDesc) && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl pt-0.5">
                <span className="sr-only">{title}</span>
                {mobileDesc ?? description}
              </p>
            )}
          </div>
        )}
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
      </div>
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
    <div
      className={cn(
        "app-card rounded-2xl border border-border/60 bg-card shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Consistent inner padding for dashboard cards — use on every AppCard */
export function AppCardBody({
  children,
  className,
  fill,
}: {
  children: ReactNode;
  className?: string;
  /** Stretch to fill parent AppCard (pair with h-full flex flex-col on AppCard) */
  fill?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-6 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-9",
        fill && "flex flex-1 flex-col min-h-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AppCardTitle({
  title,
  description,
  icon: Icon,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3 mb-6 sm:mb-8", className)}>
      {Icon ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
      <div className="min-w-0 space-y-1">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        ) : null}
      </div>
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
        "rounded-xl border border-border/60 bg-card p-5 shadow-sm active:scale-[0.99] transition-transform sm:p-6",
        className,
      )}
    >
      {children}
    </li>
  );
}
