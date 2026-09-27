import Link from "next/link";
import { ArrowUpRight, Megaphone, Send, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    href: "/dashboard/send",
    icon: Send,
    title: "Send SMS",
    text: "One number or a list",
  },
  {
    href: "/dashboard/campaigns",
    icon: Megaphone,
    title: "Campaigns",
    text: "Schedule bulk sends",
  },
  {
    href: "/dashboard/wallet",
    icon: Wallet,
    title: "Wallet",
    text: "Top up & buy credits",
  },
];

export function QuickActions() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="grid sm:grid-cols-3">
        {actions.map(({ href, icon: Icon, title, text }, index) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30 sm:px-5",
              index < actions.length - 1 && "border-b border-border/50 sm:border-b-0 sm:border-r",
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 text-sm font-semibold">
                {title}
                <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{text}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
