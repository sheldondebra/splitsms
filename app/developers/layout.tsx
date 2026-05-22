import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { MemberAppShell } from "@/components/layout/member-app-shell";
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
  const session = await getSession();
  if (!session) redirect("/login");

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
    <MemberAppShell
      greeting={firstName}
      notifications={notifications}
      unreadCount={unreadCount}
      balance={balance}
    >
      <div className="app-page md:max-w-5xl">{children}</div>
    </MemberAppShell>
  );
}
