"use server";

import { getSession, isAdminRole } from "@/lib/auth/session";
import {
  isSupportPresenceStatus,
  saveSupportPresence,
  type SupportPresenceStatus,
} from "@/lib/support/presence";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

export async function updateSupportPresenceAction(formData: FormData) {
  const session = await requireAdmin();
  const statusRaw = String(formData.get("status") ?? "").trim().toUpperCase();
  const returnTo = String(formData.get("returnTo") ?? "/admin/support");

  if (!isSupportPresenceStatus(statusRaw)) {
    redirect(`${returnTo}?error=presence`);
  }

  await saveSupportPresence(statusRaw as SupportPresenceStatus, session.userId);

  revalidatePath("/admin/support");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/support");
  redirect(`${returnTo}?saved=presence`);
}
