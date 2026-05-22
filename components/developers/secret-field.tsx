"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { CopyButton } from "@/components/developers/copy-button";
import { cn } from "@/lib/utils";

export function SecretField({
  value,
  maskedDisplay,
  className,
}: {
  value: string;
  maskedDisplay?: string;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const shown = visible ? value : (maskedDisplay ?? maskSecret(value));

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border bg-muted/50 px-3 py-2.5 font-mono text-xs sm:text-sm",
        className,
      )}
    >
      <code className="flex-1 break-all select-all">{shown}</code>
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
        title={visible ? "Hide" : "Show"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <CopyButton value={value} size="icon" />
    </div>
  );
}

export function maskSecret(key: string) {
  if (key.length <= 14) return "••••••••••••••••";
  return `${key.slice(0, 14)}${"•".repeat(24)}`;
}
