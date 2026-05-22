"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function sendSupportMessageAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const message = String(formData.get("message") ?? "").trim();
  if (!message) redirect("/dashboard?chat=empty");

  const subject =
    message.length > 60 ? `${message.slice(0, 57)}...` : message;

  await prisma.supportTicket.create({
    data: {
      userId: session.userId,
      subject,
      message,
    },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard?chat=sent");
}
