import { NotificationBell, type NotificationItem } from "@/components/dashboard/notification-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardRefresh } from "@/components/dashboard/dashboard-refresh";

type DashboardTopbarProps = {
  title: string;
  subtitle?: string;
  phone?: string;
  notifications: NotificationItem[];
  unreadCount: number;
};

export function DashboardTopbar({
  title,
  subtitle,
  phone,
  notifications,
  unreadCount,
}: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/80 bg-background/80 px-6 backdrop-blur-md">
      <div>
        <p className="text-sm font-semibold tracking-tight">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">
            {subtitle}
            {phone && <span className="ml-2 opacity-70">{phone}</span>}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <DashboardRefresh />
        <ThemeToggle />
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
      </div>
    </header>
  );
}
