"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutConfirmDialog } from "@/components/auth/logout-confirm-dialog";
import { UserAvatar } from "@/components/user/user-avatar";
import { getMemberDisplayName } from "@/lib/user/display";
import {
  getRoleLabel,
  type HeaderAccountProfile,
} from "@/lib/user/header-account-types";
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
  Banknote,
  BadgeCheck,
  ChevronDown,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuLinks = [
  { href: "/reseller", label: "Overview", icon: LayoutDashboard },
  { href: "/reseller/users", label: "Clients", icon: Users },
  { href: "/reseller/payments", label: "Payments", icon: CreditCard },
  { href: "/reseller/sender-ids", label: "Sender IDs", icon: BadgeCheck },
  { href: "/reseller/wallet", label: "Wallet", icon: Wallet },
  { href: "/reseller/payouts", label: "Payouts", icon: Banknote },
  { href: "/reseller/settings", label: "Settings", icon: Settings },
  { href: "/dashboard", label: "Member dashboard", icon: LayoutDashboard },
] as const;

export function ResellerAccountMenu({
  profile,
  className,
  variant = "pill",
}: {
  profile: HeaderAccountProfile;
  className?: string;
  variant?: "compact" | "pill";
}) {
  const [logoutOpen, setLogoutOpen] = useState(false);
  const pathname = usePathname();
  const displayName = getMemberDisplayName(profile.fullName);
  const contact = profile.email?.trim() || profile.phone;
  const roleLabel = getRoleLabel(profile.role) ?? "Reseller";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "inline-flex items-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            variant === "compact" && "h-8 gap-1 rounded-md px-1 pr-1.5 hover:bg-muted/80",
            variant === "pill" &&
              "gap-2 rounded-full border border-border/60 bg-muted/30 py-1 pl-1 pr-2.5 hover:bg-muted/50",
            className,
          )}
          aria-label="Account menu"
        >
          <UserAvatar
            name={displayName}
            size="sm"
            className={cn(variant === "pill" && "ring-1 ring-border/50")}
          />
          <span className="hidden max-w-[7rem] truncate text-xs font-semibold sm:inline">
            {displayName}
          </span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72 overflow-hidden p-0">
          <div className="border-b border-border/60 bg-gradient-to-br from-primary/10 via-background to-muted/20 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <UserAvatar name={displayName} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                {contact ? (
                  <p className="truncate text-xs text-muted-foreground">{contact}</p>
                ) : null}
                <span className="mt-1.5 inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          <DropdownMenuGroup className="p-1.5">
            {menuLinks.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/reseller"
                  ? pathname === "/reseller"
                  : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <DropdownMenuLinkItem
                  key={href}
                  href={href}
                  render={<Link href={href} />}
                  className={cn(
                    "gap-2.5 rounded-lg py-2 text-foreground no-underline",
                    active && "bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </DropdownMenuLinkItem>
              );
            })}
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

      <LogoutConfirmDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
    </>
  );
}
