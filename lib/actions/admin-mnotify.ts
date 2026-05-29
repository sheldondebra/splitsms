"use server";

import { getSession, isAdminRole } from "@/lib/auth/session";
import { saveMnotifySettings, loadMnotifySettings } from "@/lib/mnotify-settings";
import { normalizeMnotifyPhone, sendMnotifyQuickSms } from "@/lib/mnotify";
import {
  cacheBalanceFromMnotifyResponse,
  saveMnotifyBalanceCache,
} from "@/lib/mnotify/balance";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export async function saveMnotifySettingsAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  await saveMnotifySettings(
    {
      enabled: formData.get("enabled") === "on",
      apiKey: String(formData.get("apiKey") ?? ""),
      baseUrl: String(formData.get("baseUrl") ?? "https://api.mnotify.com"),
      defaultSenderId: String(formData.get("defaultSenderId") ?? "SplitSMS"),
      mnotifyFirst: formData.get("mnotifyFirst") === "on",
      allowFailover: formData.get("allowFailover") === "on",
    },
    session.userId,
  );

  redirect("/admin/providers?tab=mnotify&saved=1");
}

export async function testMnotifyFromAdminAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const phoneRaw = String(formData.get("phone") ?? "");
  const phone = normalizeMnotifyPhone(phoneRaw);
  const message = String(formData.get("message") ?? "SplitSMS test message");
  const settings = await loadMnotifySettings();
  const sender = String(formData.get("sender") ?? settings.defaultSenderId);

  const result = await sendMnotifyQuickSms({
    recipients: [phone],
    sender,
    message,
  });

  if (result.ok && "data" in result && result.data) {
    const cached = cacheBalanceFromMnotifyResponse(result.data, "admin test SMS");
    if (cached) await saveMnotifyBalanceCache(cached);
  }

  const testPayload = {
    at: new Date().toISOString(),
    ok: result.ok,
    error: result.ok ? null : result.error,
    providerRef: result.ok ? result.providerRef : null,
    phone,
    phoneInput: phoneRaw,
    httpStatus: "httpStatus" in result ? result.httpStatus : undefined,
  };

  revalidatePath("/admin");
  revalidatePath("/admin/routes");
  revalidatePath("/admin/providers");
  revalidatePath("/admin/mnotify");

  await prisma.platformSetting.upsert({
    where: { key: "mnotify_last_test" },
    update: { value: testPayload },
    create: { key: "mnotify_last_test", value: testPayload },
  });

  redirect(`/admin/providers?tab=mnotify&test=${result.ok ? "ok" : "fail"}`);
}
