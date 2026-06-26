import { Users, UsersRound, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

type ContactsStatsProps = {
  total: number;
  groupCount: number;
  countryCount: number;
};

export function ContactsStats({ total, groupCount, countryCount }: ContactsStatsProps) {
  const items = [
    {
      label: "Total contacts",
      value: total.toLocaleString(),
      icon: Users,
      tone: "primary" as const,
    },
    {
      label: "Groups",
      value: groupCount.toLocaleString(),
      icon: UsersRound,
      tone: "neutral" as const,
    },
    {
      label: "Countries",
      value: countryCount.toLocaleString(),
      icon: Globe,
      tone: "neutral" as const,
    },
  ];

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="grid grid-cols-3 divide-x divide-border/50">
        {items.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-2.5 px-3.5 py-3",
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
              <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
              <p className="mt-0.5 text-[11px] font-medium text-muted-foreground truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
