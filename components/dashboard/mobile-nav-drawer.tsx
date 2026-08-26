"use client";

import { useEffect, type ComponentType, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { TenantBranding } from "@/lib/reseller/tenant";
import { LogoutConfirmButton } from "@/components/auth/logout-confirm-button";
import { ThemeSidebarToggle } from "@/components/dashboard/theme-sidebar-toggle";
import { PortalSwitch } from "@/components/dashboard/portal-switch";
import { WorkspacePortalSwitch } from "@/components/shared/workspace-portal-switch";
import { UserAvatar } from "@/components/user/user-avatar";
import { getMemberDisplayName } from "@/lib/user/display";
import { getRoleLabel } from "@/lib/user/header-account-types";
import {
  dashboardNavSections,
  isNavActive,
  mobileNavItems,
} from "@/lib/navigation/dashboard-nav";
import {
  developersNavItems,
  isDevelopersNavActive,
} from "@/lib/navigation/developers-nav";
import { cn } from "@/lib/utils";
import type { MemberProfileSummary } from "@/components/dashboard/user-profile-menu";
import { ChevronRight, X } from "lucide-react";

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  tenant?: TenantBranding | null;
  profile?: MemberProfileSummary;
  showResellerPortal?: boolean;
};

const TAB_HREFS = new Set(mobileNavItems.map((item) => item.href));

const MORE_GROUPS = [
  {
    id: "messaging",
    label: "Messaging",
    hrefs: [
      "/dashboard/contacts",
      "/dashboard/campaigns",
      "/dashboard/sender-ids",
      "/dashboard/templates",
      "/dashboard/reports",
      "/dashboard/account-reports",
    ],
  },
  {
    id: "billing",
    label: "Billing",
    hrefs: ["/dashboard/invoices", "/dashboard/transactions", "/dashboard/pricing"],
  },
  {
    id: "tools",
    label: "Tools",
    hrefs: [
      "/dashboard/connect",
      "/dashboard/automation",
      "/dashboard/api-keys",
      "/dashboard/integrations/google",
      "/dashboard/integrations/google/forms",
      "/dashboard/integrations/wordpress",
      "/developers",
    ],
  },
  {
    id: "account",
    label: "Account",
    hrefs: ["/dashboard/settings", "/dashboard/support"],
  },
] as const;

export function MobileNavDrawer({
  open,
  onClose,
  profile,
  showResellerPortal = false,
}: MobileNavDrawerProps) {
  const pathname = usePathname();
  const isDevelopers = pathname.startsWith("/developers");
  const displayName = profile ? getMemberDisplayName(profile.fullName) : "";
  const roleLabel = profile?.role ? getRoleLabel(profile.role) : null;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const allItems = dashboardNavSections.flatMap((section) => section.items);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={cn(
          "fixed inset-x-0 bottom-0 z-[70] flex max-h-[88dvh] flex-col rounded-t-[1.6rem] bg-muted/80 shadow-[0_-16px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-transform duration-300 ease-out md:hidden dark:bg-background/95",
          open ? "translate-y-0" : "translate-y-full pointer-events-none",
        )}
        style={{
          paddingBottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px))",
        }}
        aria-hidden={!open}
        role="dialog"
        aria-label="More"
      >
        <div className="flex shrink-0 flex-col items-center pt-2.5">
          <div className="h-1 w-10 rounded-full bg-foreground/20" />
          <div className="flex w-full items-center justify-between px-4 pb-2 pt-3">
            <p className="text-[17px] font-semibold tracking-tight">Menu</p>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/8 text-muted-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2">
          <div className="space-y-5">
            {profile ? (
              <Link
                href="/dashboard/settings"
                onClick={onClose}
                className="flex items-center gap-3 rounded-[1.15rem] bg-card px-3.5 py-3 shadow-sm ring-1 ring-border/50 active:scale-[0.99]"
              >
                <UserAvatar name={displayName} size="lg" className="ring-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold leading-tight">{displayName}</p>
                  <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    {profile.email?.trim() || profile.phone}
                  </p>
                </div>
                {roleLabel ? (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {roleLabel}
                  </span>
                ) : null}
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70" />
              </Link>
            ) : null}

            {isDevelopers ? (
              <SheetGroup label="Developers">
                {developersNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isDevelopersNavActive(pathname, item.href, item.exact);
                  return (
                    <SheetRow
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={Icon}
                      active={active}
                      onClick={onClose}
                    />
                  );
                })}
              </SheetGroup>
            ) : (
              MORE_GROUPS.map((group) => {
                const items = group.hrefs
                  .map((href) => allItems.find((item) => item.href === href))
                  .filter((item): item is NonNullable<typeof item> => Boolean(item))
                  .filter((item) => !TAB_HREFS.has(item.href));
                if (items.length === 0) return null;
                return (
                  <SheetGroup key={group.id} label={group.label}>
                    {items.map((item) => (
                      <SheetRow
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        active={isNavActive(pathname, item.href)}
                        onClick={onClose}
                      />
                    ))}
                  </SheetGroup>
                );
              })
            )}

            <SheetGroup>
              {showResellerPortal ? (
                <div className="px-3 py-2.5">
                  <WorkspacePortalSwitch className="w-full justify-center" />
                </div>
              ) : null}
              <div className="px-3 py-2.5">
                <PortalSwitch className="w-full justify-stretch" showLabels />
              </div>
              <div className="px-3 py-2.5">
                <ThemeSidebarToggle variant="card" />
              </div>
              <div className="border-t border-border/50 px-2 py-1.5">
                <LogoutConfirmButton
                  variant="ghost"
                  fullWidth
                  className="h-11 justify-center gap-2 font-semibold text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400"
                  label="Sign out"
                />
              </div>
            </SheetGroup>
          </div>
        </div>
      </aside>
    </>
  );
}

function SheetGroup({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div>
      {label ? (
        <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-[1.15rem] bg-card shadow-sm ring-1 ring-border/50">
        {children}
      </div>
    </div>
  );
}

function SheetRow({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex min-h-[48px] items-center gap-3 px-3.5 text-[15px] font-medium",
        "border-t border-border/40 first:border-t-0",
        active ? "text-primary" : "text-foreground",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-[10px]",
          active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 truncate">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
    </Link>
  );
}
