import { withApi } from "@/lib/api/with-api";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { prisma } from "@/lib/db";
import { resolveConnectCustomerUserId } from "@/lib/connect/provision";

function senderIdFromUrl(request: Request) {
  const parts = new URL(request.url).pathname.split("/");
  return parts[parts.length - 1] ?? "";
}

export const GET = withApi(
  async (request, ctx) => {
    const id = senderIdFromUrl(request);
    const customerId = new URL(request.url).searchParams.get("customer_id");

    const resolved = await resolveConnectCustomerUserId(ctx.user.id, customerId);
    if ("error" in resolved) return apiError("INVALID_REQUEST", resolved.error, 400);

    const sender = await prisma.senderId.findFirst({
      where: { id, userId: resolved.userId },
    });

    if (!sender) return apiError("NOT_FOUND", "Sender ID not found", 404);

    return apiSuccess({
      data: {
        id: sender.id,
        value: sender.value,
        country_code: sender.countryCode,
        status: sender.status,
        is_default: sender.isDefault,
      },
    });
  },
  "/api/v1/sender-ids/:id",
  "sender_ids.read",
);
