import { loadSlackOfficeConfig } from "@/lib/slack/config";
import { isSlackConfigured } from "@/lib/slack/config-shared";
import { postSlackMessage } from "@/lib/slack/client";
import {
  slackAuthFailureBlocks,
  slackOfflinePaymentBlocks,
  slackOnlinePaymentBlocks,
  slackSenderIdRequestBlocks,
  slackUserLoginBlocks,
  slackUserRegistrationBlocks,
} from "@/lib/slack/blocks";

async function shouldNotify(check: (config: Awaited<ReturnType<typeof loadSlackOfficeConfig>>) => boolean) {
  const config = await loadSlackOfficeConfig();
  if (!isSlackConfigured(config)) return null;
  if (!check(config)) return null;
  return config;
}

export async function notifySlackUserRegistration(input: {
  userId: string;
  fullName: string;
  phone: string;
  email?: string | null;
}) {
  const config = await shouldNotify((c) => c.notifyUserRegistration);
  if (!config) return;

  await postSlackMessage(
    {
      text: `New member registered: ${input.fullName}`,
      blocks: slackUserRegistrationBlocks(input),
    },
    config,
  );
}

export async function notifySlackUserLogin(input: {
  userId: string;
  fullName: string;
  phone: string;
}) {
  const config = await shouldNotify((c) => c.notifyUserLogin);
  if (!config) return;

  await postSlackMessage(
    {
      text: `Member login: ${input.fullName}`,
      blocks: slackUserLoginBlocks(input),
    },
    config,
  );
}

export async function notifySlackAuthFailure(input: { identifier: string }) {
  const config = await shouldNotify((c) => c.notifyAuthFailures);
  if (!config) return;

  await postSlackMessage(
    {
      text: `Failed login: ${input.identifier}`,
      blocks: slackAuthFailureBlocks(input),
    },
    config,
  );
}

export async function notifySlackNewSenderId(senderRecordId: string) {
  const config = await shouldNotify((c) => c.notifySenderIdRequests);
  if (!config) return;

  const { prisma } = await import("@/lib/db");
  const sender = await prisma.senderId.findUnique({
    where: { id: senderRecordId },
    include: { user: { select: { fullName: true, phone: true, email: true } } },
  });
  if (!sender) return;

  await postSlackMessage(
    {
      text: `New sender ID request: ${sender.value} from ${sender.user.fullName}`,
      blocks: slackSenderIdRequestBlocks({
        senderId: sender.id,
        value: sender.value,
        countryCode: sender.countryCode,
        memberName: sender.user.fullName,
        memberPhone: sender.user.phone,
        memberEmail: sender.user.email,
      }),
    },
    config,
  );
}

export async function notifySlackOfflinePayment(paymentId: string) {
  const config = await shouldNotify((c) => c.notifyOfflinePayments);
  if (!config) return;

  const { prisma } = await import("@/lib/db");
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: { select: { fullName: true, phone: true } } },
  });
  if (!payment || payment.method !== "MANUAL" || payment.status !== "PENDING") return;

  const meta = (payment.metadata ?? {}) as Record<string, unknown>;

  await postSlackMessage(
    {
      text: `Offline top-up pending: ${payment.user.fullName} · ${payment.currency} ${payment.amount.toString()}`,
      blocks: slackOfflinePaymentBlocks({
        paymentId: payment.id,
        memberName: payment.user.fullName,
        memberPhone: payment.user.phone,
        amount: payment.amount.toString(),
        currency: payment.currency,
        reference: typeof meta.reference === "string" ? meta.reference : null,
        note: typeof meta.note === "string" ? meta.note : null,
      }),
    },
    config,
  );
}

export async function notifySlackOnlinePayment(paymentId: string) {
  const config = await shouldNotify((c) => c.notifyOnlinePayments);
  if (!config) return;

  const { prisma } = await import("@/lib/db");
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { user: { select: { fullName: true } } },
  });
  if (!payment || payment.method === "MANUAL" || payment.status !== "COMPLETED") return;

  await postSlackMessage(
    {
      text: `Payment received: ${payment.user.fullName} · ${payment.currency} ${payment.amount.toString()}`,
      blocks: slackOnlinePaymentBlocks({
        paymentId: payment.id,
        memberName: payment.user.fullName,
        amount: payment.amount.toString(),
        currency: payment.currency,
        method: payment.method,
      }),
    },
    config,
  );
}

export async function notifySlackSupportTicket(ticketId: string) {
  const { notifySlackSupportTicketWithFallback } = await import("@/lib/slack/support-threads");
  await notifySlackSupportTicketWithFallback(ticketId);
}
