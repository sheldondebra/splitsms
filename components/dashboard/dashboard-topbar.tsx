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
    <header className="sticky top-0 z-20 h-14 shrink-0 border-b border-border/70 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85">
      <div className="flex h-full items-center gap-3 px-4 md:px-6 lg:px-8">
        <div className="hidden min-w-0 shrink-0 sm:block">
          <p className="text-sm font-medium leading-none text-foreground truncate max-w-[8rem] lg:max-w-[10rem]">
            Hi, {greeting}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 min-w-0">
          <DashboardBalance snapshot={balance} variant="header" />
        </div>

        <div className="hidden sm:block h-8 w-px bg-border/60 shrink-0" aria-hidden />

        <div className="flex items-center gap-0.5 shrink-0 rounded-xl border border-border/60 bg-muted/30 p-0.5">
          <Link
            href="/developers"
            className="hidden lg:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
            title="Developers"
          >
            <Code2 className="h-4 w-4" />
            <span className="hidden xl:inline">Developers</span>
          </Link>
          <ThemeToggle className="h-8 w-8 rounded-lg hover:bg-background/80" />
          <NotificationBell notifications={notifications} unreadCount={unreadCount} />
        </div>
      </div>
    </header>
  );
}
