import { prisma } from "@/lib/db";
import { getMnotifyStatus } from "@/lib/mnotify";
import { loadMnotifySettings, maskApiKey } from "@/lib/mnotify-settings";
import {
  isInfobipConfigured,
  isTwilioConfigured,
  loadInfobipSettings,
  loadTwilioSettings,
  maskProviderSecret,
} from "@/lib/sms/provider-credentials";
import { fetchAllSmsProviderBalances } from "@/lib/sms/provider-balances";
import type { SmsProviderType } from "@/lib/generated/prisma/client";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

const PROVIDER_META: Record<
  SmsProviderType,
  { label: string; color: string; chartFill: string }
> = {
  MNOTIFY: { label: "mNotify", color: "text-emerald-600", chartFill: "#10b981" },
  TWILIO: { label: "Twilio", color: "text-sky-600", chartFill: "#0ea5e9" },
  INFOBIP: { label: "Infobip", color: "text-orange-600", chartFill: "#f97316" },
};

export type ProviderUsageSlice = {
  type: SmsProviderType;
  label: string;
  count: number;
  fill: string;
  percent: number;
};

export async function getProvidersAdminDashboard() {
  const since30d = daysAgo(30);

  const [
    settings,
    twilioSettings,
    infobipSettings,
    status,
    lastTest,
    providerBalances,
    usageRows,
    lifetimeByProvider,
  ] = await Promise.all([
    loadMnotifySettings(),
    loadTwilioSettings(),
    loadInfobipSettings(),
    getMnotifyStatus(),
    prisma.platformSetting.findUnique({ where: { key: "mnotify_last_test" } }),
    fetchAllSmsProviderBalances(),
    prisma.message.groupBy({
      by: ["providerType"],
      where: {
        createdAt: { gte: since30d },
        providerType: { not: null },
        status: { in: ["SENT", "DELIVERED", "PENDING"] },
      },
      _count: { id: true },
    }),
    prisma.message.groupBy({
      by: ["providerType"],
      where: { providerType: { not: null } },
      _count: { id: true },
    }),
  ]);

  const usageTotal = usageRows.reduce((s, r) => s + r._count.id, 0);
  const usage: ProviderUsageSlice[] = usageRows
    .filter((r) => r.providerType)
    .map((r) => {
      const type = r.providerType as SmsProviderType;
      const meta = PROVIDER_META[type];
      const count = r._count.id;
      return {
        type,
        label: meta?.label ?? type,
        count,
        fill: meta?.chartFill ?? "#94a3b8",
        percent: usageTotal > 0 ? Math.round((count / usageTotal) * 100) : 0,
      };
    })
    .sort((a, b) => b.count - a.count);

  const lifetimeMap = new Map(
    lifetimeByProvider
      .filter((r) => r.providerType)
      .map((r) => [r.providerType as SmsProviderType, r._count.id]),
  );

  const twilioOk = isTwilioConfigured(twilioSettings);
  const infobipOk = isInfobipConfigured(infobipSettings);

  const summaries = (["MNOTIFY", "TWILIO", "INFOBIP"] as const).map((type) => {
    const meta = PROVIDER_META[type];
    const balance = providerBalances.find((b) => b.type === type);
    const configured =
      type === "MNOTIFY"
        ? status.configured
        : type === "TWILIO"
          ? twilioOk
          : infobipOk;
    return {
      type,
      label: meta.label,
      colorClass: meta.color,
      configured,
      balanceDisplay: balance?.display ?? "—",
      balanceStatus: balance?.status ?? "unavailable",
      balanceHint: balance?.hint ?? balance?.error,
      messages30d: usage.find((u) => u.type === type)?.count ?? 0,
      messagesLifetime: lifetimeMap.get(type) ?? 0,
    };
  });

  return {
    usage,
    usageTotal30d: usageTotal,
    summaries,
    mnotify: {
      settings,
      maskedApiKey: maskApiKey(settings.apiKey),
      status,
      lastTest: lastTest?.value ?? null,
      messagesLifetime: lifetimeMap.get("MNOTIFY") ?? 0,
    },
    twilio: {
      settings: twilioSettings,
      maskedAuthToken: maskProviderSecret(twilioSettings.authToken),
      configured: twilioOk,
    },
    infobip: {
      settings: infobipSettings,
      maskedApiKey: maskProviderSecret(infobipSettings.apiKey),
      configured: infobipOk,
    },
    providerBalances,
  };
}

export type ProvidersAdminDashboard = Awaited<
  ReturnType<typeof getProvidersAdminDashboard>
>;
