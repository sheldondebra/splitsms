import { withApi } from "@/lib/api/with-api";
import { apiSuccess } from "@/lib/api/errors";
import { prisma } from "@/lib/db";

export const GET = withApi(
  async (request, ctx) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? undefined;
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: ctx.user.id,
        ...(status ? { status: status as "SCHEDULED" } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        status: true,
        senderId: true,
        recipientCount: true,
        estimatedCost: true,
        scheduledAt: true,
        createdAt: true,
      },
    });

    return apiSuccess({
      data: campaigns.map((c) => ({
        ...c,
        estimated_cost: c.estimatedCost?.toNumber() ?? null,
      })),
    });
  },
  "/api/v1/campaigns",
  "campaigns.read",
);
