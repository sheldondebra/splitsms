"use client";

import { useState } from "react";
import { LogoutConfirmDialog } from "@/components/auth/logout-confirm-dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

type LogoutConfirmButtonProps = {
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  /** Sidebar / mobile menu style */
  fullWidth?: boolean;
  showIcon?: boolean;
  iconOnly?: boolean;
  label?: string;
};

export function LogoutConfirmButton({
  variant = "outline",
  size = "default",
  className,
  fullWidth,
  showIcon = true,
  iconOnly = false,
  label = "Sign out",
}: LogoutConfirmButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={iconOnly ? "icon" : size}
        className={cn(fullWidth && "w-full justify-start gap-3", className)}
        onClick={() => setOpen(true)}
        aria-label={label}
        title={iconOnly ? label : undefined}
      >
        {showIcon && <LogOut className="h-4 w-4 shrink-0" />}
        {iconOnly ? <span className="sr-only">{label}</span> : label}
      </Button>

      <LogoutConfirmDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
