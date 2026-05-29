"use server";

import { getSession, isAdminRole } from "@/lib/auth/session";
import { fetchAllSmsProviderBalances } from "@/lib/sms/provider-balances";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function refreshProviderBalancesAction() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/login");

  await fetchAllSmsProviderBalances();

  revalidatePath("/admin");
  revalidatePath("/admin/routes");
  revalidatePath("/admin/mnotify");

  redirect("/admin/routes?balances=refreshed");
}
