import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { getSession } from "@/lib/auth/session";
import {
  getUserNotifications,
  getUnreadCount,
  ensureLowBalanceNotification,
} from "@/lib/notifications";
import { prisma } from "@/lib/db";
import { getBalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { redirect } from "next/navigation";

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
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <DashboardTopbar
          greeting={firstName}
          phone={session.phone}
          notifications={notifications}
          unreadCount={unreadCount}
          balance={balance}
        />
        <main className="flex-1 app-shell px-4 pb-24 pt-2 md:px-8 md:pb-8 md:pt-4 lg:px-10">
          <div className="dashboard-container">{children}</div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
