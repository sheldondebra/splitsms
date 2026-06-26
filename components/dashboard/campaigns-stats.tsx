import Link from "next/link";
import { Calendar, CheckCircle2, Coins, Megaphone, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type CampaignsStatsProps = {
  total: number;
  scheduled: number;
  sending: number;
  completed: number;
  smsCredits: number;
};

export function CampaignsStats({
  total,
  scheduled,
  sending,
  completed,
  smsCredits,
}: CampaignsStatsProps) {
  const items = [
    {
      label: "Total campaigns",
      value: total.toLocaleString(),
      icon: Megaphone,
      tone: "primary" as const,
    },
    {
      label: "Scheduled",
      value: scheduled.toLocaleString(),
      icon: Calendar,
      tone: "neutral" as const,
    },
    {
      label: "Sending",
      value: sending.toLocaleString(),
      icon: Send,
      tone: sending > 0 ? ("primary" as const) : ("neutral" as const),
    },
    {
      label: "Completed",
      value: completed.toLocaleString(),
      icon: CheckCircle2,
      tone: "neutral" as const,
    },
    {
      label: "SMS credits",
      value: smsCredits.toLocaleString(),
      icon: Coins,
      tone: "neutral" as const,
      href: "/dashboard/wallet",
    },
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-border/50">
        {items.map(({ label, value, icon: Icon, tone, href }) => {
          const content = (
            <>
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  tone === "primary"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
                <p className="mt-0.5 text-[11px] font-medium text-muted-foreground truncate">
                  {label}
                </p>
              </div>
            </>
          );

          const cellClass = cn(
            "flex items-center gap-2.5 px-3.5 py-3 min-w-0",
            tone === "primary" && !href && "bg-primary/[0.03]",
            href && "hover:bg-muted/30 transition-colors",
          );

          if (href) {
            return (
              <Link key={label} href={href} className={cellClass}>
                {content}
              </Link>
            );
          }

          return (
            <div key={label} className={cellClass}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
