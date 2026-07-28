"use server";

import { prisma } from "@/lib/db";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { saveSmsRoutingPolicy, type SenderRegistrationMode } from "@/lib/sms/routing-policy";
import { sendSmsWithFailover } from "@/lib/sms/orchestrator";
import { mnotifyAdapter } from "@/lib/sms/providers/mnotify";
import { twilioAdapter } from "@/lib/sms/providers/twilio";
import { infobipAdapter } from "@/lib/sms/providers/infobip";
import type { SmsProviderType } from "@/lib/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const PROVIDERS: SmsProviderType[] = ["MNOTIFY", "TWILIO", "INFOBIP"];

const adapters = {
  MNOTIFY: mnotifyAdapter,
  TWILIO: twilioAdapter,
  INFOBIP: infobipAdapter,
};

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

function routesPath(query?: Record<string, string>) {
  const q = query ? `?${new URLSearchParams(query).toString()}` : "";
  return `/admin/routes${q}`;
}

async function saveLastRouteTest(payload: {
  countryCode: string;
  phone: string;
  ok: boolean;
  provider?: string;
  error?: string;
  mode: string;
}) {
  await prisma.platformSetting.upsert({
    where: { key: "sms_route_last_test" },
    update: {
      value: { ...payload, at: new Date().toISOString() },
    },
    create: {
      key: "sms_route_last_test",
      value: { ...payload, at: new Date().toISOString() },
    },
  });
}

export async function saveRoutingPolicyAction(formData: FormData) {
  const session = await requireAdmin();

  const mode = String(formData.get("senderRegistrationMode") ?? "BY_COUNTRY") as SenderRegistrationMode;
  const selected: SmsProviderType[] = [];
  for (const p of PROVIDERS) {
    if (formData.get(`reg_${p}`) === "on") selected.push(p);
  }

  await saveSmsRoutingPolicy(
    {
      autoRouteByRecipient: formData.get("autoRouteByRecipient") === "on",
      routingLogEnabled: formData.get("routingLogEnabled") === "on",
      mnotifyFirst: formData.get("mnotifyFirst") === "on",
      allowFailover: formData.get("allowFailover") === "on",
      senderRegistrationMode: ["ALL", "BY_COUNTRY", "SELECTED"].includes(mode)
        ? mode
        : "BY_COUNTRY",
      senderRegistrationProviders:
        mode === "SELECTED" && selected.length > 0 ? selected : [...PROVIDERS],
    },
    session.userId,
  );
  revalidatePath("/admin/routes");
  revalidatePath("/admin/providers");
  redirect(routesPath({ saved: "policy" }));
}

export async function createRouteForCountryAction(formData: FormData) {
  await requireAdmin();
  const countryId = String(formData.get("countryId") ?? "");
  if (!countryId) redirect(routesPath({ error: "country" }));

  const existing = await prisma.smsRoute.findUnique({ where: { countryId } });
  if (existing) redirect(routesPath({ error: "exists" }));

  const providers = await prisma.smsProvider.findMany();
  const mnotify = providers.find((p) => p.type === "MNOTIFY");
  const route = await prisma.smsRoute.create({
    data: { countryId, isActive: true },
  });

  if (mnotify) {
    await prisma.smsRouteStep.create({
      data: { routeId: route.id, providerId: mnotify.id, priority: 1 },
    });
  }

  revalidatePath("/admin/routes");
  redirect(routesPath({ saved: "created" }));
}

export async function updateRouteStepsAction(formData: FormData) {
  await requireAdmin();
  const routeId = String(formData.get("routeId") ?? "");
  if (!routeId) redirect(routesPath({ error: "route" }));

  const providers = await prisma.smsProvider.findMany();
  const byType = Object.fromEntries(providers.map((p) => [p.type, p.id]));

  const steps: { providerId: string; priority: number }[] = [];
  const used = new Set<SmsProviderType>();
  for (let i = 1; i <= 3; i++) {
    const type = String(formData.get(`step_${i}`) ?? "").trim() as SmsProviderType;
    if (type && PROVIDERS.includes(type) && byType[type] && !used.has(type)) {
      used.add(type);
      steps.push({ providerId: byType[type], priority: steps.length + 1 });
    }
  }

  await prisma.smsRouteStep.deleteMany({ where: { routeId } });
  for (const s of steps) {
    await prisma.smsRouteStep.create({ data: { routeId, ...s } });
  }

  revalidatePath("/admin/routes");
  redirect(routesPath({ saved: "steps" }));
}

export async function toggleRouteActiveAction(formData: FormData) {
  await requireAdmin();
  const routeId = String(formData.get("routeId") ?? "");
  const isActive = formData.get("isActive") === "1";
  await prisma.smsRoute.update({
    where: { id: routeId },
    data: { isActive },
  });
  revalidatePath("/admin/routes");
  redirect(routesPath({ saved: "toggle" }));
}

export async function toggleProviderActiveAction(formData: FormData) {
  await requireAdmin();
  const providerId = String(formData.get("providerId") ?? "");
  const isActive = formData.get("isActive") === "1";
  await prisma.smsProvider.update({
    where: { id: providerId },
    data: { isActive },
  });
  revalidatePath("/admin/routes");
  redirect(routesPath({ saved: "provider" }));
}

export async function testSmsRouteAction(formData: FormData) {
  await requireAdmin();
  const countryCode = String(formData.get("countryCode") ?? "GH").toUpperCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "SplitSMS route test").trim();
  const sender = String(formData.get("sender") ?? "SplitSMS").trim();
  const mode = String(formData.get("mode") ?? "route");
  const lockedProvider = String(formData.get("providerType") ?? "").trim() as SmsProviderType;

  if (!phone) redirect(routesPath({ error: "phone" }));

  let result: { success: boolean; error?: string; provider?: string };

  if (mode === "provider" && PROVIDERS.includes(lockedProvider)) {
    const adapter = adapters[lockedProvider];
    const r = await adapter.send({ to: phone, from: sender, body: message });
    result = { ...r, provider: lockedProvider };
  } else {
    const r = await sendSmsWithFailover(
      countryCode,
      { to: phone, from: sender, body: message },
      {
        lockedProvider:
          mode === "primary" && PROVIDERS.includes(lockedProvider)
            ? lockedProvider
            : undefined,
        recipientPhone: phone,
      },
    );
    result = r;
  }

  await saveLastRouteTest({
    countryCode,
    phone,
    ok: result.success,
    provider: result.provider,
    error: result.error,
    mode: mode === "provider" ? `provider:${lockedProvider}` : `route:${countryCode}`,
  });

  revalidatePath("/admin/routes");
  redirect(routesPath({ test: result.success ? "ok" : "fail" }));
}
