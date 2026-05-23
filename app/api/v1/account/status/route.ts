import { withApi } from "@/lib/api/with-api";
import { apiSuccess } from "@/lib/api/errors";
import { prisma } from "@/lib/db";

export const GET = withApi(
  async (_request, ctx) => {
    const [apiKey, walletBalance, smsCredits] = [
      await prisma.apiKey.findUnique({
        where: { id: ctx.apiKeyId },
        select: { keyPrefix: true },
      }),
      ctx.user.wallet?.balance.toNumber() ?? 0,
      ctx.user.smsCredit?.balance ?? 0,
    ] as const;

    const currency = ctx.user.wallet?.currency ?? "GHS";
    const lowBalance = smsCredits < 50 && walletBalance < 10;

    return apiSuccess({
      account: {
        status: ctx.isSandbox ? "sandbox" : "active",
        sms_credits: smsCredits,
        wallet_balance: walletBalance,
        wallet_currency: currency,
        api_key_prefix: apiKey?.keyPrefix ?? null,
        low_balance: lowBalance,
        sandbox: ctx.isSandbox,
      },
    });
  },
  "/api/v1/account/status",
  "wallet.read",
);
