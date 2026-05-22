"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateEnterpriseIpWhitelistAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const raw = String(formData.get("ipWhitelist") ?? "");
  const ips = raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.enterpriseAccount.update({
    where: { userId: session.userId },
    data: { ipWhitelist: ips },
  });

  revalidatePath("/enterprise/smpp");
  redirect("/enterprise/smpp?saved=1");
}

export async function updateSmppIpWhitelistAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const ent = await prisma.enterpriseAccount.findUnique({
    where: { userId: session.userId },
    include: { smppAccount: true },
  });
  if (!ent?.smppAccount) redirect("/enterprise/smpp?error=noaccount");

  const raw = String(formData.get("ipWhitelist") ?? "");
  const ips = raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  await prisma.smppAccount.update({
    where: { id: ent.smppAccount.id },
    data: { ipWhitelist: ips },
  });

  revalidatePath("/enterprise/smpp");
  redirect("/enterprise/smpp?saved=1");
}
