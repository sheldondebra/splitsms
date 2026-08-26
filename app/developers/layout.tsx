import { requireActiveMemberSession } from "@/lib/auth/require-active-member";
import { MemberAppShell } from "@/components/layout/member-app-shell";
import { TenantThemeWrap } from "@/components/tenant/tenant-theme";
import { enforceTenantMemberAccess } from "@/lib/reseller/require-tenant-member";
import { resolveTenantForMemberUser } from "@/lib/reseller/tenant";
import { getRequestTenant } from "@/lib/reseller/request-tenant";
import {
  getNotificationsSummary,
  ensureLowBalanceNotification,
} from "@/lib/notifications";
import { ensureRegisterSenderIdNotification } from "@/lib/sender-ids/notifications";
import { prisma } from "@/lib/db";
import { getBalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { after } from "next/server";
import type { Metadata, Viewport } from "next";

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

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SplitSMS",
  },
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

  const [user, balance, { notifications, unreadCount }] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { fullName: true, email: true, phone: true },
    }),
    getBalanceSnapshot(session.userId),
    getNotificationsSummary(session.userId, 15),
  ]);

  after(async () => {
    await Promise.all([
      ensureLowBalanceNotification(session.userId, balance.creditBalance),
      ensureRegisterSenderIdNotification(session.userId),
    ]).catch(() => undefined);
  });

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
