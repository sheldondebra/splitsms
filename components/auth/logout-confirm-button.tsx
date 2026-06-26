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
  label?: string;
};

export function LogoutConfirmButton({
  variant = "outline",
  size = "default",
  className,
  fullWidth,
  showIcon = true,
  label = "Sign out",
}: LogoutConfirmButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn(fullWidth && "w-full justify-start gap-3", className)}
        onClick={() => setOpen(true)}
      >
        {showIcon && <LogOut className="h-4 w-4 shrink-0" />}
        {label}
      </Button>

      <LogoutConfirmDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
