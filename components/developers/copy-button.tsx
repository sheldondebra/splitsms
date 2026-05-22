"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  label = "Copy",
  className,
  size = "sm",
}: {
  value: string;
  label?: string;
  className?: string;
  size?: "sm" | "default" | "icon";
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (size === "icon") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8 shrink-0", className)}
        onClick={copy}
        title={copied ? "Copied" : label}
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={size === "sm" ? "sm" : "default"}
      className={cn("gap-1.5", className)}
      onClick={copy}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </Button>
  );
}
