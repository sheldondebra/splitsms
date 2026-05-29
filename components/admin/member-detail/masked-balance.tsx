"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

function maskAmount(amount: number, currency: string) {
  const whole = Math.floor(amount);
  const masked = "•".repeat(Math.min(6, String(whole || 0).length || 4));
  return `${currency} ${masked}`;
}

export function MaskedBalance({
  amount,
  currency,
  className,
  size = "lg",
}: {
  amount: number;
  currency: string;
  className?: string;
  size?: "sm" | "lg";
}) {
  const [visible, setVisible] = useState(false);
  const formatted = `${currency} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "font-bold tabular-nums tracking-tight",
          size === "lg" ? "text-2xl md:text-3xl" : "text-lg",
        )}
      >
        {visible ? formatted : maskAmount(amount, currency)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 text-muted-foreground"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide balance" : "Show balance"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}
