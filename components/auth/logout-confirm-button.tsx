"use client";

import { useState } from "react";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign out?</DialogTitle>
            <DialogDescription>
              You will need to sign in again to access your dashboard, wallet, and messages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <form action={logoutAction} className="flex-1 sm:flex-none">
              <Button type="submit" variant="destructive" className="w-full gap-2">
                <LogOut className="h-4 w-4" />
                Yes, sign out
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
