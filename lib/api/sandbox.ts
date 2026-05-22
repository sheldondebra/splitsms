import { prisma } from "@/lib/db";
import { dispatchUserWebhooks } from "@/lib/webhooks/dispatch";

/** Sandbox API sends: no provider call, no credit deduction, simulated delivery */
export async function processSandboxMessage(messageId: string) {
  const sent = await prisma.message.update({
    where: { id: messageId },
    data: {
      status: "SENT",
      providerType: "MNOTIFY",
      providerRef: `sandbox_${messageId}`,
      sentAt: new Date(),
    },
  });

  await dispatchUserWebhooks(sent.userId, sent);

  const delivered = await prisma.message.update({
    where: { id: messageId },
    data: { status: "DELIVERED", deliveredAt: new Date() },
  });

  await dispatchUserWebhooks(delivered.userId, delivered);
  return delivered;
}
