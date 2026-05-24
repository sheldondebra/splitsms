"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import type { AutomationTrigger } from "@/lib/generated/prisma/client";
import { CLIENT_AUTOMATION_TRIGGERS } from "@/lib/automation/catalog";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const VALID_TRIGGERS = new Set(CLIENT_AUTOMATION_TRIGGERS.map((t) => t.value));

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
  const senderId = String(formData.get("senderId") ?? "").trim();

  if (!name || !message || !VALID_TRIGGERS.has(trigger)) {
    redirect("/dashboard/automation?error=automation_invalid");
  }

  if (CLIENT_AUTOMATION_TRIGGERS.find((t) => t.value === trigger)?.live && !senderId) {
    redirect("/dashboard/automation?error=no_sender");
  }

  const approved = senderId
    ? await prisma.senderId.findFirst({
        where: { userId, value: senderId, status: "APPROVED" },
      })
    : null;

  if (senderId && !approved) {
    redirect("/dashboard/automation?error=no_sender");
  }

  await prisma.automationWorkflow.create({
    data: {
      userId,
      name,
      message,
      trigger,
      config: senderId ? { senderId } : undefined,
    },
  });
  revalidatePath("/dashboard/automation");
  redirect("/dashboard/automation?created=1");
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
  redirect("/dashboard/automation?updated=1");
}

export async function deleteAutomationAction(formData: FormData) {
  const userId = await requireUserId();
  const id = String(formData.get("id"));
  await prisma.automationWorkflow.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard/automation");
  redirect("/dashboard/automation?deleted=1");
}
