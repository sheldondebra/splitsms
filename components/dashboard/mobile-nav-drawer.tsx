"use client";

import { useEffect } from "react";
import { Logo } from "@/components/brand/logo";
import { SidebarNavContent } from "@/components/dashboard/sidebar-nav-content";
import { useTheme } from "@/components/theme-provider";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  const { resolvedTheme } = useTheme();

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
          "fixed inset-y-0 left-0 z-[70] flex w-[min(100vw,320px)] flex-col bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-300 ease-out md:hidden safe-top",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!open}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border/80 px-4">
          <Logo
            href="/dashboard"
            size="sm"
            variant={resolvedTheme === "dark" ? "white" : "default"}
          />
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
          <SidebarNavContent onNavigate={onClose} />
        </div>
      </aside>
    </>
  );
}
