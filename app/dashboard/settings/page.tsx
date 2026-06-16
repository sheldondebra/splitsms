import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { getBalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { ensureUserAccountNumber, formatAccountNumber } from "@/lib/auth/account-number";
import { SettingsAlerts } from "@/components/settings/settings-alerts";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { AppPage, PageHeader } from "@/components/dashboard/page-shell";
import { Settings } from "lucide-react";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    profile?: string;
    password?: string;
    webhook?: string;
    error?: string;
    cooldown?: string;
  }>;
}) {
  const session = await getSession();
  if (!session) return null;

  const params = await searchParams;

  const [
    user,
    webhook,
    sessionCount,
    recentSessions,
    balance,
    senderIds,
    apiKeys,
    contacts,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        countryCode: true,
        isVerified: true,
        createdAt: true,
        referralCode: true,
      },
    }),
    prisma.webhookEndpoint.findFirst({
      where: { userId: session.userId, isActive: true },
      orderBy: { createdAt: "desc" },
      select: { url: true, secret: true, events: true },
    }),
    prisma.userSession.count({ where: { userId: session.userId } }),
    prisma.userSession.findMany({
      where: { userId: session.userId },
      orderBy: { lastActiveAt: "desc" },
      take: 8,
      select: {
        id: true,
        userAgent: true,
        ip: true,
        createdAt: true,
        lastActiveAt: true,
      },
    }),
    getBalanceSnapshot(session.userId),
    prisma.senderId.count({
      where: { userId: session.userId, status: "APPROVED" },
    }),
    prisma.apiKey.count({ where: { userId: session.userId, isActive: true } }),
    prisma.contact.count({ where: { userId: session.userId } }),
  ]);

  if (!user) return null;

  const accountNumber = await ensureUserAccountNumber(session.userId);
  const accountId = formatAccountNumber(accountNumber);

  return (
    <AppPage medium>
      <PageHeader
        title="Settings"
        description="Profile, password, theme, webhooks, and account"
        icon={Settings}
        mobileDescription="Manage your account — profile, security, and preferences."
      />

      <div className="space-y-4">
        <SettingsAlerts
          profile={params.profile}
          password={params.password}
          webhook={params.webhook}
          error={params.error}
          cooldown={params.cooldown}
        />
        <SettingsPanel
          user={{ ...user, accountId }}
          webhook={webhook}
          sessions={recentSessions}
          sessionCount={sessionCount}
          stats={{
            smsCredits: balance.creditBalance,
            walletBalance: balance.walletBalance,
            walletCurrency: balance.walletCurrency,
            senderIds,
            apiKeys,
            contacts,
          }}
        />
      </div>
    </AppPage>
  );
}
