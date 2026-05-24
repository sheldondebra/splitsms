"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function supportRedirect(query: string) {
  revalidatePath("/dashboard/support");
  revalidatePath("/dashboard");
  redirect(`/dashboard/support?${query}`);
}

export async function sendSupportMessageAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const message = String(formData.get("message") ?? "").trim();
  if (!message) supportRedirect("error=empty");

  const subject = message.length > 60 ? `${message.slice(0, 57)}...` : message;

  await prisma.supportTicket.create({
    data: {
      userId: session.userId,
      subject,
      message,
    },
  });

  supportRedirect("sent=1");
}

export async function createSupportTicketAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!subject || !message) supportRedirect("error=invalid");
  if (subject.length > 120) supportRedirect("error=invalid");

  await prisma.supportTicket.create({
    data: {
      userId: session.userId,
      subject,
      message,
    },
  });

  supportRedirect("sent=1");
}
