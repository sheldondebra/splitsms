import { requireActiveMemberSession } from "@/lib/auth/require-active-member";
import { MemberAppShell } from "@/components/layout/member-app-shell";
import { TenantThemeWrap } from "@/components/tenant/tenant-theme";
import { enforceTenantMemberAccess } from "@/lib/reseller/require-tenant-member";
import { resolveTenantForMemberUser } from "@/lib/reseller/tenant";
import { getRequestTenant } from "@/lib/reseller/request-tenant";
import {
  getUserNotifications,
  getUnreadCount,
} from "@/lib/notifications";
import { prisma } from "@/lib/db";
import { getBalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function DevelopersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireActiveMemberSession();
  await enforceTenantMemberAccess(session.userId, session.role);

  const hostTenant = await getRequestTenant();
  const memberTenant =
    hostTenant ?? (await resolveTenantForMemberUser(session.userId));

  const [user, balance, notifications, unreadCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { fullName: true },
    }),
    getBalanceSnapshot(session.userId),
    getUserNotifications(session.userId, 15),
    getUnreadCount(session.userId),
  ]);

  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <TenantThemeWrap tenant={memberTenant}>
      <MemberAppShell
        greeting={firstName}
        notifications={notifications}
        unreadCount={unreadCount}
        balance={balance}
        tenant={memberTenant}
      >
        {children}
      </MemberAppShell>
    </TenantThemeWrap>
  );
}
