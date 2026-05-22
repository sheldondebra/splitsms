import { withApi } from "@/lib/api/with-api";
import { apiSuccess } from "@/lib/api/errors";
import { prisma } from "@/lib/db";

export const GET = withApi(
  async (request, ctx) => {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);
    const campaignId = url.searchParams.get("campaignId") ?? undefined;

    const messages = await prisma.message.findMany({
      where: {
        userId: ctx.user.id,
        ...(campaignId ? { campaignId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        recipient: true,
        status: true,
        providerType: true,
        sentAt: true,
        deliveredAt: true,
        cost: true,
        campaignId: true,
      },
    });

    return apiSuccess({
      data: messages.map((m) => ({
        ...m,
        cost: m.cost?.toNumber() ?? null,
      })),
    });
  },
  "/api/v1/reports",
  "sms.read",
);
