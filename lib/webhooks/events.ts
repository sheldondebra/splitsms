import { dispatchUserWebhooks } from "@/lib/webhooks/dispatch";
import type { MessageStatus } from "@/lib/generated/prisma/client";

export async function emitCampaignCompleted(
  userId: string,
  campaign: { id: string; name: string; recipientCount: number },
) {
  await dispatchUserWebhooks(userId, {
    id: campaign.id,
    recipient: "",
    status: "DELIVERED",
    campaignId: campaign.id,
  }, "campaign.completed");
}

export async function emitWalletLowBalance(userId: string, balance: number) {
  await dispatchUserWebhooks(userId, {
    id: `wallet_${userId}`,
    recipient: "",
    status: "PENDING",
  }, "wallet.low_balance", { balance });
}
