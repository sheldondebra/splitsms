import {
  getAdminCampaignAnalytics,
  getAdminMessageLogs,
  getAdminReportCampaigns,
  getAdminReportsOverview,
} from "@/lib/admin/messages-dashboard";
import { prisma } from "@/lib/db";
import {
  AdminAlert,
  AdminPage,
  AdminPageHeader,
} from "@/components/admin/admin-page-shell";
import { AdminMessagesActions } from "@/components/admin/admin-messages-actions";
import { ReportsDashboard } from "@/components/dashboard/reports-dashboard";
import { fetchMnotifyBalance } from "@/lib/sms/provider-balances";
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
    period?: string;
    processed?: string;
    sent?: string;
    failed?: string;
    remaining?: string;
    retried?: string;
    credits_blocked?: string;
    credits_messages?: string;
    notified?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10) || 1;
  const userId = params.userId?.trim() || undefined;

  const [overview, { items, total, totalPages }, campaigns, campaignAnalytics, scopedMember, mnotifyBalance] =
    await Promise.all([
      getAdminReportsOverview(userId),
      getAdminMessageLogs({
        userId,
        memberSearch: params.member,
        campaignId: params.campaign,
        status: params.status,
        countryCode: params.country,
        search: params.q,
        period: params.period,
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
      fetchMnotifyBalance().catch(() => null),
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
  if (params.period === "today") exportParams.set("period", "today");
  if (userId) exportParams.set("userId", userId);
  const exportUrl = `/api/admin/messages/export?${exportParams.toString()}`;

  const scopeLabel = userId
    ? `Member: ${scopedMember?.fullName ?? scopedMember?.phone ?? userId}`
    : "All members";

  const retryFailedCount = params.campaign
    ? (campaignReport?.failed ?? overview.failed)
    : overview.failed;

  const mnotifyLow =
    mnotifyBalance?.amount != null && mnotifyBalance.amount < 50 && overview.pending + overview.failed > 0;

  return (
    <AdminPage wide>
      <AdminPageHeader
        title="SMS logs"
        description={`Platform-wide delivery reports with filters, charts, and CSV export. ${scopeLabel}.`}
        icon={Send}
        actions={
          <AdminMessagesActions
            pendingCount={overview.pending}
            failedCount={retryFailedCount}
            campaignId={params.campaign}
          />
        }
      />

      {params.processed && (
        <AdminAlert variant="info">
          Processed {params.processed} messages — {params.sent ?? 0} sent, {params.failed ?? 0} failed
          {params.remaining && Number(params.remaining) > 0
            ? `, ${params.remaining} still pending`
            : ""}
          .
        </AdminAlert>
      )}

      {params.retried && (
        <AdminAlert variant="info">
          Re-queued {params.retried} failed message{Number(params.retried) === 1 ? "" : "s"} for delivery
          {Number(params.retried) > 0 ? " — members notified by email." : "."}
          {overview.pending > 0 ? " Use “Process pending now” to send immediately." : ""}
        </AdminAlert>
      )}

      {params.error === "credits" && (
        <AdminAlert variant="destructive">
          Retry blocked for {params.credits_blocked ?? "one or more"} member
          {Number(params.credits_blocked ?? 1) === 1 ? "" : "s"} (
          {params.credits_messages ?? "some"} message
          {Number(params.credits_messages ?? 1) === 1 ? "" : "s"}) — not enough SMS credits.
          Those members were notified in-app, by email, and with a short SMS to top up.
        </AdminAlert>
      )}

      {params.credits_blocked && params.error !== "credits" && (
        <AdminAlert variant="warning">
          Skipped {params.credits_blocked} member{Number(params.credits_blocked) === 1 ? "" : "s"} (
          {params.credits_messages} message{Number(params.credits_messages) === 1 ? "" : "s"}) with
          insufficient credits. They were notified in-app, by email, and SMS to top up
          {params.notified ? ` (${params.notified} emailed)` : ""}.
        </AdminAlert>
      )}

      {(overview.pending > 0 || overview.failed > 0) && (
        <AdminAlert variant={mnotifyLow ? "destructive" : overview.pending > 0 ? "warning" : "info"}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1 leading-relaxed">
              <p>
                {overview.pending > 0 && (
                  <>
                    <strong>{overview.pending.toLocaleString()}</strong> message
                    {overview.pending === 1 ? "" : "s"} still <strong>PENDING</strong>
                    {overview.failed > 0 ? " · " : ""}
                  </>
                )}
                {overview.failed > 0 && (
                  <>
                    <strong>{overview.failed.toLocaleString()}</strong> message
                    {overview.failed === 1 ? "" : "s"} failed delivery
                  </>
                )}
                .
              </p>
              <p className="text-muted-foreground">
                {mnotifyLow ? (
                  <>
                    mNotify balance is low ({mnotifyBalance?.display ?? "unknown"}). Top up, then retry
                    failed and process the queue.
                  </>
                ) : mnotifyBalance?.status === "error" ||
                  mnotifyBalance?.status === "unconfigured" ? (
                  <>
                    Check provider setup under Admin → Providers
                    {overview.pending > 0 ? ", then process the pending queue." : "."}
                  </>
                ) : overview.pending > 0 && overview.failed > 0 ? (
                  <>
                    Process the pending queue now, then retry failed messages. mNotify:{" "}
                    {mnotifyBalance?.display ?? "—"}.
                  </>
                ) : overview.pending > 0 ? (
                  <>
                    Process pending now to send immediately (bypasses the worker). mNotify:{" "}
                    {mnotifyBalance?.display ?? "—"}.
                  </>
                ) : (
                  <>
                    Retry failed to re-queue them for delivery. mNotify:{" "}
                    {mnotifyBalance?.display ?? "—"}.
                  </>
                )}
              </p>
            </div>
            <AdminMessagesActions
              pendingCount={overview.pending}
              failedCount={retryFailedCount}
              campaignId={params.campaign}
            />
          </div>
        </AdminAlert>
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
          userId,
          member: params.member,
          period: params.period,
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
