import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getDashboardOverview } from "@/lib/analytics/dashboard";
import { getBalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { userNeedsOnboarding } from "@/lib/onboarding";
import { redirect } from "next/navigation";
import { DashboardChartsPanel } from "@/components/dashboard/dashboard-charts-panel";
import { SupportChatPanel } from "@/components/dashboard/support-chat-panel";
import { buildSupportChatMessages } from "@/lib/support/chat";
import { loadSupportPresence } from "@/lib/support/presence";
import { DashboardWelcomeHero } from "@/components/dashboard/dashboard-welcome-balance";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { DeliverySyncPoller } from "@/components/dashboard/delivery-sync-poller";
import { SetupStrip } from "@/components/dashboard/setup-strip";
import { QuickActions } from "@/components/dashboard/quick-actions";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  if (session.role === "MEMBER" && (await userNeedsOnboarding(session.userId))) {
    redirect("/onboarding");
  }

  const [data, balance, user, recentMessages, hasTopup, senderIds, tickets, supportPresence] =
    await Promise.all([
      getDashboardOverview(session.userId),
      getBalanceSnapshot(session.userId),
      prisma.user.findUnique({
        where: { id: session.userId },
        select: { isVerified: true, fullName: true },
      }),
      prisma.message.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          recipient: true,
          status: true,
          createdAt: true,
          body: true,
        },
      }),
      prisma.transaction.findFirst({
        where: {
          userId: session.userId,
          type: { in: ["WALLET_TOPUP", "CREDIT_PURCHASE"] },
        },
      }),
      prisma.senderId.findMany({
        where: { userId: session.userId },
        select: { status: true },
      }),
      prisma.supportTicket.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "asc" },
        take: 12,
        select: { id: true, reference: true, message: true, status: true, createdAt: true },
      }),
      loadSupportPresence(),
    ]);

  const hasApprovedSender = senderIds.some((s) => s.status === "APPROVED");
  const hasBalance =
    balance.walletBalance > 0 || balance.creditBalance > 0 || Boolean(hasTopup);
  const firstName = user?.fullName?.split(" ")[0] ?? "there";
  const chatMessages = buildSupportChatMessages(firstName, tickets);
  const hasInTransit = recentMessages.some(
    (m) => m.status === "SENT" || m.status === "PENDING",
  );

  return (
    <div className="app-page space-y-5 pb-2 md:space-y-6">
      <DeliverySyncPoller active={hasInTransit} />

      <DashboardWelcomeHero
        firstName={firstName}
        balance={balance}
        messagesToday={data.messagesToday}
        deliveryRate={data.deliveryRate}
        campaigns={data.campaigns}
        activeSenderIds={data.activeSenderIds}
        hasApprovedSender={hasApprovedSender}
      />

      <SetupStrip
        phoneVerified={user?.isVerified ?? false}
        hasBalance={hasBalance}
        hasSenderId={hasApprovedSender}
        hasSentMessage={data.totalMessages > 0}
      />

      <QuickActions />

      <div className="grid min-w-0 gap-5 lg:grid-cols-5 lg:items-stretch lg:gap-6">
        <div className="min-w-0 space-y-5 lg:col-span-3 lg:space-y-6">
          <DashboardChartsPanel
            dailySms={data.charts.dailySms}
            deliveryChart={data.charts.deliveryChart}
            messagesToday={data.messagesToday}
            deliveryRate={data.deliveryRate}
            delivered={data.delivered}
            failed={data.failed}
            pending={data.pending}
            totalMessages={data.totalMessages}
          />
          <RecentActivityList messages={recentMessages} />
        </div>

        <div className="min-w-0 lg:col-span-2">
          <SupportChatPanel
            initialMessages={chatMessages}
            initialPresence={supportPresence}
          />
        </div>
      </div>
    </div>
  );
}
