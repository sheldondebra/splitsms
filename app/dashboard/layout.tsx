import { MemberAppShell } from "@/components/layout/member-app-shell";
import { getSession } from "@/lib/auth/session";
import {
  getUserNotifications,
  getUnreadCount,
  ensureLowBalanceNotification,
} from "@/lib/notifications";
import { prisma } from "@/lib/db";
import { getBalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { redirect } from "next/navigation";
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
  const session = await getSession();
  if (!session) redirect("/login");

  const [credit, user, balance] = await Promise.all([
    prisma.smsCredit.findUnique({ where: { userId: session.userId } }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { fullName: true },
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

  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <MemberAppShell
      greeting={firstName}
      notifications={notifications}
      unreadCount={unreadCount}
      balance={balance}
    >
      {children}
    </MemberAppShell>
  );
}
