"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { SAMPLE_SMS_TEMPLATES } from "@/lib/sms/template-samples";
import { seedSampleTemplatesForUser } from "@/lib/sms/seed-templates";

export { seedSampleTemplatesForUser };

async function requireUserId() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

function revalidateTemplatePaths() {
  revalidatePath("/dashboard/templates");
  revalidatePath("/dashboard/send");
  revalidatePath("/dashboard/campaigns/new");
}

export async function createTemplateAction(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!name || !content) return { ok: false as const, error: "invalid" };

  const tpl = await prisma.smsTemplate.create({
    data: { userId, name, content },
  });
  revalidateTemplatePaths();
  return { ok: true as const, id: tpl.id };
}

export async function updateTemplateAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!id || !name || !content) return { ok: false as const, error: "invalid" };

  const updated = await prisma.smsTemplate.updateMany({
    where: { id, userId },
    data: { name, content },
  });
  if (updated.count === 0) return { ok: false as const, error: "not_found" };
  revalidateTemplatePaths();
  return { ok: true as const };
}

export async function deleteTemplateAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id"));
  await prisma.smsTemplate.deleteMany({ where: { id, userId } });
  revalidateTemplatePaths();
  return { ok: true as const };
}

export async function toggleTemplateFavoriteAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id"));
  const tpl = await prisma.smsTemplate.findFirst({ where: { id, userId } });
  if (!tpl) return { ok: false as const, error: "not_found" };

  await prisma.smsTemplate.update({
    where: { id },
    data: { isFavorite: !tpl.isFavorite },
  });
  revalidateTemplatePaths();
  return { ok: true as const, isFavorite: !tpl.isFavorite };
}

export async function seedSampleTemplatesAction() {
  const userId = await requireUserId();
  const count = await prisma.smsTemplate.count({ where: { userId } });

  if (count > 0) {
    const names = SAMPLE_SMS_TEMPLATES.map((t) => t.name);
    const existing = await prisma.smsTemplate.findMany({
      where: { userId, name: { in: [...names] } },
      select: { name: true },
    });
    const existingNames = new Set(existing.map((e) => e.name));
    const toCreate = SAMPLE_SMS_TEMPLATES.filter((t) => !existingNames.has(t.name));
    if (toCreate.length === 0) {
      return { ok: true as const, created: 0, message: "Samples already added" };
    }
    await prisma.$transaction(
      toCreate.map((t) =>
        prisma.smsTemplate.create({
          data: {
            userId,
            name: t.name,
            content: t.content,
            isFavorite: t.isFavorite,
          },
        }),
      ),
    );
    revalidateTemplatePaths();
    return { ok: true as const, created: toCreate.length };
  }

  await prisma.$transaction(
    SAMPLE_SMS_TEMPLATES.map((t) =>
      prisma.smsTemplate.create({
        data: {
          userId,
          name: t.name,
          content: t.content,
          isFavorite: t.isFavorite,
        },
      }),
    ),
  );
  revalidateTemplatePaths();
  return { ok: true as const, created: SAMPLE_SMS_TEMPLATES.length };
}
