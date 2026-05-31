"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { getMemberDisplayName } from "@/lib/user/display";
import {
  getRoleLabel,
  profileIsAdmin,
  type HeaderAccountProfile,
} from "@/lib/user/header-account-types";
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  Code2,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MenuLink = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
};

function buildMenuLinks(pathname: string, profile: HeaderAccountProfile): MenuLink[] {
  const links: MenuLink[] = [];

  const push = (href: string, label: string, icon: MenuLink["icon"]) => {
    const active =
      href === "/dashboard"
        ? pathname === "/dashboard" ||
          (pathname.startsWith("/dashboard/") &&
            !pathname.startsWith("/dashboard/settings"))
        : pathname === href || pathname.startsWith(`${href}/`);
    links.push({ href, label, icon, active });
  };

  push("/dashboard", "Dashboard", LayoutDashboard);
  push("/developers", "Developers", Code2);
  push("/api-docs", "API docs", Terminal);
  if (profileIsAdmin(profile)) {
    push("/admin", "Admin", Shield);
  }
  push("/dashboard/settings", "Settings", Settings);

  return links;
}

type HeaderAccountMenuProps = {
  profile: HeaderAccountProfile;
  className?: string;
  /** Toolbar chip inside dashboard/admin clusters */
  variant?: "compact" | "pill";
  showChevron?: boolean;
};

export function HeaderAccountMenu({
  profile,
  className,
  variant = "compact",
  showChevron = true,
}: HeaderAccountMenuProps) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const pathname = usePathname();
  const displayName = getMemberDisplayName(profile.fullName);
  const contact = profile.email?.trim() || profile.phone;
  const roleLabel = getRoleLabel(profile.role);
  const links = buildMenuLinks(pathname, profile);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex items-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            variant === "compact" &&
              "h-8 gap-1 rounded-md px-1 pr-1.5 hover:bg-background/80",
            variant === "pill" &&
              "gap-2 rounded-full border border-border/60 bg-muted/30 py-1 pl-1 pr-2.5 hover:bg-muted/50",
            className,
          )}
          aria-label="Account menu"
        >
          <UserAvatar
            name={displayName}
            size="sm"
            className={cn(
              variant === "pill" && "ring-1 ring-border/50",
            )}
          />
          {showChevron && (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72 p-0 overflow-hidden">
          <div className="border-b border-border/60 bg-gradient-to-br from-primary/10 via-background to-muted/20 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <UserAvatar name={displayName} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                {contact && (
                  <p className="text-xs text-muted-foreground truncate">{contact}</p>
                )}
                {roleLabel && (
                  <span className="mt-1.5 inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {roleLabel}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DropdownMenuGroup className="p-1.5">
            {links.map(({ href, label, icon: Icon, active }) => (
              <DropdownMenuLinkItem
                key={href}
                href={href}
                render={<Link href={href} />}
                className={cn(
                  "gap-2.5 rounded-lg py-2 no-underline text-foreground",
                  active && "bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </DropdownMenuLinkItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="mx-0" />

          <DropdownMenuGroup className="p-1.5">
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer gap-2.5 rounded-lg py-2"
              onClick={() => setLogoutOpen(true)}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
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

/** Mobile drawer account block for marketing header */
export function HeaderAccountMobileLinks({
  profile,
  onNavigate,
}: {
  profile: HeaderAccountProfile;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const links = buildMenuLinks(pathname, profile);
  const displayName = getMemberDisplayName(profile.fullName);

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center gap-3 px-1">
        <UserAvatar name={displayName} size="md" />
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {profile.email?.trim() || profile.phone}
          </p>
        </div>
      </div>
      <ul className="space-y-1">
        {links.map(({ href, label, icon: Icon, active }) => (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
