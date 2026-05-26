"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function approveSenderIdAction(formData: FormData) {
  const id = String(formData.get("id"));
  const isDefault = formData.get("setDefault") === "1";
  const userId = (
    await prisma.senderId.findUnique({ where: { id }, select: { userId: true } })
  )?.userId;

  if (userId && isDefault) {
    await prisma.senderId.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  await prisma.senderId.update({
    where: { id },
    data: {
      status: "APPROVED",
      ...(isDefault ? { isDefault: true } : {}),
    },
  });
  revalidatePath("/admin/sender-ids");
}

export async function rejectSenderIdAction(formData: FormData) {
  await prisma.senderId.update({
    where: { id: String(formData.get("id")) },
    data: {
      status: "REJECTED",
      adminNote: String(formData.get("note") ?? "Does not meet naming requirements").trim(),
      isDefault: false,
    },
  });
  revalidatePath("/admin/sender-ids");
}
