"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { TenantLogo } from "@/components/tenant/tenant-theme";
import type { TenantBranding } from "@/lib/reseller/tenant";
import { SidebarNavContent } from "@/components/dashboard/sidebar-nav-content";
import { DevelopersNavContent } from "@/components/developers/developers-nav-content";
import { useTheme } from "@/components/theme-provider";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  tenant?: TenantBranding | null;
};

export function MobileNavDrawer({ open, onClose, tenant }: MobileNavDrawerProps) {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const isDevelopers = pathname.startsWith("/developers");

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] flex w-[min(100vw,320px)] flex-col text-sidebar-foreground shadow-2xl transition-transform duration-300 ease-out md:hidden safe-top",
          !tenant && "bg-sidebar",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={
          tenant
            ? {
                backgroundColor: "var(--tenant-sidebar, #0f0f0f)",
                borderRight: `1px solid ${tenant.primaryColor}33`,
              }
            : undefined
        }
        aria-hidden={!open}
      >
        <div
          className="flex h-14 shrink-0 items-center justify-between border-b px-4"
          style={tenant ? { borderColor: `${tenant.primaryColor}33` } : undefined}
        >
          {tenant ? (
            <Link href={isDevelopers ? "/developers" : "/dashboard"} onClick={onClose}>
              <TenantLogo tenant={tenant} />
            </Link>
          ) : (
            <Logo
              href={isDevelopers ? "/developers" : "/dashboard"}
              size="sm"
              variant={resolvedTheme === "dark" ? "white" : "default"}
            />
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-sidebar-foreground/70 hover:bg-sidebar-accent touch-target"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          {isDevelopers ? (
            <DevelopersNavContent onNavigate={onClose} />
          ) : (
            <SidebarNavContent onNavigate={onClose} />
          )}
        </div>
      </aside>
    </>
  );
}
