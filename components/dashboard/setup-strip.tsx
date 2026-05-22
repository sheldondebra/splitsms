import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type SetupStripProps = {
  phoneVerified: boolean;
  hasBalance: boolean;
  hasSenderId: boolean;
  hasSentMessage: boolean;
};

export function SetupStrip(props: SetupStripProps) {
  const steps = [
    { done: props.phoneVerified, label: "Verify", href: "/dashboard/settings" },
    { done: props.hasBalance, label: "Top up", href: "/dashboard/wallet" },
    { done: props.hasSenderId, label: "Sender ID", href: "/dashboard/sender-ids" },
    { done: props.hasSentMessage, label: "Send SMS", href: "/dashboard/send" },
  ];

  if (steps.every((s) => s.done)) return null;

  const next = steps.find((s) => !s.done)!;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {steps.map((step) => (
        <Link
          key={step.label}
          href={step.href}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 border transition-colors",
            step.done
              ? "border-border/60 text-muted-foreground bg-muted/30"
              : step.label === next.label
                ? "border-primary/40 bg-primary/10 text-foreground font-medium"
                : "border-border/50 text-muted-foreground hover:bg-muted/40",
          )}
        >
          {step.done && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
          {step.label}
        </Link>
      ))}
    </div>
  );
}
