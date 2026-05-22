"use server";

import { getSession, isAdminRole } from "@/lib/auth/session";
import { saveMnotifySettings, loadMnotifySettings } from "@/lib/mnotify-settings";
import { sendMnotifyQuickSms } from "@/lib/mnotify";
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

  redirect("/admin/mnotify?saved=1");
}

export async function testMnotifyFromAdminAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  const phone = String(formData.get("phone") ?? "");
  const message = String(formData.get("message") ?? "SplitSMS test message");
  const settings = await loadMnotifySettings();
  const sender = String(formData.get("sender") ?? settings.defaultSenderId);

  const result = await sendMnotifyQuickSms({
    recipients: [phone],
    sender,
    message,
  });

  await prisma.platformSetting.upsert({
    where: { key: "mnotify_last_test" },
    update: {
      value: {
        at: new Date().toISOString(),
        ok: result.ok,
        error: result.ok ? null : result.error,
        providerRef: result.ok ? result.providerRef : null,
        phone,
      },
    },
    create: {
      key: "mnotify_last_test",
      value: {
        at: new Date().toISOString(),
        ok: result.ok,
        error: result.ok ? null : result.error,
        providerRef: result.ok ? result.providerRef : null,
        phone,
      },
    },
  });

  redirect(`/admin/mnotify?test=${result.ok ? "ok" : "fail"}`);
}
