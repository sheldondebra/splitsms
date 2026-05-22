import { withApi } from "@/lib/api/with-api";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { prisma } from "@/lib/db";

function messageIdFromUrl(request: Request) {
  const parts = new URL(request.url).pathname.split("/");
  return parts[parts.length - 1] ?? "";
}

export const GET = withApi(
  async (request, ctx) => {
    const id = messageIdFromUrl(request);
    const message = await prisma.message.findFirst({
      where: { id, userId: ctx.user.id },
    });
    if (!message) return apiError("NOT_FOUND", "Message not found", 404);

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
    });
  },
  "/api/v1/messages/:id",
  "sms.read",
);
