import { prisma } from "@/lib/db";

export const GENERAL_OFFICE_CONFIG_KEY = "general_office_config";

export type GeneralOfficeConfig = {
  /** Extra emails for sender-ID and ops alerts (in addition to admin users when enabled). */
  notifyEmails: string[];
  /** Extra phones for SMS alerts (in addition to admin users when enabled). */
  notifyPhones: string[];
  /** Also notify users with ADMIN / SUPER_ADMIN roles. */
  notifyAdminUsers: boolean;
  updatedAt?: string;
};

const defaults = (): GeneralOfficeConfig => ({
  notifyEmails: [],
  notifyPhones: [],
  notifyAdminUsers: true,
});

export async function loadGeneralOfficeConfig(): Promise<GeneralOfficeConfig> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: GENERAL_OFFICE_CONFIG_KEY },
  });
  const stored = row?.value as Partial<GeneralOfficeConfig> | null;
  const base = defaults();
  if (!stored) return base;

  return {
    notifyEmails: Array.isArray(stored.notifyEmails)
      ? stored.notifyEmails.map((e) => String(e).trim().toLowerCase()).filter(Boolean)
      : base.notifyEmails,
    notifyPhones: Array.isArray(stored.notifyPhones)
      ? stored.notifyPhones.map((p) => String(p).trim()).filter(Boolean)
      : base.notifyPhones,
    notifyAdminUsers: stored.notifyAdminUsers ?? base.notifyAdminUsers,
    updatedAt: stored.updatedAt,
  };
}

export async function saveGeneralOfficeConfig(
  input: Partial<GeneralOfficeConfig>,
  actorId?: string,
) {
  const current = await loadGeneralOfficeConfig();
  const next: GeneralOfficeConfig = {
    notifyEmails: input.notifyEmails ?? current.notifyEmails,
    notifyPhones: input.notifyPhones ?? current.notifyPhones,
    notifyAdminUsers: input.notifyAdminUsers ?? current.notifyAdminUsers,
    updatedAt: new Date().toISOString(),
  };

  await prisma.platformSetting.upsert({
    where: { key: GENERAL_OFFICE_CONFIG_KEY },
    update: { value: next },
    create: { key: GENERAL_OFFICE_CONFIG_KEY, value: next },
  });

  if (actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "GENERAL_OFFICE_CONFIG_UPDATED",
        entityType: "PlatformSetting",
        entityId: GENERAL_OFFICE_CONFIG_KEY,
        metadata: {
          notifyEmailCount: next.notifyEmails.length,
          notifyPhoneCount: next.notifyPhones.length,
          notifyAdminUsers: next.notifyAdminUsers,
        },
      },
    });
  }

  return next;
}

export function parseNotifyEmails(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

export function parseNotifyPhones(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((p) => p.trim())
    .filter(Boolean);
}
