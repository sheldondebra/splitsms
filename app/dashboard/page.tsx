import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getDashboardOverview } from "@/lib/analytics/dashboard";
import { getBalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { userNeedsOnboarding } from "@/lib/onboarding";
import { redirect } from "next/navigation";
import { DashboardChartsPanel } from "@/components/dashboard/dashboard-charts-panel";
import {
  SupportChatPanel,
} from "@/components/dashboard/support-chat-panel";
import { buildSupportChatMessages } from "@/lib/support/chat";
import { loadSupportPresence } from "@/lib/support/presence";
import { DashboardMetrics, DashboardAlert } from "@/components/dashboard/dashboard-metrics";
import { DashboardWelcomeBalance } from "@/components/dashboard/dashboard-welcome-balance";
import { RecentActivityList } from "@/components/dashboard/recent-activity-list";
import { DeliverySyncPoller } from "@/components/dashboard/delivery-sync-poller";
import { SetupStrip } from "@/components/dashboard/setup-strip";
import { Send, Megaphone, Percent, BadgeCheck } from "lucide-react";

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
    <div className="app-page space-y-5 md:space-y-6 pb-2">
      <DeliverySyncPoller active={hasInTransit} />
      <div className="hidden md:flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-[1.65rem]">
            Welcome back, {firstName}
          </h1>
          <DashboardWelcomeBalance balance={balance} />
        </div>
        <Link
          href="/dashboard/send"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors shrink-0"
        >
          <Send className="h-4 w-4" />
          Send SMS
        </Link>
      </div>

      <div className="md:hidden space-y-3">
        <p className="text-sm text-muted-foreground">Hi {firstName}</p>
        <DashboardWelcomeBalance balance={balance} className="mt-0" />
      </div>

      <Link
        href="/dashboard/send"
        className="md:hidden flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
      >
        <Send className="h-5 w-5" />
        Send SMS
      </Link>

      <SetupStrip
        phoneVerified={user?.isVerified ?? false}
        hasBalance={hasBalance}
        hasSenderId={hasApprovedSender}
        hasSentMessage={data.totalMessages > 0}
      />

      {balance.lowBalance && (
        <DashboardAlert variant="warning">
          <span>
            Low SMS balance — <strong>{balance.creditBalance}</strong> credits left.
          </span>
          <Link href="/dashboard/wallet" className="font-semibold text-primary text-sm">
            Top up →
          </Link>
        </DashboardAlert>
      )}

      {!hasApprovedSender && (
        <DashboardAlert>
          <span>Add a Sender ID before sending bulk SMS.</span>
          <Link href="/dashboard/sender-ids" className="font-semibold text-primary text-sm">
            Set up →
          </Link>
        </DashboardAlert>
      )}

      <DashboardMetrics
        metrics={[
          {
            label: "Sent today",
            value: data.messagesToday,
            icon: Send,
            href: "/dashboard/reports",
            tone: "primary",
          },
          {
            label: "Delivery rate",
            value: `${data.deliveryRate}%`,
            icon: Percent,
            href: "/dashboard/reports",
            tone:
              data.deliveryRate >= 80 ? "success" : data.deliveryRate >= 50 ? "primary" : "warning",
          },
          {
            label: "Campaigns",
            value: data.campaigns,
            icon: Megaphone,
            href: "/dashboard/campaigns",
            tone: "neutral",
          },
          {
            label: "Sender IDs",
            value: data.activeSenderIds,
            icon: BadgeCheck,
            href: "/dashboard/sender-ids",
            tone: "neutral",
          },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-5 lg:items-stretch">
        <div className="lg:col-span-3 space-y-6">
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

        <div className="lg:col-span-2">
          <SupportChatPanel
            initialMessages={chatMessages}
            initialPresence={supportPresence}
          />
        </div>
      </div>
    </div>
  );
}
