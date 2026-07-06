"use client";

import { cn } from "@/lib/utils";
import type { SenderIdActionStep } from "@/lib/actions/admin-sender-ids";
import { AlertCircle, CheckCircle2, Circle, Loader2, MinusCircle } from "lucide-react";

function StepIcon({ status }: { status: SenderIdActionStep["status"] }) {
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  if (status === "done") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "error") return <AlertCircle className="h-4 w-4 text-destructive" />;
  if (status === "skipped") return <MinusCircle className="h-4 w-4 text-muted-foreground" />;
  return <Circle className="h-4 w-4 text-muted-foreground/50" />;
}

export function SenderIdActionProgress({
  steps,
  className,
}: {
  steps: SenderIdActionStep[];
  className?: string;
}) {
  if (steps.length === 0) return null;

  return (
    <ul className={cn("space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3", className)}>
      {steps.map((step) => (
        <li key={`${step.id}-${step.label}`} className="flex items-start gap-2.5 text-xs">
          <StepIcon status={step.status} />
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "font-medium",
                step.status === "error" && "text-destructive",
                step.status === "done" && "text-emerald-700 dark:text-emerald-300",
              )}
            >
              {step.label}
            </p>
            {step.detail && (
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{step.detail}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
