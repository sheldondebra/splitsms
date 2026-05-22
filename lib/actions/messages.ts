"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { deductSmsCredits } from "@/lib/sms/billing";
import { getSmsSendQueue } from "@/lib/queue/sms-queue";
import { processMessageJob } from "@/lib/queue/process-message";
import { redirect } from "next/navigation";

export async function retryFailedMessagesAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const campaignId = String(formData.get("campaignId") ?? "") || undefined;

  const failed = await prisma.message.findMany({
    where: {
      userId: session.userId,
      status: "FAILED",
      ...(campaignId ? { campaignId } : {}),
    },
    take: 500,
  });

  const unitsNeeded = failed.reduce((s, m) => s + m.smsUnits, 0);
  const costNeeded = failed.reduce((s, m) => s + (m.cost?.toNumber() ?? 0), 0);
  const wallet = await prisma.wallet.findUnique({ where: { userId: session.userId } });

  try {
    await deductSmsCredits(
      session.userId,
      unitsNeeded,
      costNeeded,
      wallet?.currency ?? "GHS",
      `Retry ${failed.length} failed messages`,
    );
  } catch {
    redirect("/dashboard/reports?error=credits");
  }

  const queue = getSmsSendQueue();
  for (const msg of failed) {
    await prisma.message.update({
      where: { id: msg.id },
      data: { status: "PENDING", failureReason: null, failedAt: null },
    });
    const countryCode = msg.countryCode ?? "GH";
    if (queue) await queue.add("send", { messageId: msg.id, countryCode });
    else await processMessageJob(msg.id, countryCode);
  }

  redirect(
    campaignId
      ? `/dashboard/reports?campaign=${campaignId}&retried=${failed.length}`
      : `/dashboard/reports?retried=${failed.length}`,
  );
}
