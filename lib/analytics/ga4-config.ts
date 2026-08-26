import { prisma } from "@/lib/db";

export const GA4_CONFIG_KEY = "ga4_config";

export type Ga4Config = {
  enabled: boolean;
  /** GA4 Measurement ID, e.g. G-XXXXXXXXXX — used by the client tracking snippet. */
  measurementId: string;
  /** GA4 numeric Property ID — used by the server-side Data API for reporting. */
  propertyId: string;
  updatedAt?: string;
};

function defaults(): Ga4Config {
  return { enabled: false, measurementId: "", propertyId: "" };
}

export async function loadGa4Config(): Promise<Ga4Config> {
  const row = await prisma.platformSetting.findUnique({ where: { key: GA4_CONFIG_KEY } });
  const stored = row?.value as Partial<Ga4Config> | null;
  const base = defaults();
  if (!stored) return base;
  return {
    enabled: Boolean(stored.enabled),
    measurementId: typeof stored.measurementId === "string" ? stored.measurementId.trim() : base.measurementId,
    propertyId: typeof stored.propertyId === "string" ? stored.propertyId.trim() : base.propertyId,
    updatedAt: stored.updatedAt,
  };
}

export async function saveGa4Config(input: Partial<Ga4Config>, actorId?: string) {
  const current = await loadGa4Config();
  const next: Ga4Config = {
    enabled: input.enabled ?? current.enabled,
    measurementId: input.measurementId !== undefined ? input.measurementId.trim() : current.measurementId,
    propertyId: input.propertyId !== undefined ? input.propertyId.trim() : current.propertyId,
    updatedAt: new Date().toISOString(),
  };

  await prisma.platformSetting.upsert({
    where: { key: GA4_CONFIG_KEY },
    update: { value: next },
    create: { key: GA4_CONFIG_KEY, value: next },
  });

  if (actorId) {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "GA4_CONFIG_UPDATED",
        entityType: "PlatformSetting",
        entityId: GA4_CONFIG_KEY,
        metadata: { enabled: next.enabled, propertyId: next.propertyId ? "set" : "empty" },
      },
    });
  }

  return next;
}

export function isGa4TrackingConfigured(config: Ga4Config) {
  return Boolean(config.enabled && /^G-[A-Z0-9]+$/i.test(config.measurementId));
}

export function isGa4ReportingConfigured(config: Ga4Config) {
  return Boolean(config.enabled && /^\d+$/.test(config.propertyId));
}

export function isGa4ServiceAccountConfigured() {
  return Boolean(
    process.env.GOOGLE_GA_SA_CLIENT_EMAIL?.trim() && process.env.GOOGLE_GA_SA_PRIVATE_KEY?.trim(),
  );
}
