"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { notifyAdminsBalanceAlert } from "@/lib/admin/balance-alerts";
import {
  creditCoverAlertFromDashboard,
  getCreditCoverDashboard,
  saveCreditCoverThreshold,
} from "@/lib/admin/credit-cover-dashboard";
import {
  isCreditCoverAlertable,
  parseCreditCoverThreshold,
} from "@/lib/admin/credit-cover";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/login");
  return session;
}

export async function saveCreditCoverThresholdAction(formData: FormData) {
  await requireAdmin();
  const value = parseCreditCoverThreshold(formData.get("credits"));
  await saveCreditCoverThreshold(value);
  revalidatePath("/admin/credit-cover");
  redirect("/admin/credit-cover?saved=threshold");
}

export async function sendCreditCoverAlertAction() {
  await requireAdmin();
  const data = await getCreditCoverDashboard();
  if (!isCreditCoverAlertable(data.status)) {
    redirect("/admin/credit-cover?error=not-low");
  }
  await notifyAdminsBalanceAlert(creditCoverAlertFromDashboard(data));
  revalidatePath("/admin/credit-cover");
  redirect("/admin/credit-cover?saved=alert");
}
