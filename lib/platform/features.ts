import { prisma } from "@/lib/db";
import {
  PLATFORM_FEATURES_KEY,
  isFeatureEnabledIn,
  parsePlatformFeatureFlags,
  type PlatformFeatureFlags,
  type PlatformFeatureId,
} from "@/lib/platform/feature-catalog";

export * from "@/lib/platform/feature-catalog";

export async function loadPlatformFeatureFlags(): Promise<PlatformFeatureFlags> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: PLATFORM_FEATURES_KEY },
  });
  return parsePlatformFeatureFlags(row?.value);
}

export async function savePlatformFeatureFlags(flags: PlatformFeatureFlags) {
  await prisma.platformSetting.upsert({
    where: { key: PLATFORM_FEATURES_KEY },
    update: { value: flags },
    create: { key: PLATFORM_FEATURES_KEY, value: flags },
  });
}

export async function isFeatureEnabled(id: PlatformFeatureId): Promise<boolean> {
  const flags = await loadPlatformFeatureFlags();
  return isFeatureEnabledIn(flags, id);
}
