"use client";

import { useEffect } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import type { AdminNavItem } from "@/lib/navigation/admin-nav";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  badges?: Partial<Record<NonNullable<AdminNavItem["badge"]>, number>>;
};

export function AdminNavDrawer({ open, onClose, badges }: AdminNavDrawerProps) {
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
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-[70] md:hidden transition-transform duration-300 ease-out safe-top",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <AdminSidebar
          badges={badges}
          onNavigate={onClose}
          className="h-full w-[min(100vw,280px)] shadow-2xl"
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-foreground md:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </>
  );
}
