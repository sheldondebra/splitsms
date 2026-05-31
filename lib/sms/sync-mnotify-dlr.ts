import { prisma } from "@/lib/db";
import {
  fetchCampaignDeliveryReport,
  normalizeMnotifyPhone,
} from "@/lib/mnotify";
import { dispatchUserWebhooks } from "@/lib/webhooks/dispatch";
import { refundSmsCredits } from "@/lib/sms/billing";

function mapMnotifyStatus(raw: string): "DELIVERED" | "FAILED" | "SENT" {
  const s = raw.toUpperCase().trim();
  if (!s) return "SENT";
  if (
    s.includes("DELIVER") ||
    s === "SUCCESS" ||
    s === "SUCCESSFUL" ||
    s.includes("READ")
  ) {
    return "DELIVERED";
  }
  if (
    s.includes("FAIL") ||
    s.includes("REJECT") ||
    s.includes("UNDELIVER") ||
    s.includes("EXPIRED")
  ) {
    return "FAILED";
  }
  return "SENT";
}

function phoneVariants(phone: string) {
  const digits = normalizeMnotifyPhone(phone.replace(/^\+/, ""));
  const variants = new Set<string>([
    phone,
    digits,
    `+${digits}`,
    normalizeMnotifyPhone(phone),
  ]);
  if (digits.startsWith("233")) {
    variants.add(`+${digits}`);
    variants.add(`0${digits.slice(3)}`);
  }
  return [...variants];
}

async function applyDeliveryUpdate(
  message: {
    id: string;
    userId: string;
    status: string;
    recipient: string;
    smsUnits: number;
    cost: { toNumber: () => number } | null;
    user: { wallet: { currency: string } | null };
  },
  status: "DELIVERED" | "FAILED" | "SENT",
  failureReason?: string,
) {
  const updatedMsg = await prisma.message.update({
    where: { id: message.id },
    data: {
      status,
      ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
      ...(status === "FAILED"
        ? { failedAt: new Date(), failureReason: failureReason ?? "Delivery failed" }
        : {}),
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
  return updatedMsg;
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

    await applyDeliveryUpdate(message, status, row.status);
    updated++;
  }

  return { ok: true as const, updated, report: result.report };
}

/** Best-effort sync after send — mNotify reports can lag a few seconds. */
export async function syncMnotifyDeliveryAfterSend(providerRef: string) {
  const delays = [0, 2500, 6000];
  let totalUpdated = 0;

  for (const delay of delays) {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    const result = await syncMnotifyCampaignDelivery(providerRef);
    if (result.ok) {
      totalUpdated += result.updated;
      if (result.updated > 0) break;
    }
  }

  return totalUpdated;
}

/** Sync recent in-transit messages for one account (dashboard / reports). */
export async function syncUserPendingMnotifyDeliveries(userId: string, limit = 30) {
  const pending = await prisma.message.findMany({
    where: {
      userId,
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
