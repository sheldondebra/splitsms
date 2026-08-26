"use client";

import { HeaderAccountMenu } from "@/components/layout/header-account-menu";
import type { HeaderAccountProfile } from "@/lib/user/header-account-types";

/** @deprecated Use HeaderAccountProfile from lib/user/header-account-types */
export type MemberProfileSummary = {
  fullName: string;
  email: string | null;
  phone: string;
  role?: HeaderAccountProfile["role"];
};

type UserProfileMenuProps = {
  profile: MemberProfileSummary;
  className?: string;
  showChevron?: boolean;
  variant?: "compact" | "pill" | "icon";
};

export function UserProfileMenu({
  profile,
  className,
  showChevron,
  variant = "compact",
}: UserProfileMenuProps) {
  return (
    <HeaderAccountMenu
      profile={{
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        role: profile.role ?? "MEMBER",
      }}
      className={className}
      variant={variant}
      showChevron={showChevron}
    />
  );
}
