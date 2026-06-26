"use client";

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

type LogoutConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LogoutConfirmDialog({ open, onOpenChange }: LogoutConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[400px]">
        <div className="px-6 pt-7 pb-5 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/15">
            <LogOut className="h-6 w-6 text-destructive" aria-hidden />
          </div>
          <DialogHeader className="items-center gap-2 text-center sm:text-center">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Sign out of your account?
            </DialogTitle>
            <DialogDescription className="mx-auto max-w-[300px] text-center leading-relaxed">
              You&apos;ll need to sign in again to access your dashboard, wallet, and messages.
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="!mx-0 !mb-0 flex-row gap-2 border-t border-border/60 bg-muted/25 px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-10 flex-1 rounded-lg sm:flex-none sm:min-w-[100px]"
          >
            Cancel
          </Button>
          <form action={logoutAction} className="flex-1 sm:flex-none">
            <Button
              type="submit"
              variant="destructive"
              className="h-10 w-full min-w-[120px] gap-2 rounded-lg font-semibold"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
