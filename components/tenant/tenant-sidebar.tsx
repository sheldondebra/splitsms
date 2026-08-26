"use client";

import Link from "next/link";
import Image from "next/image";
import { SidebarNavContent } from "@/components/dashboard/sidebar-nav-content";
import { TenantLogo } from "@/components/tenant/tenant-theme";
import type { TenantBranding } from "@/lib/reseller/tenant";
import { useMemberSidebarCollapsed } from "@/components/layout/member-sidebar-collapse";
import { SidebarRailToggle } from "@/components/layout/sidebar-rail-toggle";
import { cn } from "@/lib/utils";

export function TenantDashboardSidebar({ tenant }: { tenant: TenantBranding }) {
  const accent = tenant.primaryColor;
  const { collapsed, toggle } = useMemberSidebarCollapsed();

  return (
    <aside
      className={cn(
        "relative z-40 hidden shrink-0 border-r md:sticky md:top-0 md:flex md:h-[100dvh] md:flex-col text-sidebar-foreground",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
      style={{
        backgroundColor: "var(--tenant-sidebar, #0f0f0f)",
        borderColor: `${accent}33`,
      }}
    >
      <SidebarRailToggle collapsed={collapsed} onToggle={toggle} />
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b gap-2",
          collapsed ? "justify-center px-2" : "px-5",
        )}
        style={{ borderColor: `${accent}33` }}
      >
        <Link href="/dashboard" aria-label={tenant.brandName}>
          {collapsed ? (
            <Image src="/icon.png" alt={tenant.brandName} width={32} height={32} className="h-8 w-8 rounded-lg" />
          ) : (
            <TenantLogo tenant={tenant} />
          )}
        </Link>
      </div>
      <div className="flex-1 min-h-0 [&_.bg-sidebar-primary]:!bg-[var(--tenant-primary)]">
        <SidebarNavContent collapsed={collapsed} />
      </div>
      {collapsed ? null : (
        <div className="p-4 border-t border-white/10 text-[10px] text-white/50">
          SMS by {tenant.brandName}
          {tenant.supportEmail && (
            <a href={`mailto:${tenant.supportEmail}`} className="block mt-1 hover:text-white/80">
              {tenant.supportEmail}
            </a>
          )}
        </div>
      )}
    </aside>
  );
}
