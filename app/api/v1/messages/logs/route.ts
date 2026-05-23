import { withApi } from "@/lib/api/with-api";
import { apiSuccess } from "@/lib/api/errors";
import { prisma } from "@/lib/db";

export const GET = withApi(
  async (request, ctx) => {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 100);
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const search = searchParams.get("q");

    const logs = await prisma.wordPressLog.findMany({
      where: {
        userId: ctx.user.id,
        ...(status ? { status } : {}),
        ...(source ? { source } : {}),
        ...(search
          ? {
              OR: [
                { recipient: { contains: search, mode: "insensitive" } },
                { externalRef: { contains: search, mode: "insensitive" } },
                { event: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { site: { select: { siteUrl: true, siteName: true } } },
    });

    return apiSuccess({
      logs: logs.map((l) => ({
        id: l.id,
        date: l.createdAt,
        event: l.event,
        recipient: l.recipient,
        message_type: l.messageType,
        status: l.status,
        source: l.source,
        cost: l.cost?.toNumber() ?? null,
        external_ref: l.externalRef,
        site_url: l.site?.siteUrl,
      })),
    });
  },
  "/api/v1/messages/logs",
  "sms.read",
);
