import { withApi } from "@/lib/api/with-api";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { prisma } from "@/lib/db";
import { fetchCampaignDeliveryReport } from "@/lib/mnotify";
import { syncMnotifyCampaignDelivery } from "@/lib/sms/sync-mnotify-dlr";
import { z } from "zod";

const querySchema = z.object({
  messageId: z.string().optional(),
  providerRef: z.string().optional(),
  sync: z.enum(["true", "false"]).optional(),
});

export const GET = withApi(
  async (request, ctx) => {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      messageId: url.searchParams.get("messageId") ?? undefined,
      providerRef: url.searchParams.get("providerRef") ?? undefined,
      sync: url.searchParams.get("sync") ?? undefined,
    });

    if (!parsed.success || (!parsed.data.messageId && !parsed.data.providerRef)) {
      return apiError("INVALID_REQUEST", "Provide messageId or providerRef", 400);
    }

    const message = parsed.data.messageId
      ? await prisma.message.findFirst({
          where: { id: parsed.data.messageId, userId: ctx.user.id },
        })
      : await prisma.message.findFirst({
          where: { providerRef: parsed.data.providerRef, userId: ctx.user.id },
          orderBy: { createdAt: "desc" },
        });

    if (!message) {
      return apiError("NOT_FOUND", "Message not found", 404);
    }

    if (
      parsed.data.sync === "true" &&
      message.providerType === "MNOTIFY" &&
      message.providerRef
    ) {
      await syncMnotifyCampaignDelivery(message.providerRef);
      const refreshed = await prisma.message.findUnique({ where: { id: message.id } });
      if (refreshed) {
        return apiSuccess({
          data: {
            id: refreshed.id,
            status: refreshed.status,
            recipient: refreshed.recipient,
            providerRef: refreshed.providerRef,
            sentAt: refreshed.sentAt,
            deliveredAt: refreshed.deliveredAt,
            failureReason: refreshed.failureReason,
          },
          synced: true,
        });
      }
    }

    let providerReport = null;
    if (message.providerType === "MNOTIFY" && message.providerRef) {
      const campaign = await fetchCampaignDeliveryReport(message.providerRef);
      if (campaign.ok) providerReport = campaign.report;
      else providerReport = { error: campaign.error };
    }

    return apiSuccess({
      data: {
        id: message.id,
        status: message.status,
        recipient: message.recipient,
        providerType: message.providerType,
        providerRef: message.providerRef,
        sentAt: message.sentAt,
        deliveredAt: message.deliveredAt,
        failureReason: message.failureReason,
      },
      provider_report: providerReport,
    });
  },
  "/api/sms/status",
  "sms.read",
);
