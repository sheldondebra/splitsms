import { withApi } from "@/lib/api/with-api";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { prisma } from "@/lib/db";
import { syncMnotifyCampaignDelivery } from "@/lib/sms/sync-mnotify-dlr";

function messageIdFromUrl(request: Request) {
  const parts = new URL(request.url).pathname.split("/");
  return parts[parts.length - 1] ?? "";
}

export const GET = withApi(
  async (request, ctx) => {
    const id = messageIdFromUrl(request);
    const sync = new URL(request.url).searchParams.get("sync") === "true";

    let message = await prisma.message.findFirst({
      where: { id, userId: ctx.user.id },
    });
    if (!message) return apiError("NOT_FOUND", "Message not found", 404);

    if (
      sync &&
      message.providerType === "MNOTIFY" &&
      message.providerRef &&
      (message.status === "SENT" || message.status === "PENDING")
    ) {
      await syncMnotifyCampaignDelivery(message.providerRef);
      message =
        (await prisma.message.findFirst({
          where: { id, userId: ctx.user.id },
        })) ?? message;
    }

    return apiSuccess({
      data: {
        id: message.id,
        recipient: message.recipient,
        status: message.status,
        body: message.body,
        campaign_id: message.campaignId,
        provider_ref: message.providerRef,
        sent_at: message.sentAt,
        delivered_at: message.deliveredAt,
        failed_at: message.failedAt,
        failure_reason: message.failureReason,
        sandbox: message.isSandbox,
      },
      synced: sync,
    });
  },
  "/api/v1/messages/:id",
  "sms.read",
);
