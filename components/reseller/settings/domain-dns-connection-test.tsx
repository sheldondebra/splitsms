"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Unplug } from "lucide-react";
import { testResellerDomainConnectionAction } from "@/lib/actions/reseller-settings-payouts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DomainDnsConnectionTest({ domain }: { domain: string }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "connected" | "failed">("idle");
  const [message, setMessage] = useState<string | null>(null);

  function runTest() {
    startTransition(async () => {
      const result = await testResellerDomainConnectionAction(domain);
      if (result.ok) {
        setStatus("connected");
        setMessage(result.detail);
      } else {
        setStatus("failed");
        setMessage(result.error);
      }
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Connection status</p>
          <p className="text-xs text-muted-foreground">
            Verify that DNS for this hostname points at SplitSMS.
          </p>
        </div>
        {status === "connected" ? (
          <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
            <CheckCircle2 className="size-3" />
            Connected
          </Badge>
        ) : status === "failed" ? (
          <Badge variant="destructive" className="gap-1">
            <Unplug className="size-3" />
            Not connected
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Not tested
          </Badge>
        )}
      </div>

      {message ? (
        <p
          className={cn(
            "text-xs leading-relaxed",
            status === "connected" ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
            status === "failed" && "text-destructive",
          )}
        >
          {message}
        </p>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending || !domain.trim()}
        onClick={runTest}
      >
        {pending ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Testing…
          </>
        ) : (
          "Test connection"
        )}
      </Button>
    </div>
  );
}
