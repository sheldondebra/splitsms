import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { getSession } from "@/lib/auth/session";
import {
  getUserNotifications,
  getUnreadCount,
  ensureLowBalanceNotification,
} from "@/lib/notifications";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const credit = await prisma.smsCredit.findUnique({
    where: { userId: session.userId },
  });
  if (credit) {
    await ensureLowBalanceNotification(session.userId, credit.balance);
  }

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(session.userId, 15),
    getUnreadCount(session.userId),
  ]);

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <DashboardTopbar
          title="Bulk SMS Console"
          subtitle="Overview & analytics"
          phone={session.phone}
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <main className="flex-1 app-shell p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
