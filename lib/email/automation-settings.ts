import { prisma } from "@/lib/db";

export const EMAIL_AUTOMATION_KEY = "email_automation_config";

export type EmailAutomationSettings = {
  /** Welcome + login steps after signup. */
  welcomeOnSignup: boolean;
  /** Two failed password attempts. */
  failedLoginHelp: boolean;
  /** Password-reset OTP. Always recommended on. */
  resetPasswordOtp: boolean;
  /** Members who have not signed in for inactiveDays. */
  inactiveMembers: boolean;
  inactiveDays: number;
  /** Low wallet / not enough credits to send SMS. */
  lowBalanceTopup: boolean;
  updatedAt?: string;
};

const defaults = (): EmailAutomationSettings => ({
  welcomeOnSignup: true,
  failedLoginHelp: true,
  resetPasswordOtp: true,
  inactiveMembers: false,
  inactiveDays: 30,
  lowBalanceTopup: true,
});

export async function loadEmailAutomationSettings(): Promise<EmailAutomationSettings> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: EMAIL_AUTOMATION_KEY },
  });
  const stored = row?.value as Partial<EmailAutomationSettings> | null;
  const base = defaults();
  if (!stored) return base;
  const days = Number(stored.inactiveDays);
  return {
    welcomeOnSignup: stored.welcomeOnSignup ?? base.welcomeOnSignup,
    failedLoginHelp: stored.failedLoginHelp ?? base.failedLoginHelp,
    resetPasswordOtp: stored.resetPasswordOtp ?? base.resetPasswordOtp,
    inactiveMembers: stored.inactiveMembers ?? base.inactiveMembers,
    inactiveDays: Number.isFinite(days) && days >= 7 ? Math.min(365, Math.round(days)) : base.inactiveDays,
    lowBalanceTopup: stored.lowBalanceTopup ?? base.lowBalanceTopup,
    updatedAt: stored.updatedAt,
  };
}

export async function saveEmailAutomationSettings(
  input: Partial<EmailAutomationSettings>,
  actorId?: string,
) {
  const current = await loadEmailAutomationSettings();
  const next: EmailAutomationSettings = {
    ...current,
    ...input,
    inactiveDays:
      input.inactiveDays != null
        ? Math.min(365, Math.max(7, Math.round(Number(input.inactiveDays) || 30)))
        : current.inactiveDays,
    updatedAt: new Date().toISOString(),
  };

  await prisma.platformSetting.upsert({
    where: { key: EMAIL_AUTOMATION_KEY },
    update: { value: next },
    create: { key: EMAIL_AUTOMATION_KEY, value: next },
  });

  if (actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "EMAIL_AUTOMATION_UPDATED",
        entityType: "PlatformSetting",
        entityId: EMAIL_AUTOMATION_KEY,
        metadata: {
          welcomeOnSignup: next.welcomeOnSignup,
          failedLoginHelp: next.failedLoginHelp,
          inactiveMembers: next.inactiveMembers,
          lowBalanceTopup: next.lowBalanceTopup,
        },
      },
    });
  }

  return next;
}
