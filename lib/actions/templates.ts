"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireUserId() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

export async function createTemplateAction(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!name || !content) redirect("/dashboard/templates?error=invalid");

  await prisma.smsTemplate.create({
    data: { userId, name, content },
  });
  revalidatePath("/dashboard/templates");
  redirect("/dashboard/templates");
}

export async function updateTemplateAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  await prisma.smsTemplate.updateMany({
    where: { id, userId },
    data: { name, content },
  });
  revalidatePath("/dashboard/templates");
  redirect("/dashboard/templates");
}

export async function deleteTemplateAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id"));
  await prisma.smsTemplate.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard/templates");
  redirect("/dashboard/templates");
}

export async function toggleTemplateFavoriteAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id"));
  const tpl = await prisma.smsTemplate.findFirst({ where: { id, userId } });
  if (!tpl) redirect("/dashboard/templates");
  await prisma.smsTemplate.update({
    where: { id },
    data: { isFavorite: !tpl.isFavorite },
  });
  revalidatePath("/dashboard/templates");
  redirect("/dashboard/templates");
}
