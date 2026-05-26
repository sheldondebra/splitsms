"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import { registerSenderIdWithProvider } from "@/lib/sender-ids/provider-sync";
import { getOrCreateMemberAccount } from "@/lib/admin/member-account";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function requestSenderIdAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const value = String(formData.get("value") ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const countryCode = String(formData.get("countryCode") ?? DEFAULT_COUNTRY_CODE)
    .trim()
    .toUpperCase();

  if (!value || value.length > 11) {
    redirect("/dashboard/sender-ids?error=invalid");
  }

  const account = await getOrCreateMemberAccount(session.userId);
  if (account.senderIdsBlocked) {
    redirect("/dashboard/sender-ids?error=blocked");
  }

  const senderCount = await prisma.senderId.count({ where: { userId: session.userId } });
  if (senderCount >= account.maxSenderIds) {
    redirect("/dashboard/sender-ids?error=limit");
  }

  const duplicate = await prisma.senderId.findFirst({
    where: { userId: session.userId, value },
  });
  if (duplicate) {
    redirect("/dashboard/sender-ids?error=duplicate");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { fullName: true },
  });

  const sender = await prisma.senderId.create({
    data: {
      userId: session.userId,
      value,
      countryCode,
      status: "PENDING",
    },
  });

  const purpose = `SplitSMS bulk SMS for ${user?.fullName ?? "customer"} (${value})`;
  const provider = await registerSenderIdWithProvider({
    senderRecordId: sender.id,
    userId: session.userId,
    value,
    purpose,
    countryCode,
  });

  revalidatePath("/dashboard/sender-ids");
  revalidatePath("/dashboard/send");

  if (provider.submitted && provider.localStatus === "APPROVED") {
    redirect("/dashboard/sender-ids?approved=1");
  }

  if (provider.submitted) {
    redirect("/dashboard/sender-ids?requested=1");
  }

  if (provider.error) {
    redirect("/dashboard/sender-ids?error=provider");
  }

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
