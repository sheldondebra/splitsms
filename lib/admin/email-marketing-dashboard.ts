import { prisma } from "@/lib/db";
import { ensureEmailMarketingTemplates } from "@/lib/admin/email-marketing-templates";
import {
  EMAIL_MARKETING_INACTIVE_DAYS_DEFAULT,
  EMAIL_MARKETING_MAX_RECIPIENTS,
  EMAIL_MARKETING_NEWSLETTER_MAX_RECIPIENTS,
} from "@/lib/admin/email-marketing-shared";
import { countMarketingAudience } from "@/lib/admin/email-marketing-audience";
import { attachCampaignImages, attachTemplateImages } from "@/lib/admin/email-marketing-images";

export type EmailMarketingTab =
  | "overview"
  | "compose"
  | "templates"
  | "subscribers"
  | "history"
  | "automations";

export async function getEmailMarketingDashboard(params: {
  tab?: string;
  campaignId?: string;
}) {
  await ensureEmailMarketingTemplates();

  const tab: EmailMarketingTab =
    params.tab === "compose" ||
    params.tab === "templates" ||
    params.tab === "subscribers" ||
    params.tab === "history" ||
    params.tab === "automations"
      ? params.tab
      : "overview";

  const [templates, campaigns, totals, recentDeliveries] = await Promise.all([
    prisma.emailMarketingTemplate.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    }),
    prisma.emailMarketingCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        template: { select: { name: true, slug: true } },
        createdBy: { select: { fullName: true } },
        _count: { select: { deliveries: true } },
      },
    }),
    prisma.emailMarketingCampaign.aggregate({
      _sum: { sentCount: true, failedCount: true, recipientCount: true },
      _count: true,
    }),
    prisma.emailMarketingDelivery.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const campaignsInWindow = await prisma.emailMarketingCampaign.findMany({
    where: { createdAt: { gte: since }, status: { in: ["SENT", "PARTIAL", "FAILED"] } },
    select: { createdAt: true, sentCount: true, failedCount: true },
  });

  const chartMap = new Map<string, { date: string; sent: number; failed: number }>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    chartMap.set(key, { date: key.slice(5), sent: 0, failed: 0 });
  }
  for (const c of campaignsInWindow) {
    const key = c.createdAt.toISOString().slice(0, 10);
    const row = chartMap.get(key);
    if (row) {
      row.sent += c.sentCount;
      row.failed += c.failedCount;
    }
  }

  const [allCount, inactiveCount, memberCount, resellerCount, enterpriseCount, newsletterCount, lowCreditsCount, newMembersCount] =
    await Promise.all([
      countMarketingAudience({ audienceType: "all" }),
      countMarketingAudience({
        audienceType: "inactive",
        inactiveDays: EMAIL_MARKETING_INACTIVE_DAYS_DEFAULT,
      }),
      countMarketingAudience({ audienceType: "role_member" }),
      countMarketingAudience({ audienceType: "role_reseller" }),
      countMarketingAudience({ audienceType: "role_enterprise" }),
      countMarketingAudience({ audienceType: "newsletter" }),
      countMarketingAudience({ audienceType: "low_credits" }),
      countMarketingAudience({ audienceType: "new_members" }),
    ]);

  const subscribers = await prisma.emailMarketingSubscriber.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const [templatesWithImages, campaignsWithImages, campaignMetas, engagementTotals] =
    await Promise.all([
      attachTemplateImages(templates),
      attachCampaignImages(campaigns),
      prisma.emailMarketingCampaignMeta.findMany({
        where: { campaignId: { in: campaigns.map((c) => c.id) } },
      }),
      prisma.emailMarketingCampaignMeta.aggregate({
        _sum: {
          uniqueOpenCount: true,
          uniqueClickCount: true,
          unsubscribeCount: true,
        },
      }),
    ]);

  const metaByCampaign = new Map(campaignMetas.map((row) => [row.campaignId, row]));
  const campaignsWithStats = campaignsWithImages.map((campaign) => {
    const meta = metaByCampaign.get(campaign.id);
    const sent = campaign.sentCount;
    return {
      ...campaign,
      scheduledAt: meta?.scheduledAt ?? null,
      uniqueOpenCount: meta?.uniqueOpenCount ?? 0,
      uniqueClickCount: meta?.uniqueClickCount ?? 0,
      unsubscribeCount: meta?.unsubscribeCount ?? 0,
      openRate: sent > 0 ? Math.round(((meta?.uniqueOpenCount ?? 0) / sent) * 100) : null,
      clickRate: sent > 0 ? Math.round(((meta?.uniqueClickCount ?? 0) / sent) * 100) : null,
    };
  });

  let selectedCampaign = null as
    | (typeof campaigns)[number] & {
        deliveries: {
          id: string;
          email: string;
          fullName: string | null;
          status: string;
          error: string | null;
          sentAt: Date | null;
        }[];
      }
    | null;

  if (params.campaignId) {
    selectedCampaign = await prisma.emailMarketingCampaign.findUnique({
      where: { id: params.campaignId },
      include: {
        template: { select: { name: true, slug: true } },
        createdBy: { select: { fullName: true } },
        _count: { select: { deliveries: true } },
        deliveries: {
          orderBy: { createdAt: "desc" },
          take: 100,
          select: {
            id: true,
            email: true,
            fullName: true,
            status: true,
            error: true,
            sentAt: true,
          },
        },
      },
    });
  }

  const selectedMeta = selectedCampaign
    ? await prisma.emailMarketingCampaignMeta.findUnique({
        where: { campaignId: selectedCampaign.id },
      })
    : null;

  const selectedWithImage = selectedCampaign
    ? {
        ...selectedCampaign,
        imageUrl:
          (await attachCampaignImages([{ id: selectedCampaign.id }]))[0]?.imageUrl ?? null,
        scheduledAt: selectedMeta?.scheduledAt ?? null,
        uniqueOpenCount: selectedMeta?.uniqueOpenCount ?? 0,
        uniqueClickCount: selectedMeta?.uniqueClickCount ?? 0,
        unsubscribeCount: selectedMeta?.unsubscribeCount ?? 0,
        openRate:
          selectedCampaign.sentCount > 0
            ? Math.round(((selectedMeta?.uniqueOpenCount ?? 0) / selectedCampaign.sentCount) * 100)
            : null,
        clickRate:
          selectedCampaign.sentCount > 0
            ? Math.round(((selectedMeta?.uniqueClickCount ?? 0) / selectedCampaign.sentCount) * 100)
            : null,
      }
    : null;

  const deliverySent =
    recentDeliveries.find((d) => d.status === "sent")?._count ?? 0;
  const deliveryFailed =
    recentDeliveries.find((d) => d.status === "failed")?._count ?? 0;

  return {
    tab,
    maxRecipients: EMAIL_MARKETING_MAX_RECIPIENTS,
    newsletterMaxRecipients: EMAIL_MARKETING_NEWSLETTER_MAX_RECIPIENTS,
    inactiveDaysDefault: EMAIL_MARKETING_INACTIVE_DAYS_DEFAULT,
    templates: templatesWithImages,
    campaigns: campaignsWithStats,
    selectedCampaign: selectedWithImage,
    subscribers,
    subscriberCount: newsletterCount,
    stats: {
      campaignCount: totals._count,
      emailsSent: totals._sum.sentCount ?? 0,
      emailsFailed: totals._sum.failedCount ?? 0,
      deliverySent,
      deliveryFailed,
      uniqueOpens: engagementTotals._sum.uniqueOpenCount ?? 0,
      uniqueClicks: engagementTotals._sum.uniqueClickCount ?? 0,
      unsubscribes: engagementTotals._sum.unsubscribeCount ?? 0,
      successRate:
        deliverySent + deliveryFailed === 0
          ? null
          : Math.round((deliverySent / (deliverySent + deliveryFailed)) * 100),
    },
    chart: [...chartMap.values()],
    audienceCounts: {
      all: allCount,
      inactive: inactiveCount,
      role_member: memberCount,
      role_reseller: resellerCount,
      role_enterprise: enterpriseCount,
      newsletter: newsletterCount,
      low_credits: lowCreditsCount,
      new_members: newMembersCount,
    },
  };
}

export type EmailMarketingDashboard = Awaited<
  ReturnType<typeof getEmailMarketingDashboard>
>;
