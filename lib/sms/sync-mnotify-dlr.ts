import { prisma } from "@/lib/db";
import { fetchCampaignDeliveryReport } from "@/lib/mnotify";
import { dispatchUserWebhooks } from "@/lib/webhooks/dispatch";
import { refundSmsCredits } from "@/lib/sms/billing";

function mapMnotifyStatus(raw: string): "DELIVERED" | "FAILED" | "SENT" {
  const s = raw.toUpperCase();
  if (s.includes("DELIVER")) return "DELIVERED";
  if (s.includes("FAIL") || s.includes("REJECT") || s.includes("UNDELIVER")) {
    return "FAILED";
  }
  return "SENT";
}

function phoneVariants(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const variants = new Set<string>([phone, digits, `+${digits}`]);
  if (digits.startsWith("233")) variants.add(`+${digits}`);
  return [...variants];
}

/** Poll mNotify campaign report and update messages matched by campaign providerRef + recipient */
export async function syncMnotifyCampaignDelivery(campaignId: string) {
  const result = await fetchCampaignDeliveryReport(campaignId);
  if (!result.ok) return result;

  let updated = 0;
  for (const row of result.report) {
    if (!row.recipient) continue;
    const status = mapMnotifyStatus(row.status ?? "SENT");
    const variants = phoneVariants(row.recipient);

    const message = await prisma.message.findFirst({
      where: {
        providerRef: campaignId,
        recipient: { in: variants },
      },
      include: { user: { include: { wallet: true } } },
    });
    if (!message) continue;

    const updatedMsg = await prisma.message.update({
      where: { id: message.id },
      data: {
        status,
        ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        ...(status === "FAILED" ? { failedAt: new Date(), failureReason: row.status } : {}),
      },
    });

    if (status === "FAILED" && message.status !== "FAILED" && message.user.wallet) {
      try {
        await refundSmsCredits(
          message.userId,
          message.smsUnits,
          message.cost?.toNumber() ?? 0,
          message.user.wallet.currency,
          `DLR failed: ${message.recipient}`,
        );
      } catch {
        /* ignore */
      }
    }

    await dispatchUserWebhooks(message.userId, updatedMsg);
    updated++;
  }

  return { ok: true as const, updated, report: result.report };
}

/** Sync all recent mNotify SENT messages that have a campaign providerRef */
export async function syncPendingMnotifyDeliveries(limit = 50) {
  const pending = await prisma.message.findMany({
    where: {
      providerType: "MNOTIFY",
      status: { in: ["SENT", "PENDING"] },
      providerRef: { not: null },
    },
    orderBy: { sentAt: "desc" },
    take: limit,
  });

  const campaignIds = [...new Set(pending.map((m) => m.providerRef).filter(Boolean))] as string[];
  let totalUpdated = 0;

  for (const campaignId of campaignIds) {
    const r = await syncMnotifyCampaignDelivery(campaignId);
    if (r.ok) totalUpdated += r.updated;
  }

  return { campaigns: campaignIds.length, rowsUpdated: totalUpdated };
}
