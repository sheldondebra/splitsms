import Link from "next/link";
import { Code2 } from "lucide-react";
import { NotificationBell, type NotificationItem } from "@/components/dashboard/notification-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardBalance } from "@/components/dashboard/dashboard-balance";
import type { BalanceSnapshot } from "@/lib/dashboard/balance-snapshot";

type DashboardTopbarProps = {
  greeting: string;
  phone?: string;
  notifications: NotificationItem[];
  unreadCount: number;
  balance: BalanceSnapshot;
};

export function DashboardTopbar({
  greeting,
  phone,
  notifications,
  unreadCount,
  balance,
}: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="flex min-h-[4.25rem] flex-col gap-2 px-4 py-2.5 md:flex-row md:items-center md:justify-between md:px-8 lg:px-10 md:py-0 md:gap-4">
        <div className="flex items-center justify-between gap-3 min-w-0 md:flex-initial">
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight truncate md:text-lg">
              Hi, {greeting}
            </h1>
            {phone && (
              <p className="text-xs text-muted-foreground truncate hidden sm:block">{phone}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0 md:hidden">
            <ThemeToggle />
            <NotificationBell notifications={notifications} unreadCount={unreadCount} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 min-w-0 md:justify-end md:flex-1">
          <DashboardBalance snapshot={balance} variant="header" />
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <Link
              href="/developers"
              className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="Developers portal"
            >
              <Code2 className="h-3.5 w-3.5" />
              Developers
            </Link>
            <ThemeToggle />
            <NotificationBell notifications={notifications} unreadCount={unreadCount} />
          </div>
        </div>
      </div>
    </header>
  );
}
