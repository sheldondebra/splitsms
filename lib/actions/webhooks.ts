"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

const ALL_EVENTS = [
  "message.sent",
  "message.delivered",
  "message.failed",
  "campaign.completed",
  "wallet.low_balance",
];

export async function saveWebhookEndpointAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const url = String(formData.get("url") ?? "").trim();
  if (!url) redirect("/developers/webhooks?error=url");

  const events = formData.getAll("events").map(String);
  const selected = events.length > 0 ? events : ALL_EVENTS;

  const secret = randomBytes(16).toString("hex");

  const existing = await prisma.webhookEndpoint.findFirst({
    where: { userId: session.userId },
  });

  if (existing) {
    await prisma.webhookEndpoint.update({
      where: { id: existing.id },
      data: { url, events: selected, isActive: true },
    });
  } else {
    await prisma.webhookEndpoint.create({
      data: {
        userId: session.userId,
        url,
        secret,
        events: selected,
      },
    });
  }

  revalidatePath("/developers/webhooks");
  revalidatePath("/dashboard/settings");
  redirect("/developers/webhooks?saved=1");
}

export async function testWebhookAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const endpoint = await prisma.webhookEndpoint.findFirst({
    where: { userId: session.userId, isActive: true },
  });
  if (!endpoint) redirect("/developers/webhooks?error=no_endpoint");

  const { dispatchUserWebhooks } = await import("@/lib/webhooks/dispatch");
  await dispatchUserWebhooks(
    session.userId,
    {
      id: "test_msg",
      recipient: "+233200000000",
      status: "SENT",
    },
    "message.sent",
    { test: true },
  );

  redirect("/developers/webhooks?tested=1");
}
