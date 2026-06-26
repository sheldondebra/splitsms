import { Clock, Mail, MessageSquare, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

type SupportStatsProps = {
  openCount: number;
  totalCount: number;
  contactLabel: string;
};

export function SupportStats({ openCount, totalCount, contactLabel }: SupportStatsProps) {
  const items = [
    {
      label: "Open tickets",
      value: openCount.toLocaleString(),
      icon: Clock,
      tone: openCount > 0 ? ("primary" as const) : ("neutral" as const),
    },
    {
      label: "Total requests",
      value: totalCount.toLocaleString(),
      icon: Ticket,
      tone: "neutral" as const,
    },
    {
      label: "Response time",
      value: "1–2 days",
      icon: MessageSquare,
      tone: "neutral" as const,
    },
    {
      label: "Contact via",
      value: contactLabel,
      icon: Mail,
      tone: "neutral" as const,
    },
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-border/50">
        {items.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-2.5 px-3.5 py-3 min-w-0",
              tone === "primary" && "bg-primary/[0.03]",
            )}
          >
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
              <p className="text-lg font-bold tabular-nums leading-none truncate">{value}</p>
              <p className="mt-0.5 text-[11px] font-medium text-muted-foreground truncate">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
