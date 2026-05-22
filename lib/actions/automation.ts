"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import type { AutomationTrigger } from "@/lib/generated/prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireUserId() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.userId;
}

export async function createAutomationAction(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const trigger = String(formData.get("trigger") ?? "MANUAL") as AutomationTrigger;
  if (!name || !message) redirect("/dashboard/automation?error=invalid");

  await prisma.automationWorkflow.create({
    data: { userId, name, message, trigger },
  });
  revalidatePath("/dashboard/automation");
  redirect("/dashboard/automation");
}

export async function toggleAutomationAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id"));
  const wf = await prisma.automationWorkflow.findFirst({ where: { id, userId } });
  if (!wf) redirect("/dashboard/automation");
  await prisma.automationWorkflow.update({
    where: { id },
    data: { isActive: !wf.isActive },
  });
  revalidatePath("/dashboard/automation");
  redirect("/dashboard/automation");
}

export async function deleteAutomationAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id"));
  await prisma.automationWorkflow.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard/automation");
  redirect("/dashboard/automation");
}
