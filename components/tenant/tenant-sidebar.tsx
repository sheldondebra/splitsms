"use client";

import Link from "next/link";
import { SidebarNavContent } from "@/components/dashboard/sidebar-nav-content";
import { TenantLogo } from "@/components/tenant/tenant-theme";
import type { TenantBranding } from "@/lib/reseller/tenant";

export function TenantDashboardSidebar({ tenant }: { tenant: TenantBranding }) {
  const accent = tenant.primaryColor;

  return (
    <aside
      className="hidden w-[260px] shrink-0 border-r md:sticky md:top-0 md:flex md:h-[100dvh] md:flex-col text-sidebar-foreground"
      style={{
        backgroundColor: "var(--tenant-sidebar, #0f0f0f)",
        borderColor: `${accent}33`,
      }}
    >
      <div
        className="flex h-14 shrink-0 items-center border-b px-5 gap-2"
        style={{ borderColor: `${accent}33` }}
      >
        <Link href="/dashboard">
          <TenantLogo tenant={tenant} />
        </Link>
      </div>
      <div className="flex-1 min-h-0 [&_.bg-sidebar-primary]:!bg-[var(--tenant-primary)]">
        <SidebarNavContent />
      </div>
      <div className="p-4 border-t border-white/10 text-[10px] text-white/50">
        SMS by {tenant.brandName}
        {tenant.supportEmail && (
          <a href={`mailto:${tenant.supportEmail}`} className="block mt-1 hover:text-white/80">
            {tenant.supportEmail}
          </a>
        )}
      </div>
    </aside>
  );
}
