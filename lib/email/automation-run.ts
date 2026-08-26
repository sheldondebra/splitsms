import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { loadEmailAutomationSettings } from "@/lib/email/automation-settings";
import {
  failedSignInHelpEmailContent,
  inactiveMemberNudgeEmailContent,
} from "@/lib/email/templates";

const STATE_KEY = "email_automation_state";

type AutomationState = {
  inactiveSentAt: Record<string, string>;
};

async function loadState(): Promise<AutomationState> {
  const row = await prisma.platformSetting.findUnique({ where: { key: STATE_KEY } });
  const stored = row?.value as Partial<AutomationState> | null;
  return {
    inactiveSentAt:
      stored?.inactiveSentAt && typeof stored.inactiveSentAt === "object"
        ? stored.inactiveSentAt
        : {},
  };
}

async function saveState(state: AutomationState) {
  await prisma.platformSetting.upsert({
    where: { key: STATE_KEY },
    update: { value: state },
    create: { key: STATE_KEY, value: state },
  });
}

export async function maybeSendFailedLoginHelpEmail(user: {
  fullName: string;
  email?: string | null;
  failedLoginCount: number;
}) {
  if (user.failedLoginCount !== 2) return;
  const email = user.email?.trim().toLowerCase();
  if (!email) return;
  const settings = await loadEmailAutomationSettings();
  if (!settings.failedLoginHelp) return;

  const { subject, text, html } = await failedSignInHelpEmailContent({
    memberName: user.fullName,
    email,
  });
  await sendEmail({ to: email, toName: user.fullName, subject, text, html }).catch(
    () => undefined,
  );
}

export async function runInactiveMemberEmails(limit = 80) {
  const settings = await loadEmailAutomationSettings();
  if (!settings.inactiveMembers) {
    return { scanned: 0, sent: 0 };
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - settings.inactiveDays);
  const cooldown = new Date();
  cooldown.setDate(cooldown.getDate() - 14);
  const state = await loadState();

  const members = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      email: { not: null },
      isVerified: true,
      createdAt: { lt: cutoff },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      createdAt: true,
      sessions: { orderBy: { lastActiveAt: "desc" }, take: 1, select: { lastActiveAt: true } },
    },
    take: 400,
  });

  let sent = 0;
  const nextSent = { ...state.inactiveSentAt };

  for (const member of members) {
    if (sent >= limit) break;
    const email = member.email?.trim().toLowerCase();
    if (!email) continue;
    const lastActive = member.sessions[0]?.lastActiveAt ?? member.createdAt;
    if (lastActive > cutoff) continue;
    const lastSent = nextSent[member.id];
    if (lastSent && new Date(lastSent) > cooldown) continue;

    const { subject, text, html } = await inactiveMemberNudgeEmailContent({
      memberName: member.fullName,
    });
    const result = await sendEmail({
      to: email,
      toName: member.fullName,
      subject,
      text,
      html,
    }).catch(() => ({ ok: false as const }));
    if (result && "ok" in result && result.ok) {
      nextSent[member.id] = new Date().toISOString();
      sent += 1;
    }
  }

  await saveState({ inactiveSentAt: nextSent });
  return { scanned: members.length, sent };
}
