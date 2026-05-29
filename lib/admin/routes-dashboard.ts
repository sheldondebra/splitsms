import { prisma } from "@/lib/db";
import { loadMnotifySettings } from "@/lib/mnotify-settings";
import { isMnotifyConfigured, getMnotifyStatus } from "@/lib/mnotify";
import {
  isInfobipConfigured,
  isTwilioConfigured,
  loadInfobipSettings,
  loadTwilioSettings,
} from "@/lib/sms/provider-credentials";
import { fetchAllSmsProviderBalances } from "@/lib/sms/provider-balances";
import { loadSmsRoutingPolicy } from "@/lib/sms/routing-policy";
import { getRecentSmsRoutingLogs } from "@/lib/sms/routing-log";
import type { ProviderSmsBalance } from "@/lib/sms/provider-balances";
import type { SmsProviderType } from "@/lib/generated/prisma/client";

export type ProviderHealth = {
  id: string;
  type: SmsProviderType;
  name: string;
  isActive: boolean;
  configured: boolean;
  configHint: string;
  messages7d: number;
  failed7d: number;
  balance: ProviderSmsBalance;
};

export type RouteRow = {
  routeId: string;
  countryId: string;
  countryCode: string;
  countryName: string;
  dialCode: string;
  isActive: boolean;
  isLive: boolean;
  liveReason: string;
  steps: { priority: number; providerId: string; type: SmsProviderType; name: string; configured: boolean }[];
  messages7d: number;
  failed7d: number;
  pricingProvider: string | null;
  memberPrice: number | null;
};

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function providerConfigured(
  type: SmsProviderType,
  flags: { mnotifyOk: boolean; twilioOk: boolean; infobipOk: boolean },
): { ok: boolean; hint: string } {
  if (type === "MNOTIFY") {
    return flags.mnotifyOk
      ? { ok: true, hint: "Configured in Admin → Providers" }
      : { ok: false, hint: "Configure mNotify in Providers tab" };
  }
  if (type === "TWILIO") {
    return flags.twilioOk
      ? { ok: true, hint: "Twilio credentials in Providers" }
      : { ok: false, hint: "Add Twilio SID, token & from number in Providers" };
  }
  return flags.infobipOk
    ? { ok: true, hint: "Infobip API key in Providers" }
    : { ok: false, hint: "Add Infobip API key in Providers" };
}

export async function getAdminRoutesDashboard() {
  const since7d = daysAgo(7);
  const [
    mnotifyOk,
    twilioSettings,
    infobipSettings,
    routingPolicy,
    mnotifyStatus,
    providerBalances,
    routingLogs,
    providers,
    routes,
    countries,
    lastTestSetting,
  ] = await Promise.all([
      isMnotifyConfigured(),
      loadTwilioSettings(),
      loadInfobipSettings(),
      loadSmsRoutingPolicy(),
      getMnotifyStatus(),
      fetchAllSmsProviderBalances(),
      getRecentSmsRoutingLogs(40),
      prisma.smsProvider.findMany({ orderBy: { type: "asc" } }),
      prisma.smsRoute.findMany({
        include: {
          country: { include: { pricing: true } },
          steps: { include: { provider: true }, orderBy: { priority: "asc" } },
        },
        orderBy: { country: { name: "asc" } },
      }),
      prisma.country.findMany({
        where: { isActive: true },
        include: { routes: true, pricing: true },
        orderBy: { name: "asc" },
      }),
      prisma.platformSetting.findUnique({ where: { key: "sms_route_last_test" } }),
    ]);

  const providerStats = await prisma.message.groupBy({
    by: ["providerType"],
    where: { createdAt: { gte: since7d }, providerType: { not: null } },
    _count: { id: true },
  });
  const providerFailed = await prisma.message.groupBy({
    by: ["providerType"],
    where: {
      createdAt: { gte: since7d },
      status: "FAILED",
      providerType: { not: null },
    },
    _count: { id: true },
  });

  const statMap = new Map(
    providerStats.map((p) => [p.providerType!, { total: p._count.id, failed: 0 }]),
  );
  for (const f of providerFailed) {
    const cur = statMap.get(f.providerType!) ?? { total: 0, failed: 0 };
    cur.failed = f._count.id;
    statMap.set(f.providerType!, cur);
  }

  const balanceByType = new Map(providerBalances.map((b) => [b.type, b]));
  const configFlags = {
    mnotifyOk,
    twilioOk: isTwilioConfigured(twilioSettings),
    infobipOk: isInfobipConfigured(infobipSettings),
  };

  const providerHealth: ProviderHealth[] = providers.map((p) => {
    const cfg = providerConfigured(p.type, configFlags);
    const stats = statMap.get(p.type);
    const balance =
      balanceByType.get(p.type) ?? {
        type: p.type,
        name: p.name,
        status: "unsupported" as const,
        display: "—",
        amount: null,
        currency: null,
        bonus: null,
      };
    return {
      id: p.id,
      type: p.type,
      name: p.name,
      isActive: p.isActive,
      configured: cfg.ok,
      configHint: cfg.hint,
      messages7d: stats?.total ?? 0,
      failed7d: stats?.failed ?? 0,
      balance,
    };
  });

  const countryMsgStats = await prisma.message.groupBy({
    by: ["countryCode"],
    where: { createdAt: { gte: since7d }, countryCode: { not: null } },
    _count: { id: true },
  });
  const countryFailed = await prisma.message.groupBy({
    by: ["countryCode"],
    where: {
      createdAt: { gte: since7d },
      status: "FAILED",
      countryCode: { not: null },
    },
    _count: { id: true },
  });
  const msgByCountry = new Map(countryMsgStats.map((c) => [c.countryCode!, c._count.id]));
  const failByCountry = new Map(countryFailed.map((c) => [c.countryCode!, c._count.id]));

  const routeRows: RouteRow[] = routes.map((r) => {
    const steps = r.steps.map((s) => {
      const cfg = providerConfigured(s.provider.type, configFlags);
      return {
        priority: s.priority,
        providerId: s.provider.id,
        type: s.provider.type,
        name: s.provider.name,
        configured: cfg.ok && s.provider.isActive,
      };
    });
    const primary = steps[0];
    const isLive =
      r.isActive &&
      steps.length > 0 &&
      Boolean(primary?.configured) &&
      r.country.isActive;
    let liveReason = "Live — failover chain active";
    if (!r.isActive) liveReason = "Route disabled";
    else if (!r.country.isActive) liveReason = "Country inactive";
    else if (steps.length === 0) liveReason = "No providers in chain";
    else if (!primary?.configured) liveReason = `Primary (${primary?.type}) not configured`;

    return {
      routeId: r.id,
      countryId: r.country.id,
      countryCode: r.country.code,
      countryName: r.country.name,
      dialCode: r.country.dialCode,
      isActive: r.isActive,
      isLive,
      liveReason,
      steps,
      messages7d: msgByCountry.get(r.country.code) ?? 0,
      failed7d: failByCountry.get(r.country.code) ?? 0,
      pricingProvider: r.country.pricing[0]?.provider ?? null,
      memberPrice: r.country.pricing[0]?.memberPrice?.toNumber() ?? null,
    };
  });

  const routedCountryIds = new Set(routes.map((r) => r.countryId));
  const missingRoutes = countries
    .filter((c) => !routedCountryIds.has(c.id))
    .map((c) => ({
      countryId: c.id,
      code: c.code,
      name: c.name,
      dialCode: c.dialCode,
    }));

  const lastTest = lastTestSetting?.value as {
    at?: string;
    countryCode?: string;
    phone?: string;
    ok?: boolean;
    provider?: string;
    error?: string;
    mode?: string;
  } | null;

  return {
    providerHealth,
    providerBalances,
    routeRows,
    missingRoutes,
    providers: providers.map((p) => ({ id: p.id, type: p.type, name: p.name, isActive: p.isActive })),
    policy: routingPolicy,
    routingLogs,
    mnotifyStatus,
    totals: {
      routes: routeRows.length,
      live: routeRows.filter((r) => r.isLive).length,
      messages7d: routeRows.reduce((s, r) => s + r.messages7d, 0),
    },
    lastTest: lastTest?.at ? lastTest : null,
  };
}
