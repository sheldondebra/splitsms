import type { CSSProperties, ReactNode } from "react";
import type { TenantBranding } from "@/lib/reseller/tenant";
import { cn } from "@/lib/utils";

export function tenantCssVars(tenant: TenantBranding | null): CSSProperties | undefined {
  if (!tenant) return undefined;
  return {
    "--tenant-primary": tenant.primaryColor,
    "--tenant-sidebar": tenant.secondaryColor,
  } as React.CSSProperties;
}

export function TenantThemeWrap({
  tenant,
  children,
  className,
}: {
  tenant: TenantBranding | null;
  children: ReactNode;
  className?: string;
}) {
  if (!tenant) return <>{children}</>;
  return (
    <div className={cn("tenant-branded min-h-full", className)} style={tenantCssVars(tenant)}>
      {children}
    </div>
  );
}

export function TenantLogo({
  tenant,
  className,
}: {
  tenant: TenantBranding;
  className?: string;
}) {
  if (tenant.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={tenant.logoUrl}
        alt={tenant.brandName}
        className={cn("h-8 w-auto max-w-[160px] object-contain", className)}
      />
    );
  }
  return (
    <span className={cn("font-bold text-lg tracking-tight", className)} style={{ color: "var(--tenant-primary, inherit)" }}>
      {tenant.brandName}
    </span>
  );
}
