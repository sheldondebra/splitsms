import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type SetupStripProps = {
  phoneVerified: boolean;
  hasBalance: boolean;
  hasSenderId: boolean;
  hasSentMessage: boolean;
};

export function SetupStrip(props: SetupStripProps) {
  const steps = [
    { done: props.phoneVerified, label: "Verify phone", href: "/dashboard/settings" },
    { done: props.hasBalance, label: "Add credits", href: "/dashboard/wallet" },
    { done: props.hasSenderId, label: "Approve Sender ID", href: "/dashboard/sender-ids" },
    { done: props.hasSentMessage, label: "Send first SMS", href: "/dashboard/send" },
  ];

  if (steps.every((s) => s.done)) return null;

  const doneCount = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done)!;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border/50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p className="text-sm font-semibold">Finish account setup</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {doneCount} of {steps.length} done · next: {next.label}
          </p>
        </div>
        <Link
          href={next.href}
          className="inline-flex h-9 items-center gap-1.5 self-start rounded-xl bg-primary px-3.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Continue
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {steps.map((step, index) => (
          <Link
            key={step.label}
            href={step.href}
            className={cn(
              "flex items-center gap-2.5 border-b border-border/50 p-3.5 transition-colors hover:bg-muted/30 sm:border-b-0",
              index % 2 === 0 && "border-r",
              index < 3 && "sm:border-r",
              !step.done && step.label === next.label && "bg-primary/[0.03]",
            )}
          >
            {step.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Circle
                className={cn(
                  "h-4 w-4 shrink-0",
                  step.label === next.label ? "text-primary" : "text-muted-foreground/50",
                )}
              />
            )}
            <span
              className={cn(
                "text-sm",
                step.done
                  ? "text-muted-foreground line-through decoration-border"
                  : step.label === next.label
                    ? "font-semibold"
                    : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
