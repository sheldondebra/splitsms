import Link from "next/link";
import { Code2 } from "lucide-react";
import { NotificationBell, type NotificationItem } from "@/components/dashboard/notification-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardBalance } from "@/components/dashboard/dashboard-balance";
import type { BalanceSnapshot } from "@/lib/dashboard/balance-snapshot";

type DashboardTopbarProps = {
  greeting: string;
  notifications: NotificationItem[];
  unreadCount: number;
  balance: BalanceSnapshot;
};

export function DashboardTopbar({
  greeting,
  notifications,
  unreadCount,
  balance,
}: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-20 h-14 shrink-0 border-b border-border/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-full items-center gap-2 sm:gap-3 px-4 md:px-6 lg:px-8">
        {/* Greeting — compact */}
        <div className="min-w-0 shrink-0 hidden sm:block">
          <p className="text-sm font-semibold leading-none truncate max-w-[8rem] md:max-w-[10rem]">
            Hi, {greeting}
          </p>
        </div>

        <div className="hidden sm:block h-6 w-px bg-border/60 shrink-0" aria-hidden />

        {/* Balance + actions — grows and can shrink */}
        <div className="flex flex-1 items-center justify-end gap-2 min-w-0 overflow-hidden">
          <DashboardBalance snapshot={balance} variant="header" />
        </div>

        <div className="hidden sm:block h-6 w-px bg-border/60 shrink-0" aria-hidden />

        {/* Utilities */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Link
            href="/developers"
            className="hidden lg:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            title="Developers"
          >
            <Code2 className="h-4 w-4" />
            <span className="hidden xl:inline">Developers</span>
          </Link>
          <ThemeToggle />
          <NotificationBell notifications={notifications} unreadCount={unreadCount} />
        </div>
      </div>
    </header>
  );
}
