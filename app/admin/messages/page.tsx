import {
  getAdminCampaignAnalytics,
  getAdminMessageLogs,
  getAdminReportCampaigns,
  getAdminReportsOverview,
} from "@/lib/admin/messages-dashboard";
import { prisma } from "@/lib/db";
import {
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page-shell";
import { ReportsDashboard } from "@/components/dashboard/reports-dashboard";
import { Send } from "lucide-react";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{
    userId?: string;
    member?: string;
    campaign?: string;
    status?: string;
    country?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10) || 1;
  const userId = params.userId?.trim() || undefined;

  const [overview, { items, total, totalPages }, campaigns, campaignAnalytics, scopedMember] =
    await Promise.all([
      getAdminReportsOverview(userId),
      getAdminMessageLogs({
        userId,
        memberSearch: params.member,
        campaignId: params.campaign,
        status: params.status,
        countryCode: params.country,
        search: params.q,
        page,
        pageSize: 30,
      }),
      getAdminReportCampaigns(userId),
      params.campaign ? getAdminCampaignAnalytics(params.campaign) : null,
      userId
        ? prisma.user.findUnique({
            where: { id: userId },
            select: { fullName: true, phone: true },
          })
        : Promise.resolve(null),
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
    memberId: m.user.id,
    memberName: m.user.fullName,
    memberPhone: m.user.phone,
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

  const exportParams = new URLSearchParams();
  if (params.q) exportParams.set("q", params.q);
  if (params.status && params.status !== "all") exportParams.set("status", params.status);
  if (params.country && params.country !== "all") exportParams.set("country", params.country);
  if (params.campaign) exportParams.set("campaign", params.campaign);
  if (params.member) exportParams.set("member", params.member);
  if (userId) exportParams.set("userId", userId);
  const exportUrl = `/api/admin/messages/export?${exportParams.toString()}`;

  const scopeLabel = userId
    ? `Member: ${scopedMember?.fullName ?? scopedMember?.phone ?? userId}`
    : "All members";

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="SMS logs"
        description={`Platform-wide delivery reports with filters, charts, and CSV export. ${scopeLabel}.`}
        icon={Send}
      />

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
          userId,
          member: params.member,
        }}
        overview={overview}
        campaigns={campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          memberName: c.user.fullName,
        }))}
        campaignReport={campaignReport}
        failedInView={messages.filter((m) => m.status === "FAILED").length}
        exportUrl={exportUrl}
        basePath="/admin/messages"
        showMemberColumn={!userId}
        showRetry={false}
        showQuickLinks={false}
        memberFilter={params.member}
        emptyAction={{ label: "View members", href: "/admin/members" }}
      />
    </AdminPage>
  );
}
