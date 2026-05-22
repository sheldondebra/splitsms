"use client";

import { markAllReadAction, markReadAction } from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
};

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  return (
    <div className="relative group">
      <button
        type="button"
        className="relative rounded-lg border border-border p-2 hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-lg transition-all">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <form action={markAllReadAction}>
              <Button type="submit" variant="ghost" size="sm" className="text-xs h-7">
                Mark all read
              </Button>
            </form>
          )}
        </div>
        <ul className="max-h-72 overflow-y-auto">
          {notifications.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted-foreground text-center">
              No notifications
            </li>
          ) : (
            notifications.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "border-b px-4 py-3 text-sm last:border-0",
                  !n.readAt && "bg-primary/5",
                )}
              >
                <div className="flex justify-between gap-2">
                  <p className="font-medium">{n.title}</p>
                  {!n.readAt && (
                    <form action={markReadAction}>
                      <input type="hidden" name="id" value={n.id} />
                      <button
                        type="submit"
                        className="text-[10px] text-primary hover:underline"
                      >
                        Mark read
                      </button>
                    </form>
                  )}
                </div>
                <p className="text-muted-foreground text-xs mt-1">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
