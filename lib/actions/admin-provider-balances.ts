"use server";

import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import {
  fetchAllSmsProviderBalances,
  fetchSmsProviderBalance,
  type ProviderSmsBalance,
} from "@/lib/sms/provider-balances";
import { recordProviderBalances } from "@/lib/sms/provider-balance-history";
import { maybeNotifyLowBalanceAlerts } from "@/lib/admin/balance-alerts";
import type { SmsProviderType } from "@/lib/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const PROVIDER_TYPES = new Set<SmsProviderType>([
  "MNOTIFY",
  "TWILIO",
  "INFOBIP",
  "EASYSENDSMS",
]);

function revalidateBalancePaths() {
  revalidatePath("/admin");
  revalidatePath("/admin/balances");
  revalidatePath("/admin/routes");
  revalidatePath("/admin/providers");
  revalidatePath("/admin/credit-cover");
  revalidatePath("/admin/mnotify");
}

export async function refreshProviderBalancesAction(formData?: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/login");

  const balances = await fetchAllSmsProviderBalances();
  await recordProviderBalances(balances, "refresh-all");
  void maybeNotifyLowBalanceAlerts().catch(() => undefined);

  revalidateBalancePaths();

  const returnTo = formData?.get("returnTo");
  if (typeof returnTo === "string" && returnTo.startsWith("/admin")) {
    redirect(returnTo);
  }
  redirect("/admin?balances=refreshed");
}

export async function refreshProviderBalanceJsonAction(
  type: SmsProviderType,
): Promise<{ ok: true; balance: ProviderSmsBalance } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return { ok: false, error: "Unauthorized" };
  }
  if (!PROVIDER_TYPES.has(type)) {
    return { ok: false, error: "Unknown provider" };
  }

  try {
    const balance = await fetchSmsProviderBalance(type);
    await recordProviderBalances([balance], "manual");
    revalidateBalancePaths();
    return {
      ok: true,
      balance: { ...balance, checkedAt: new Date().toISOString() },
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to refresh balance",
    };
  }
}

export async function refreshAllProviderBalancesJsonAction(): Promise<
  { ok: true; balances: ProviderSmsBalance[] } | { ok: false; error: string }
> {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    const balances = await fetchAllSmsProviderBalances();
    await recordProviderBalances(balances, "refresh-all");
    void maybeNotifyLowBalanceAlerts().catch(() => undefined);
    revalidateBalancePaths();
    const checkedAt = new Date().toISOString();
    return {
      ok: true,
      balances: balances.map((b) => ({ ...b, checkedAt })),
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to refresh balances",
    };
  }
}

export async function setProviderEnabledJsonAction(
  type: SmsProviderType,
  enabled: boolean,
): Promise<{ ok: true; balance: ProviderSmsBalance } | { ok: false; error: string }> {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return { ok: false, error: "Unauthorized" };
  }
  if (!PROVIDER_TYPES.has(type)) {
    return { ok: false, error: "Unknown provider" };
  }

  try {
    if (type === "MNOTIFY") {
      const { saveMnotifySettings } = await import("@/lib/mnotify-settings");
      await saveMnotifySettings({ enabled }, session.userId);
    } else if (type === "TWILIO") {
      const { saveTwilioSettings } = await import("@/lib/sms/provider-credentials");
      await saveTwilioSettings({ enabled }, session.userId);
    } else if (type === "INFOBIP") {
      const { saveInfobipSettings } = await import("@/lib/sms/provider-credentials");
      await saveInfobipSettings({ enabled }, session.userId);
    } else {
      const { saveEasySendSmsSettings } = await import("@/lib/sms/provider-credentials");
      await saveEasySendSmsSettings({ enabled }, session.userId);
    }

    const balance = await fetchSmsProviderBalance(type);
    revalidateBalancePaths();
    return { ok: true, balance };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update provider",
    };
  }
}
