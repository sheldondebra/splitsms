import Link from "next/link";
import { cn } from "@/lib/utils";
import { REPORT_PERIOD_OPTIONS, type ReportPeriodDays } from "@/lib/reports/period";

export function ReportPeriodTabs({
  basePath,
  period,
  extraQuery,
}: {
  basePath: string;
  period: ReportPeriodDays;
  extraQuery?: Record<string, string | undefined>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/60 bg-muted/20 p-1">
      {REPORT_PERIOD_OPTIONS.map((d) => {
        const qs = new URLSearchParams();
        qs.set("days", String(d));
        if (extraQuery) {
          for (const [k, v] of Object.entries(extraQuery)) {
            if (v) qs.set(k, v);
          }
        }
        return (
          <Link
            key={d}
            href={`${basePath}?${qs.toString()}`}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
              period === d
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {d}d
          </Link>
        );
      })}
    </div>
  );
}

export function ReportSubnav({
  base,
  items,
  current,
}: {
  base: string;
  current: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 app-scroll-x">
      {items.map((item) => {
        const href = item.href === "" ? base : `${base}${item.href}`;
        const active = current === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export const ADMIN_REPORT_NAV = [
  { href: "", label: "Overview" },
  { href: "/delivery", label: "Delivery" },
  { href: "/transactions", label: "Transactions" },
  { href: "/logins", label: "Logins" },
  { href: "/members", label: "Members" },
  { href: "/send", label: "Send report" },
] as const;

export const MEMBER_REPORT_NAV = [
  { href: "", label: "Overview" },
  { href: "/delivery", label: "Delivery" },
  { href: "/transactions", label: "Transactions" },
  { href: "/logins", label: "Logins" },
] as const;
