"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";

export async function saveWebhookAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const url = String(formData.get("url") ?? "").trim();
  if (!url) redirect("/dashboard/settings?error=url");

  const secret = randomBytes(16).toString("hex");

  const existing = await prisma.webhookEndpoint.findFirst({
    where: { userId: session.userId },
  });

  if (existing) {
    await prisma.webhookEndpoint.update({
      where: { id: existing.id },
      data: { url, isActive: true },
    });
  } else {
    await prisma.webhookEndpoint.create({
      data: {
        userId: session.userId,
        url,
        secret,
        events: ["message.delivered", "message.failed", "message.sent"],
      },
    });
  }

  redirect("/dashboard/settings?saved=1");
}
