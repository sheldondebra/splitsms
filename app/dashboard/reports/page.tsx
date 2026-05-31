import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  getDashboardOverview,
  getMessageLogs,
  getCampaignAnalytics,
} from "@/lib/analytics/dashboard";
import { syncUserPendingMnotifyDeliveries } from "@/lib/sms/sync-mnotify-dlr";
import { DeliverySyncPoller } from "@/components/dashboard/delivery-sync-poller";
import { FriendlyAlert } from "@/components/dashboard/friendly-alert";
import { ReportsDashboard } from "@/components/dashboard/reports-dashboard";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { BarChart3 } from "lucide-react";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    campaign?: string;
    status?: string;
    country?: string;
    q?: string;
    page?: string;
    retried?: string;
    sent?: string;
    error?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) return null;
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10) || 1;

  await syncUserPendingMnotifyDeliveries(session.userId, 40).catch(() => undefined);

  const [overview, { items, total, totalPages }, campaigns, campaignAnalytics] =
    await Promise.all([
      getDashboardOverview(session.userId),
      getMessageLogs(session.userId, {
        campaignId: params.campaign,
        status: params.status,
        countryCode: params.country,
        search: params.q,
        page,
        pageSize: 30,
      }),
      prisma.campaign.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, name: true, status: true },
      }),
      params.campaign ? getCampaignAnalytics(session.userId, params.campaign) : null,
    ]);

  const messages = items.map((m) => ({
    id: m.id,
    recipient: m.recipient,
    body: m.body,
    status: m.status,
    countryCode: m.countryCode,
    senderId: m.senderId,
    smsUnits: m.smsUnits,
    cost: m.cost?.toNumber() ?? null,
    failureReason: m.failureReason,
    sentAt: m.sentAt?.toISOString() ?? null,
    deliveredAt: m.deliveredAt?.toISOString() ?? null,
    failedAt: m.failedAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    campaignId: m.campaignId,
    campaignName: m.campaign?.name ?? null,
  }));

  const campaignReport = campaignAnalytics
    ? {
        id: campaignAnalytics.campaign.id,
        name: campaignAnalytics.campaign.name,
        status: campaignAnalytics.campaign.status,
        message: campaignAnalytics.campaign.message,
        recipientCount: campaignAnalytics.recipientCount,
        delivered: campaignAnalytics.delivered,
        failed: campaignAnalytics.failed,
        pending: campaignAnalytics.pending,
        sent: campaignAnalytics.sent,
        total: campaignAnalytics.total,
        deliveryPct: campaignAnalytics.deliveryPct,
        cost: campaignAnalytics.cost,
      }
    : null;

  const exportUrl = `/api/dashboard/reports/export?${new URLSearchParams({
    ...(params.q ? { q: params.q } : {}),
    ...(params.status && params.status !== "all" ? { status: params.status } : {}),
    ...(params.country && params.country !== "all" ? { country: params.country } : {}),
    ...(params.campaign ? { campaign: params.campaign } : {}),
  }).toString()}`;

  const failedInView = messages.filter((m) => m.status === "FAILED").length;
  const hasInTransit = messages.some(
    (m) => m.status === "SENT" || m.status === "PENDING",
  );

  return (
    <AppPage wide>
      <DeliverySyncPoller active={hasInTransit} />
      <PageHeader
        title="Delivery reports"
        description="Detailed delivery analytics, filters, and per-message logs for every SMS you send."
        icon={BarChart3}
        mobileDescription="Charts, filters, and message-level delivery details."
      />

      {params.sent && (
        <FriendlyAlert success="1" successMessage="Your messages were sent successfully." />
      )}
      {params.retried && (
        <FriendlyAlert
          success="1"
          successMessage={`We are resending ${params.retried} failed message(s).`}
        />
      )}
      {params.error && (
        <FriendlyAlert error={params.error} />
      )}

      <ReportsDashboard
        messages={messages}
        total={total}
        page={page}
        totalPages={totalPages}
        filters={{
          campaign: params.campaign,
          status: params.status,
          country: params.country,
          q: params.q,
        }}
        overview={{
          totalMessages: overview.totalMessages,
          messagesToday: overview.messagesToday,
          deliveryRate: overview.deliveryRate,
          delivered: overview.delivered,
          failed: overview.failed,
          pending: overview.pending,
          sent: overview.sent,
          charts: overview.charts,
        }}
        campaigns={campaigns}
        campaignReport={campaignReport}
        failedInView={failedInView}
        exportUrl={exportUrl}
      />
    </AppPage>
  );
}
