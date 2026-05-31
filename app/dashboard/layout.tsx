import { MemberAppShell } from "@/components/layout/member-app-shell";
import { TenantThemeWrap } from "@/components/tenant/tenant-theme";
import { requireActiveMemberSession } from "@/lib/auth/require-active-member";
import { enforceTenantMemberAccess } from "@/lib/reseller/require-tenant-member";
import { resolveTenantForMemberUser } from "@/lib/reseller/tenant";
import { getRequestTenant } from "@/lib/reseller/request-tenant";
import {
  getUserNotifications,
  getUnreadCount,
  ensureLowBalanceNotification,
} from "@/lib/notifications";
import { prisma } from "@/lib/db";
import { userNeedsProfileCompletion } from "@/lib/auth/phone-auth";
import { redirect } from "next/navigation";
import { getBalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireActiveMemberSession();
  await enforceTenantMemberAccess(session.userId, session.role);

  const hostTenant = await getRequestTenant();
  const memberTenant =
    hostTenant ?? (await resolveTenantForMemberUser(session.userId));

  const [credit, user, balance] = await Promise.all([
    prisma.smsCredit.findUnique({ where: { userId: session.userId } }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { fullName: true, email: true, phone: true },
    }),
    getBalanceSnapshot(session.userId),
  ]);

  if (credit) {
    await ensureLowBalanceNotification(session.userId, credit.balance);
  }

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(session.userId, 15),
    getUnreadCount(session.userId),
  ]);

  if (user && userNeedsProfileCompletion(user.fullName)) {
    redirect("/complete-profile");
  }

  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <TenantThemeWrap tenant={memberTenant}>
      <MemberAppShell
        greeting={firstName}
        profile={{
          fullName: user?.fullName ?? "Member",
          email: user?.email ?? null,
          phone: user?.phone ?? session.phone,
          role: session.role,
        }}
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
