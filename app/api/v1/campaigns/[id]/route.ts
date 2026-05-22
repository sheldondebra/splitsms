import { withApi } from "@/lib/api/with-api";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { prisma } from "@/lib/db";

function campaignIdFromUrl(request: Request) {
  const parts = new URL(request.url).pathname.split("/");
  return parts[parts.length - 1] ?? "";
}

export const GET = withApi(
  async (request, ctx) => {
    const id = campaignIdFromUrl(request);
    const campaign = await prisma.campaign.findFirst({
      where: { id, userId: ctx.user.id },
      include: {
        _count: { select: { messages: true } },
        contactGroup: { select: { name: true } },
      },
    });
    if (!campaign) return apiError("NOT_FOUND", "Campaign not found", 404);

    const stats = await prisma.message.groupBy({
      by: ["status"],
      where: { campaignId: campaign.id },
      _count: { id: true },
    });

    return apiSuccess({
      data: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        sender_id: campaign.senderId,
        message: campaign.message,
        recipient_count: campaign.recipientCount,
        group: campaign.contactGroup?.name ?? null,
        message_count: campaign._count.messages,
        delivery_stats: stats.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
        scheduled_at: campaign.scheduledAt,
        created_at: campaign.createdAt,
      },
    });
  },
  "/api/v1/campaigns/:id",
  "campaigns.read",
);
