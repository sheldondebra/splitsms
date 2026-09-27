"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutConfirmDialog } from "@/components/auth/logout-confirm-dialog";
import { getMemberDisplayName } from "@/lib/user/display";
import {
  getRoleLabel,
  profileIsAdmin,
  type HeaderAccountProfile,
} from "@/lib/user/header-account-types";
import { UserAvatar } from "@/components/user/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronRight,
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
  hint?: string;
};

function isLinkActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return (
      pathname === "/dashboard" ||
      (pathname.startsWith("/dashboard/") &&
        !pathname.startsWith("/dashboard/settings"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function buildMenuSections(pathname: string, profile: HeaderAccountProfile) {
  const make = (
    href: string,
    label: string,
    icon: MenuLink["icon"],
    hint?: string,
  ): MenuLink => ({
    href,
    label,
    icon,
    hint,
    active: isLinkActive(pathname, href),
  });

  const workspace: MenuLink[] = [
    make("/dashboard", "Dashboard", LayoutDashboard, "Member portal"),
  ];
  if (profileIsAdmin(profile)) {
    workspace.push(make("/admin", "Admin", Shield, "Operations console"));
  }

  const tools: MenuLink[] = [
    make("/developers", "Developers", Code2, "API keys & webhooks"),
    make("/api-docs", "API docs", Terminal, "Reference & examples"),
  ];

  const account: MenuLink[] = [
    make("/dashboard/settings", "Settings", Settings, "Profile & security"),
  ];

  return [
    { id: "workspace", label: "Workspace", links: workspace },
    { id: "tools", label: "Build", links: tools },
    { id: "account", label: "Account", links: account },
  ] as const;
}

type HeaderAccountMenuProps = {
  profile: HeaderAccountProfile;
  className?: string;
  /** Toolbar chip inside dashboard/admin clusters */
  variant?: "compact" | "pill" | "icon";
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
  const sections = buildMenuSections(pathname, profile);
  const isAdmin = profileIsAdmin(profile);

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
            variant === "icon" &&
              "h-9 w-9 justify-center rounded-full p-0 hover:bg-muted/70",
            className,
          )}
          aria-label="Account menu"
        >
          <UserAvatar
            name={displayName}
            size={variant === "icon" ? "md" : "sm"}
            className={cn(
              variant === "pill" && "ring-1 ring-border/50",
              variant === "icon" && "ring-0",
            )}
          />
          {showChevron && variant !== "icon" && (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-[19.5rem] overflow-hidden rounded-2xl p-0 shadow-lg ring-1 ring-border/60"
        >
          <div
            className={cn(
              "border-b border-border/60 px-4 py-4",
              isAdmin
                ? "bg-gradient-to-br from-primary/[0.12] via-background to-emerald-500/[0.06]"
                : "bg-gradient-to-br from-primary/[0.10] via-background to-muted/30",
            )}
          >
            <div className="flex items-start gap-3">
              <UserAvatar
                name={displayName}
                size="lg"
                className="ring-2 ring-background shadow-sm"
              />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="truncate text-sm font-semibold tracking-tight">
                  {displayName}
                </p>
                {contact ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {contact}
                  </p>
                ) : null}
                {roleLabel ? (
                  <span
                    className={cn(
                      "mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
                      isAdmin
                        ? "bg-primary/12 text-primary ring-primary/20"
                        : "bg-muted text-muted-foreground ring-border/60",
                    )}
                  >
                    {isAdmin ? <Shield className="h-3 w-3" /> : null}
                    {roleLabel}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="max-h-[min(24rem,var(--available-height))] overflow-y-auto py-1.5">
            {sections.map((section, index) => (
              <div key={section.id}>
                {index > 0 ? (
                  <DropdownMenuSeparator className="mx-2 my-1.5" />
                ) : null}
                <DropdownMenuGroup className="px-1.5">
                  <DropdownMenuLabel className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.label}
                  </DropdownMenuLabel>
                  {section.links.map(({ href, label, icon: Icon, active, hint }) => (
                    <DropdownMenuLinkItem
                      key={href}
                      href={href}
                      render={<Link href={href} />}
                      className={cn(
                        "group relative gap-2.5 rounded-xl px-2.5 py-2 text-foreground no-underline",
                        active
                          ? "bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary"
                          : "hover:bg-muted/70",
                      )}
                    >
                      {active ? (
                        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" />
                      ) : null}
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
                          active
                            ? "bg-primary/15 text-primary ring-primary/20"
                            : "bg-muted/60 text-muted-foreground ring-border/50 group-hover:bg-background",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium leading-tight">
                          {label}
                        </span>
                        {hint ? (
                          <span
                            className={cn(
                              "mt-0.5 block truncate text-[11px] leading-tight",
                              active
                                ? "text-primary/70"
                                : "text-muted-foreground",
                            )}
                          >
                            {hint}
                          </span>
                        ) : null}
                      </span>
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity",
                          active
                            ? "text-primary opacity-70"
                            : "text-muted-foreground group-hover:opacity-50",
                        )}
                      />
                    </DropdownMenuLinkItem>
                  ))}
                </DropdownMenuGroup>
              </div>
            ))}
          </div>

          <div className="border-t border-border/60 bg-muted/20 p-1.5">
            <DropdownMenuGroup>
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer gap-2.5 rounded-xl px-2.5 py-2.5"
                onClick={() => setLogoutOpen(true)}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive ring-1 ring-destructive/15">
                  <LogOut className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-tight">
                    Sign out
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-tight text-destructive/70">
                    End this session on this device
                  </span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <LogoutConfirmDialog open={logoutOpen} onOpenChange={setLogoutOpen} />
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
  const sections = buildMenuSections(pathname, profile);
  const displayName = getMemberDisplayName(profile.fullName);
  const contact = profile.email?.trim() || profile.phone;
  const roleLabel = getRoleLabel(profile.role);
  const isAdmin = profileIsAdmin(profile);

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-3">
        <UserAvatar name={displayName} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          {contact ? (
            <p className="truncate text-xs text-muted-foreground">{contact}</p>
          ) : null}
          {roleLabel ? (
            <span
              className={cn(
                "mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
                isAdmin
                  ? "bg-primary/12 text-primary ring-primary/20"
                  : "bg-muted text-muted-foreground ring-border/60",
              )}
            >
              {isAdmin ? <Shield className="h-3 w-3" /> : null}
              {roleLabel}
            </span>
          ) : null}
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.id} className="space-y-1">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {section.label}
          </p>
          <ul className="space-y-1">
            {section.links.map(({ href, label, icon: Icon, active, hint }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
                      active
                        ? "bg-primary/15 text-primary ring-primary/20"
                        : "bg-muted/60 text-muted-foreground ring-border/50",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block leading-tight">{label}</span>
                    {hint ? (
                      <span
                        className={cn(
                          "mt-0.5 block truncate text-[11px] font-normal leading-tight",
                          active ? "text-primary/70" : "text-muted-foreground",
                        )}
                      >
                        {hint}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
