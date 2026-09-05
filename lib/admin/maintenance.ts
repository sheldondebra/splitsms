import { prisma } from "@/lib/db";

const MAINTENANCE_CONFIG_KEY = "platform_maintenance";

export type MaintenanceConfig = {
  enabled: boolean;
  message: string;
  startedAt: string | null;
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
  "Maintenance is complete and SplitSMS is back online. Thank you for your patience — everything is working as normal.";

export function defaultMaintenanceConfig(): MaintenanceConfig {
  return {
    enabled: false,
    message: DEFAULT_START_MESSAGE,
    startedAt: null,
    startEmailSubject: "SplitSMS is undergoing scheduled maintenance",
    startEmailBody:
      "Hello,\n\nWe're currently performing scheduled maintenance on SplitSMS to improve reliability and add new features. During this time you won't be able to sign in or send messages.\n\nWe expect to be back online shortly and appreciate your patience.\n\nThank you for choosing SplitSMS.",
    startSmsBody:
      "SplitSMS: We're undergoing brief scheduled maintenance. Sign-in and sending are temporarily paused — we'll notify you once we're back. Thanks for your patience.",
    endEmailSubject: "SplitSMS is back online",
    endEmailBody:
      "Hello,\n\nMaintenance is complete and SplitSMS is back online. You can sign in and send messages as normal.\n\nThank you for your patience while we made these improvements.",
    endSmsBody: "SplitSMS: We're back online! Sign-in and sending are working normally again. Thanks for your patience.",
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

/** Cheap, cached-per-request check for gating member-facing pages. */
export async function isMaintenanceActive(): Promise<boolean> {
  const config = await loadMaintenanceConfig();
  return config.enabled;
}
