"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { NotificationBell, type NotificationItem } from "@/components/dashboard/notification-panel";
import {
  UserProfileMenu,
  type MemberProfileSummary,
} from "@/components/dashboard/user-profile-menu";
import { getMemberPageTitle } from "@/lib/navigation/member-page-title";
import {
  developersNavItems,
  isDevelopersNavActive,
} from "@/lib/navigation/developers-nav";
import { cn } from "@/lib/utils";

type MobileAppHeaderProps = {
  profile: MemberProfileSummary;
  notifications: NotificationItem[];
  unreadCount: number;
};

export function MobileAppHeader({
  profile,
  notifications,
  unreadCount,
}: MobileAppHeaderProps) {
  const pathname = usePathname();
  const pageTitle = getMemberPageTitle(pathname);
  const isHome = pathname === "/dashboard";
  const isDevelopers = pathname.startsWith("/developers");

  return (
    <header
      className="sticky top-0 z-30 shrink-0 border-b border-border/40 bg-background/80 backdrop-blur-xl md:hidden"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="flex h-12 items-center gap-3 px-3">
        <div className="flex min-w-0 flex-1 items-center">
          {isHome ? (
            <Logo href="/dashboard" size="sm" />
          ) : (
            <p className="truncate text-[17px] font-semibold tracking-tight">{pageTitle}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center rounded-full bg-muted/70 p-0.5 ring-1 ring-border/50">
          <NotificationBell notifications={notifications} unreadCount={unreadCount} />
          <UserProfileMenu profile={profile} showChevron={false} variant="icon" />
        </div>
      </div>

      {isDevelopers && (
        <div className="flex gap-1.5 overflow-x-auto px-3 pb-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {developersNavItems.map(({ href, label, exact }) => {
            const active = isDevelopersNavActive(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
