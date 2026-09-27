import Link from "next/link";
import { BadgeCheck, MessageSquare, Send, Wallet } from "lucide-react";
import type { BalanceSnapshot } from "@/lib/dashboard/balance-snapshot";
import { formatWalletMoney } from "@/lib/billing/sms-packages";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardWelcomeHeroProps = {
  firstName: string;
  balance: BalanceSnapshot;
  messagesToday: number;
  deliveryRate: number;
  campaigns: number;
  activeSenderIds: number;
  hasApprovedSender: boolean;
};

export function DashboardWelcomeHero({
  firstName,
  balance,
  messagesToday,
  deliveryRate,
  campaigns,
  activeSenderIds,
  hasApprovedSender,
}: DashboardWelcomeHeroProps) {
  const { creditBalance, walletBalance, walletCurrency, lowBalance } = balance;

  const status = !hasApprovedSender
    ? {
        title: `Welcome back, ${firstName}`,
        text: "Approve a Sender ID before you send bulk SMS.",
        tone: "warn" as const,
        icon: BadgeCheck,
      }
    : lowBalance
      ? {
          title: `Welcome back, ${firstName}`,
          text: `Only ${creditBalance.toLocaleString()} SMS credits left — top up so sending isn’t interrupted.`,
          tone: "warn" as const,
          icon: MessageSquare,
        }
      : {
          title: `Welcome back, ${firstName}`,
          text: `${creditBalance.toLocaleString()} SMS credits · ${formatWalletMoney(walletBalance, walletCurrency)} wallet ready.`,
          tone: "ok" as const,
          icon: Send,
        };

  const StatusIcon = status.icon;

  const kpis = [
    {
      label: "SMS credits",
      value: creditBalance.toLocaleString(),
      hint: lowBalance ? "Running low" : "Ready to send",
      href: "/dashboard/wallet",
      tone: lowBalance ? ("warn" as const) : ("primary" as const),
    },
    {
      label: "Wallet",
      value: formatWalletMoney(walletBalance, walletCurrency),
      hint: "Available now",
      href: "/dashboard/wallet",
      tone: "neutral" as const,
    },
    {
      label: "Sent today",
      value: messagesToday.toLocaleString(),
      hint: "Messages",
      href: "/dashboard/reports",
      tone: "neutral" as const,
    },
    {
      label: "Delivery rate",
      value: `${deliveryRate}%`,
      hint: "All time",
      href: "/dashboard/account-reports/delivery",
      tone:
        deliveryRate >= 80
          ? ("ok" as const)
          : deliveryRate >= 50
            ? ("primary" as const)
            : deliveryRate > 0
              ? ("warn" as const)
              : ("neutral" as const),
    },
    {
      label: "Campaigns",
      value: campaigns.toLocaleString(),
      hint: "Total",
      href: "/dashboard/campaigns",
      tone: "neutral" as const,
    },
    {
      label: "Sender IDs",
      value: activeSenderIds.toLocaleString(),
      hint: hasApprovedSender ? "Approved" : "None approved",
      href: "/dashboard/sender-ids",
      tone: hasApprovedSender ? ("neutral" as const) : ("warn" as const),
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
              status.tone === "warn"
                ? "bg-amber-500/12 text-amber-800 ring-amber-500/20 dark:text-amber-200"
                : "bg-primary/10 text-primary ring-primary/15",
            )}
          >
            <StatusIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">{status.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{status.text}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!hasApprovedSender ? (
            <Link
              href="/dashboard/sender-ids"
              className={cn(buttonVariants({ size: "sm" }), "h-9 gap-1.5 rounded-xl")}
            >
              <BadgeCheck className="h-3.5 w-3.5" />
              Set up Sender ID
            </Link>
          ) : (
            <Link
              href="/dashboard/send"
              className={cn(buttonVariants({ size: "sm" }), "h-9 gap-1.5 rounded-xl")}
            >
              <Send className="h-3.5 w-3.5" />
              Send SMS
            </Link>
          )}
          <Link
            href="/dashboard/wallet"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 gap-1.5 rounded-xl",
            )}
          >
            <Wallet className="h-3.5 w-3.5" />
            Top up
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map(({ label, value, hint, href, tone }, index) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "border-b border-border/50 p-3.5 transition-colors hover:bg-muted/30 xl:border-b-0",
              index % 2 === 0 && "sm:border-r",
              index < 5 && "xl:border-r",
              index < 4 && "sm:border-b",
              tone === "primary" && "bg-primary/[0.03]",
              tone === "warn" && "bg-amber-500/[0.04]",
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p
              className={cn(
                "mt-1.5 text-lg font-bold tabular-nums tracking-tight sm:text-xl",
                tone === "primary" && "text-primary",
                tone === "ok" && "text-emerald-700 dark:text-emerald-300",
                tone === "warn" && "text-amber-800 dark:text-amber-300",
              )}
            >
              {value}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
          </Link>
        ))}
      </div>

    </section>
  );
}
