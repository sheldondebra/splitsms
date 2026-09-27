import { prisma } from "@/lib/db";

const MAINTENANCE_CONFIG_KEY = "platform_maintenance";

export type MaintenanceConfig = {
  enabled: boolean;
  message: string;
  startedAt: string | null;
  /** When set and reached, maintenance auto-clears the next time anyone checks status. */
  scheduledEndAt: string | null;
  startEmailSubject: string;
  startEmailBody: string;
  startSmsBody: string;
  endEmailSubject: string;
  endEmailBody: string;
  endSmsBody: string;
};

const DEFAULT_START_MESSAGE =
  "We're currently performing scheduled maintenance to improve SplitSMS. Access will be temporarily unavailable — thank you for your patience.";

const DEFAULT_END_MESSAGE =
  "We're sorry for the temporary interruption. SplitSMS is fully back online and working normally again. Thank you for your patience.";

export function defaultMaintenanceConfig(): MaintenanceConfig {
  return {
    enabled: false,
    message: DEFAULT_START_MESSAGE,
    startedAt: null,
    scheduledEndAt: null,
    startEmailSubject: "SplitSMS is undergoing scheduled maintenance",
    startEmailBody:
      "Hello,\n\nWe're currently performing scheduled maintenance on SplitSMS to improve reliability and add new features. During this time you won't be able to sign in or send messages.\n\nWe expect to be back online shortly and appreciate your patience.\n\nThank you for choosing SplitSMS.",
    startSmsBody:
      "SplitSMS: We're undergoing brief scheduled maintenance. Sign-in and sending are temporarily paused — we'll notify you once we're back. Thanks for your patience.",
    endEmailSubject: "We're back online — thank you for your patience",
    endEmailBody:
      "Hello,\n\nWe're sorry for the temporary interruption earlier. SplitSMS is fully back online and working normally again.\n\nYou can sign in and continue as usual.\n\nThank you for your patience and for choosing SplitSMS.",
    endSmsBody:
      "Hi, apologies for the temporary interruption on SplitSMS. Everything is back up and running. Thank you for your patience.",
  };
}

export async function loadMaintenanceConfig(): Promise<MaintenanceConfig> {
  const row = await prisma.platformSetting.findUnique({ where: { key: MAINTENANCE_CONFIG_KEY } });
  const defaults = defaultMaintenanceConfig();
  if (!row?.value || typeof row.value !== "object") return defaults;
  return { ...defaults, ...(row.value as Partial<MaintenanceConfig>) };
}

export async function saveMaintenanceConfig(config: MaintenanceConfig) {
  await prisma.platformSetting.upsert({
    where: { key: MAINTENANCE_CONFIG_KEY },
    update: { value: config },
    create: { key: MAINTENANCE_CONFIG_KEY, value: config },
  });
}

export type MaintenanceStatus = {
  active: boolean;
  startedAt: string | null;
  scheduledEndAt: string | null;
};

/**
 * Per-request status check, safe to call from any admin surface or the
 * member-gate. Self-heals a scheduled auto-off: if the scheduled end time has
 * passed, this clears `enabled` right here — there's no persistent worker to
 * run a timer against, so every status check doubles as the tick that
 * expires it.
 */
export async function getMaintenanceStatus(): Promise<MaintenanceStatus> {
  const config = await loadMaintenanceConfig();
  if (!config.enabled) return { active: false, startedAt: null, scheduledEndAt: null };

  if (config.scheduledEndAt && new Date(config.scheduledEndAt).getTime() <= Date.now()) {
    await saveMaintenanceConfig({ ...config, enabled: false, scheduledEndAt: null });
    return { active: false, startedAt: null, scheduledEndAt: null };
  }

  return { active: true, startedAt: config.startedAt, scheduledEndAt: config.scheduledEndAt };
}

/** Cheap boolean check for gating member-facing pages. */
export async function isMaintenanceActive(): Promise<boolean> {
  const status = await getMaintenanceStatus();
  return status.active;
}
