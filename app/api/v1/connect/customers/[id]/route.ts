import { withApi } from "@/lib/api/with-api";
import { apiError, apiSuccess } from "@/lib/api/errors";
import { prisma } from "@/lib/db";
import { serializeConnectCustomer } from "@/lib/connect/provision";

function customerIdFromUrl(request: Request) {
  const parts = new URL(request.url).pathname.split("/");
  return parts[parts.length - 1] ?? "";
}

export const GET = withApi(
  async (request, ctx) => {
    const id = customerIdFromUrl(request);

    const link = await prisma.connectCustomer.findFirst({
      where: {
        partnerUserId: ctx.user.id,
        OR: [{ id }, { customerUserId: id }, { externalRef: id }],
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            countryCode: true,
            createdAt: true,
            wallet: true,
            smsCredit: true,
          },
        },
      },
    });

    if (!link) return apiError("NOT_FOUND", "Connect customer not found", 404);

    return apiSuccess({
      data: serializeConnectCustomer(link, link.customer.wallet, link.customer.smsCredit),
    });
  },
  "/api/v1/connect/customers/:id",
  "connect.customers",
);
