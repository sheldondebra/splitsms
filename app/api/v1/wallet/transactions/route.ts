import { withApi } from "@/lib/api/with-api";
import { apiSuccess } from "@/lib/api/errors";
import { prisma } from "@/lib/db";

export const GET = withApi(
  async (request, ctx) => {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

    const transactions = await prisma.transaction.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        amount: true,
        currency: true,
        credits: true,
        description: true,
        createdAt: true,
      },
    });

    return apiSuccess({
      data: transactions.map((t) => ({
        ...t,
        amount: t.amount.toNumber(),
      })),
    });
  },
  "/api/v1/wallet/transactions",
  "wallet.read",
);
