"use server";

import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import {
  saveInfobipSettings,
  saveTwilioSettings,
} from "@/lib/sms/provider-credentials";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function revalidateProviders() {
  revalidatePath("/admin");
  revalidatePath("/admin/providers");
  revalidatePath("/admin/mnotify");
  revalidatePath("/admin/routes");
}

export async function saveTwilioSettingsAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  await saveTwilioSettings(
    {
      enabled: formData.get("enabled") === "on",
      accountSid: String(formData.get("accountSid") ?? ""),
      authToken: String(formData.get("authToken") ?? ""),
      fromNumber: String(formData.get("fromNumber") ?? ""),
      messagingServiceSid: String(formData.get("messagingServiceSid") ?? ""),
    },
    session.userId,
  );

  revalidateProviders();
  redirect("/admin/providers?tab=twilio&saved=1");
}

export async function saveInfobipSettingsAction(formData: FormData) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");

  await saveInfobipSettings(
    {
      enabled: formData.get("enabled") === "on",
      apiKey: String(formData.get("apiKey") ?? ""),
      baseUrl: String(formData.get("baseUrl") ?? "https://api.infobip.com"),
      senderId: String(formData.get("senderId") ?? "SplitSMS"),
    },
    session.userId,
  );

  revalidateProviders();
  redirect("/admin/providers?tab=infobip&saved=1");
}
