import { withApi } from "@/lib/api/with-api";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { prisma } from "@/lib/db";

function campaignIdFromUrl(request: Request) {
  const parts = new URL(request.url).pathname.split("/");
  return parts[parts.length - 2] ?? "";
}

export const GET = withApi(
  async (request, ctx) => {
    const id = campaignIdFromUrl(request);
    const campaign = await prisma.campaign.findFirst({
      where: { id, userId: ctx.user.id },
      select: { id: true },
    });
    if (!campaign) return apiError("NOT_FOUND", "Campaign not found", 404);

    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 200);

    const messages = await prisma.message.findMany({
      where: { campaignId: id, userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        recipient: true,
        status: true,
        sentAt: true,
        deliveredAt: true,
        failedAt: true,
        failureReason: true,
        cost: true,
        smsUnits: true,
      },
    });

    return apiSuccess({
      data: messages.map((m) => ({
        id: m.id,
        recipient: m.recipient,
        status: m.status,
        sent_at: m.sentAt,
        delivered_at: m.deliveredAt,
        failed_at: m.failedAt,
        failure_reason: m.failureReason,
        cost: m.cost?.toNumber() ?? null,
        sms_units: m.smsUnits,
      })),
    });
  },
  "/api/v1/campaigns/:id/messages",
  "sms.read",
);
