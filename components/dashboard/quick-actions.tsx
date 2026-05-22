import Link from "next/link";
import { Send, Wallet, BadgeCheck, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  {
    href: "/dashboard/send",
    label: "Send SMS",
    icon: Send,
    className: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20",
  },
  {
    href: "/dashboard/sender-ids",
    label: "Sender ID",
    icon: BadgeCheck,
    className: "bg-foreground text-background hover:bg-foreground/90",
  },
  {
    href: "/dashboard/wallet",
    label: "Add Money",
    icon: Wallet,
    className: "bg-card border border-border hover:bg-muted/60 shadow-sm",
  },
  {
    href: "/dashboard/contacts",
    label: "Contacts",
    icon: Users,
    className: "bg-card border border-border hover:bg-muted/60 shadow-sm",
  },
  {
    href: "/dashboard/reports",
    label: "Results",
    icon: BarChart3,
    className: "bg-card border border-border hover:bg-muted/60 shadow-sm",
  },
];

export function QuickActions() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Quick actions
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {actions.map(({ href, label, icon: Icon, className }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl p-4 text-center text-sm font-semibold transition-all active:scale-[0.98]",
              className,
            )}
          >
            <Icon className="h-6 w-6 shrink-0" strokeWidth={2} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
