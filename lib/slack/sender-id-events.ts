import { prisma } from "@/lib/db";
import type { SenderIdProviderStatus, SenderIdProviderType } from "@/lib/generated/prisma/client";
import { loadSlackOfficeConfig } from "@/lib/slack/config";
import { isSlackConfigured } from "@/lib/slack/config-shared";
import { postSlackMessage } from "@/lib/slack/client";
import {
  slackSenderIdAdminActionBlocks,
  slackSenderIdProviderDecisionBlocks,
} from "@/lib/slack/blocks";

export type SenderIdAdminSlackAction = "approved" | "submitted" | "denied" | "blocked" | "sync";

async function slackReady() {
  const config = await loadSlackOfficeConfig();
  if (!isSlackConfigured(config) || !config.notifySenderIdRequests) return null;
  return config;
}

export async function notifySlackSenderIdAdminAction(input: {
  action: SenderIdAdminSlackAction;
  senderRecordId: string;
  value: string;
  memberName: string;
  memberPhone?: string;
  countryCode: string;
  actorName: string;
  actorId?: string;
  note?: string;
  outcome?: "approved" | "pending_carriers" | "submitted";
}) {
  const config = await slackReady();
  if (!config) return;

  const actionLabel = {
    approved: "Approved on SplitSMS",
    submitted: "Submitted to carriers",
    denied: "Denied on SplitSMS",
    blocked: "Blocked & banned",
    sync: "Synced carrier status",
  }[input.action];

  const emoji =
    input.action === "approved"
      ? ":white_check_mark:"
      : input.action === "submitted"
        ? ":satellite:"
        : input.action === "denied" || input.action === "blocked"
          ? ":x:"
          : ":arrows_counterclockwise:";

  await postSlackMessage(
    {
      text: `${emoji} ${actionLabel}: ${input.value} — by ${input.actorName}`,
      blocks: slackSenderIdAdminActionBlocks({ ...input, actionLabel }),
    },
    config,
  );
}

export async function notifySlackSenderIdProviderDecision(input: {
  senderRecordId: string;
  value: string;
  memberName: string;
  memberPhone?: string;
  countryCode: string;
  provider: SenderIdProviderType;
  previousStatus: SenderIdProviderStatus;
  newStatus: SenderIdProviderStatus;
  providerStatus?: string | null;
}) {
  if (input.previousStatus === input.newStatus) return;
  if (input.newStatus === "PENDING" || input.newStatus === "SKIPPED") return;

  const config = await slackReady();
  if (!config) return;

  const decision =
    input.newStatus === "APPROVED"
      ? "approved"
      : input.newStatus === "REJECTED"
        ? "denied"
        : "failed";

  const emoji =
    input.newStatus === "APPROVED"
      ? ":white_check_mark:"
      : input.newStatus === "REJECTED"
        ? ":x:"
        : ":warning:";

  await postSlackMessage(
    {
      text: `${emoji} ${input.provider} ${decision}: ${input.value} (${input.memberName})`,
      blocks: slackSenderIdProviderDecisionBlocks({ ...input, decision }),
    },
    config,
  );
}

export async function loadSenderIdSlackContext(senderRecordId: string) {
  return prisma.senderId.findUnique({
    where: { id: senderRecordId },
    select: {
      id: true,
      value: true,
      countryCode: true,
      user: { select: { fullName: true, phone: true } },
    },
  });
}
