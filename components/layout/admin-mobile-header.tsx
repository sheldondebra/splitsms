"use client";

import { Menu } from "lucide-react";
import { getAdminPageTitle } from "@/lib/navigation/admin-nav";
import { usePathname } from "next/navigation";
import { LogoutConfirmButton } from "@/components/auth/logout-confirm-button";

type AdminMobileHeaderProps = {
  onMenuOpen: () => void;
  subtitle?: string;
};

export function AdminMobileHeader({ onMenuOpen, subtitle }: AdminMobileHeaderProps) {
  const pathname = usePathname();
  const title = getAdminPageTitle(pathname);

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-border/60 bg-background/95 backdrop-blur-lg safe-top md:hidden">
      <div className="flex h-14 items-center gap-2 px-3">
        <button
          type="button"
          onClick={onMenuOpen}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl hover:bg-muted/80"
          aria-label="Open admin menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{title}</p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
        <LogoutConfirmButton variant="ghost" size="sm" label="Out" showIcon={false} />
      </div>
    </header>
  );
}
