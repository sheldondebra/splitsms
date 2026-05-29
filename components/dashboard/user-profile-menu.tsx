"use client";

import { useState } from "react";
import { logoutAction } from "@/lib/actions/auth";
import { getMemberDisplayName } from "@/lib/user/display";
import { UserAvatar } from "@/components/user/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut, Mail, Phone, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type MemberProfileSummary = {
  fullName: string;
  email: string | null;
  phone: string;
};

type UserProfileMenuProps = {
  profile: MemberProfileSummary;
  className?: string;
};

export function UserProfileMenu({ profile, className }: UserProfileMenuProps) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const displayName = getMemberDisplayName(profile.fullName);
  const contact = profile.email?.trim() || profile.phone;
  const ContactIcon = profile.email?.trim() ? Mail : Phone;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex h-8 items-center gap-1 rounded-md px-1 pr-1.5 outline-none transition-colors hover:bg-background/80 focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
          aria-label="Account menu"
        >
          <UserAvatar name={displayName} size="sm" />
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-3 px-2 py-2.5">
              <UserAvatar name={displayName} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">Account</p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-default focus:bg-transparent gap-2.5 py-2"
            onSelect={(e) => e.preventDefault()}
          >
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Name
              </p>
              <p className="text-sm truncate">{displayName}</p>
            </div>
          </DropdownMenuItem>
          {contact && (
            <DropdownMenuItem
              className="cursor-default focus:bg-transparent gap-2.5 py-2"
              onSelect={(e) => e.preventDefault()}
            >
              <ContactIcon className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {profile.email?.trim() ? "Email" : "Phone"}
                </p>
                <p className="text-sm truncate">{contact}</p>
              </div>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="gap-2.5 cursor-pointer"
            onSelect={() => setLogoutOpen(true)}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
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
              onClick={() => setLogoutOpen(false)}
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
