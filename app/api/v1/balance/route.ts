import { withApi } from "@/lib/api/with-api";
import { apiSuccess } from "@/lib/api/errors";

export const GET = withApi(
  async (_request, ctx) => {
    return apiSuccess({
      wallet: {
        balance: ctx.user.wallet?.balance.toNumber() ?? 0,
        currency: ctx.user.wallet?.currency ?? "GHS",
      },
      sms_credits: ctx.user.smsCredit?.balance ?? 0,
      sandbox: ctx.isSandbox,
    });
  },
  "/api/v1/balance",
  "wallet.read",
);
