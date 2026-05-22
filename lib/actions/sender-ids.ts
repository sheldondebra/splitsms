"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function requestSenderIdAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const value = String(formData.get("value") ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const countryCode = String(formData.get("countryCode") ?? "GH")
    .trim()
    .toUpperCase();

  if (!value || value.length > 11) {
    redirect("/dashboard/sender-ids?error=invalid");
  }

  const duplicate = await prisma.senderId.findFirst({
    where: { userId: session.userId, value },
  });
  if (duplicate) {
    redirect("/dashboard/sender-ids?error=duplicate");
  }

  await prisma.senderId.create({
    data: {
      userId: session.userId,
      value,
      countryCode,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard/sender-ids");
  redirect("/dashboard/sender-ids?requested=1");
}

export async function setDefaultSenderIdAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const id = String(formData.get("id") ?? "");
  const sender = await prisma.senderId.findFirst({
    where: { id, userId: session.userId, status: "APPROVED" },
  });

  if (!sender) redirect("/dashboard/sender-ids?error=notfound");

  await prisma.$transaction([
    prisma.senderId.updateMany({
      where: { userId: session.userId },
      data: { isDefault: false },
    }),
    prisma.senderId.update({
      where: { id },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/dashboard/sender-ids");
  revalidatePath("/dashboard/send");
  redirect("/dashboard/sender-ids?default=1");
}
