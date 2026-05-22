import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getDashboardOverview } from "@/lib/analytics/dashboard";
import { DashboardBalance } from "@/components/dashboard/dashboard-balance";
import { getBalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { OnboardingBanner } from "@/components/dashboard/onboarding-banner";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SenderIdCard } from "@/components/dashboard/sender-id-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Percent, ArrowUpRight } from "lucide-react";
import { STATUS_LABELS } from "@/lib/ux/messages";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const [data, balance, user, recentMessages, hasTopup, senderIds] = await Promise.all([
    getDashboardOverview(session.userId),
    getBalanceSnapshot(session.userId),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { isVerified: true, fullName: true },
    }),
    prisma.message.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        recipient: true,
        status: true,
        createdAt: true,
        body: true,
        senderId: true,
      },
    }),
    prisma.transaction.findFirst({
      where: {
        userId: session.userId,
        type: { in: ["WALLET_TOPUP", "CREDIT_PURCHASE"] },
      },
    }),
    prisma.senderId.findMany({
      where: { userId: session.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: { id: true, value: true, status: true, isDefault: true },
    }),
  ]);

  const lowBalance = balance.lowBalance;
  const hasBalance =
    data.walletBalance > 0 || data.creditBalance > 0 || Boolean(hasTopup);
  const hasApprovedSender = senderIds.some((s) => s.status === "APPROVED");

  return (
    <div className="space-y-8 pb-2">
      {lowBalance && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          Low message balance — <strong>{data.creditBalance}</strong> credits left.{" "}
          <Link href="/dashboard/wallet" className="font-semibold text-primary underline">
            Add money
          </Link>
        </div>
      )}

      {!hasApprovedSender && (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-2">
          <span>Set up your <strong>Sender ID</strong> before sending — it is the name people see on their phone.</span>
          <Link href="/dashboard/sender-ids" className="font-semibold text-primary text-sm whitespace-nowrap">
            Set up now →
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Your messaging at a glance
          </p>
        </div>
        <Link
          href="/dashboard/send"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 transition-colors"
        >
          <Send className="h-4 w-4" />
          Send SMS
        </Link>
      </div>

      <SenderIdCard senderIds={senderIds} />

      <OnboardingBanner
        phoneVerified={user?.isVerified ?? false}
        hasBalance={hasBalance}
        hasSenderId={hasApprovedSender}
        hasSentMessage={data.totalMessages > 0}
      />

      <QuickActions />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="stat-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sent today
            </p>
            <Send className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight">
            {data.messagesToday}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">messages</p>
        </div>
        <div className="stat-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Delivery rate
            </p>
            <Percent className="h-4 w-4 text-muted-foreground/60" />
          </div>
          <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight">
            {data.deliveryRate}%
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">all time</p>
        </div>
      </div>

      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
          <Link
            href="/dashboard/reports"
            className="text-xs font-semibold text-primary inline-flex items-center gap-1 hover:underline"
          >
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentMessages.length === 0 ? (
            <EmptyState
              icon={Send}
              title="No messages yet"
              description="Send your first SMS — make sure your Sender ID is set up first."
              actionLabel="Send SMS"
              actionHref="/dashboard/send"
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {recentMessages.map((m) => (
                <li key={m.id} className="flex justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{m.recipient}</p>
                    <p className="text-muted-foreground truncate text-xs mt-0.5">{m.body}</p>
                    <p className="text-[11px] text-muted-foreground/80 mt-1 font-mono">
                      From: {m.senderId}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs font-semibold ${
                        m.status === "DELIVERED"
                          ? "text-emerald-600"
                          : m.status === "FAILED"
                            ? "text-destructive"
                            : ""
                      }`}
                    >
                      {STATUS_LABELS[m.status] ?? m.status}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {m.createdAt.toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
