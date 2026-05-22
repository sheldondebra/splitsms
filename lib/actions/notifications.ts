"use server";

import { getSession } from "@/lib/auth/session";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function markReadAction(formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await markNotificationRead(session.userId, id);
  revalidatePath("/dashboard");
}

export async function markAllReadAction() {
  const session = await getSession();
  if (!session) return;
  await markAllNotificationsRead(session.userId);
  revalidatePath("/dashboard");
}
