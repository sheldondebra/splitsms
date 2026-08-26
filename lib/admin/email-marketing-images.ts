import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { EMAIL_MARKETING_SYSTEM_TEMPLATES } from "@/lib/admin/email-marketing-shared";

export type MarketingImageKind = "template" | "campaign" | "blob";

let imageTableReady: Promise<boolean> | null = null;

/** Creates the sidecar table if missing. Safe to call on every marketing page load. */
export async function ensureEmailMarketingImageTable() {
  if (!imageTableReady) {
    imageTableReady = (async () => {
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "EmailMarketingImage" (
            "id" TEXT NOT NULL,
            "kind" TEXT NOT NULL,
            "targetId" TEXT NOT NULL,
            "imageUrl" TEXT NOT NULL,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "EmailMarketingImage_pkey" PRIMARY KEY ("id")
          )
        `);
        await prisma.$executeRawUnsafe(`
          CREATE UNIQUE INDEX IF NOT EXISTS "EmailMarketingImage_kind_targetId_key"
          ON "EmailMarketingImage"("kind", "targetId")
        `);
        return true;
      } catch (error) {
        console.error("[email-marketing] could not ensure EmailMarketingImage table", error);
        return false;
      }
    })();
  }
  return imageTableReady;
}

export function seedImageForSlug(slug: string): string | null {
  return EMAIL_MARKETING_SYSTEM_TEMPLATES.find((s) => s.slug === slug)?.imageUrl ?? null;
}

export async function setMarketingImage(
  kind: MarketingImageKind,
  targetId: string,
  imageUrl: string | null,
) {
  const ready = await ensureEmailMarketingImageTable();
  if (!ready) return;
  const trimmed = imageUrl?.trim() || null;
  if (!trimmed) {
    await prisma.$executeRaw`
      DELETE FROM "EmailMarketingImage" WHERE "kind" = ${kind} AND "targetId" = ${targetId}
    `;
    return;
  }
  await prisma.$executeRaw`
    INSERT INTO "EmailMarketingImage" ("id", "kind", "targetId", "imageUrl", "updatedAt")
    VALUES (${crypto.randomUUID()}, ${kind}, ${targetId}, ${trimmed}, ${new Date()})
    ON CONFLICT ("kind", "targetId")
    DO UPDATE SET "imageUrl" = EXCLUDED."imageUrl", "updatedAt" = EXCLUDED."updatedAt"
  `;
}

export async function getMarketingImageMap(kind: MarketingImageKind, targetIds: string[]) {
  const map = new Map<string, string>();
  if (targetIds.length === 0) return map;
  const ready = await ensureEmailMarketingImageTable();
  if (!ready) return map;
  const rows = await prisma.$queryRaw<Array<{ targetId: string; imageUrl: string }>>`
    SELECT "targetId", "imageUrl" FROM "EmailMarketingImage"
    WHERE "kind" = ${kind}
      AND "targetId" IN (${Prisma.join(targetIds)})
  `;
  for (const row of rows) map.set(row.targetId, row.imageUrl);
  return map;
}

export async function getMarketingImage(kind: MarketingImageKind, targetId: string) {
  const map = await getMarketingImageMap(kind, [targetId]);
  return map.get(targetId) ?? null;
}

export async function attachTemplateImages<T extends { id: string; slug: string }>(
  templates: T[],
): Promise<(T & { imageUrl: string | null })[]> {
  const stored = await getMarketingImageMap(
    "template",
    templates.map((t) => t.id),
  );
  return templates.map((t) => ({
    ...t,
    imageUrl: stored.get(t.id) ?? seedImageForSlug(t.slug) ?? null,
  }));
}

export async function attachCampaignImages<T extends { id: string }>(
  campaigns: T[],
): Promise<(T & { imageUrl: string | null })[]> {
  const stored = await getMarketingImageMap(
    "campaign",
    campaigns.map((c) => c.id),
  );
  return campaigns.map((c) => ({
    ...c,
    imageUrl: stored.get(c.id) ?? null,
  }));
}
