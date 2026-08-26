"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { markAllReadAction, markReadAction } from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationMetadata = {
  href?: string;
  ctaLabel?: string;
};

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
  metadata?: NotificationMetadata | null;
};

function notificationCta(metadata: NotificationMetadata | null | undefined) {
  if (!metadata?.href) return null;
  return {
    href: metadata.href,
    label: metadata.ctaLabel ?? "View",
  };
}

function NotificationList({
  notifications,
  unreadCount,
  onNavigate,
  onClose,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
  onNavigate?: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <p className="text-[15px] font-semibold">Notifications</p>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <form action={markAllReadAction}>
              <Button type="submit" variant="ghost" size="sm" className="h-8 text-xs">
                Mark all read
              </Button>
            </form>
          )}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground md:hidden"
              aria-label="Close notifications"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      <ul className="max-h-[min(28rem,70dvh)] overflow-y-auto overscroll-contain">
        {notifications.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-muted-foreground">
            No notifications
          </li>
        ) : (
          notifications.map((n) => {
            const cta = notificationCta(n.metadata);
            return (
              <li
                key={n.id}
                className={cn(
                  "border-b border-border/50 px-4 py-3.5 text-sm last:border-0",
                  !n.readAt && "bg-primary/5",
                )}
              >
                <div className="flex justify-between gap-2">
                  <p className="font-medium leading-snug">{n.title}</p>
                  {!n.readAt && (
                    <form action={markReadAction}>
                      <input type="hidden" name="id" value={n.id} />
                      <button
                        type="submit"
                        className="shrink-0 text-[11px] font-semibold text-primary"
                      >
                        Mark read
                      </button>
                    </form>
                  )}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{n.message}</p>
                {cta && (
                  <Link
                    href={cta.href}
                    onClick={onNavigate}
                    className="mt-2 inline-flex min-h-8 items-center text-xs font-semibold text-primary"
                  >
                    {cta.label} →
                  </Link>
                )}
                <p className="mt-1.5 text-[10px] text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </li>
            );
          })
        )}
      </ul>
    </>
  );
}

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const badge = unreadCount > 9 ? "9+" : String(unreadCount);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-background/80"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-primary px-0.5 text-[8px] font-bold leading-none text-primary-foreground ring-2 ring-background">
            {badge}
          </span>
        )}
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-[85] bg-black/40 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            id={panelId}
            role="dialog"
            aria-label="Notifications"
            className="fixed inset-x-3 top-[calc(env(safe-area-inset-top,0px)+3.25rem)] z-[90] max-h-[min(32rem,72dvh)] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-80 md:rounded-xl"
          >
            <NotificationList
              notifications={notifications}
              unreadCount={unreadCount}
              onNavigate={() => setOpen(false)}
              onClose={() => setOpen(false)}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
