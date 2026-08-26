import { prisma } from "@/lib/db";
import { EMAIL_MARKETING_SYSTEM_TEMPLATES } from "@/lib/admin/email-marketing-shared";
import {
  ensureEmailMarketingImageTable,
  getMarketingImageMap,
  setMarketingImage,
} from "@/lib/admin/email-marketing-images";

/** Upsert system templates so admins always have a starter library. */
export async function ensureEmailMarketingTemplates() {
  await ensureEmailMarketingImageTable();

  for (const seed of EMAIL_MARKETING_SYSTEM_TEMPLATES) {
    const row = await prisma.emailMarketingTemplate.upsert({
      where: { slug: seed.slug },
      create: {
        slug: seed.slug,
        name: seed.name,
        description: seed.description,
        category: seed.category,
        subject: seed.subject,
        preheader: seed.preheader,
        headline: seed.headline,
        bodyText: seed.bodyText,
        ctaLabel: seed.ctaLabel,
        ctaHref: seed.ctaHref,
        footerNote: seed.footerNote,
        isSystem: true,
      },
      update: {
        // Keep system copy in sync for name/description/category only —
        // body fields stay editable by admins after first seed.
        name: seed.name,
        description: seed.description,
        category: seed.category,
        isSystem: true,
      },
      select: { id: true },
    });

    if (seed.imageUrl) {
      const existing = await getMarketingImageMap("template", [row.id]);
      if (!existing.get(row.id)) {
        await setMarketingImage("template", row.id, seed.imageUrl);
      }
    }
  }
}
