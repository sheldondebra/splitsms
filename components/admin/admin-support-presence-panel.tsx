"use client";

import { useFormStatus } from "react-dom";
import { updateSupportPresenceAction } from "@/lib/actions/admin-support-presence";
import {
  supportPresenceDotClass,
  type SupportPresence,
  type SupportPresenceStatus,
} from "@/lib/support/presence-meta";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const OPTIONS: SupportPresenceStatus[] = ["ONLINE", "OFFLINE", "BUSY"];

function SavePresenceButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending} className="gap-2">
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {pending ? "Saving…" : "Update status"}
    </Button>
  );
}

export function AdminSupportPresencePanel({
  presence,
  returnTo = "/admin/support",
}: {
  presence: SupportPresence;
  returnTo?: string;
}) {
  return (
    <form action={updateSupportPresenceAction} className="space-y-3">
      <input type="hidden" name="returnTo" value={returnTo} />
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((status) => (
          <label
            key={status}
            className={cn(
              "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              presence.status === status
                ? "border-primary/40 bg-primary/10 font-medium"
                : "border-border/60 hover:bg-muted/40",
            )}
          >
            <input
              type="radio"
              name="status"
              value={status}
              defaultChecked={presence.status === status}
              className="sr-only"
            />
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full shrink-0",
                supportPresenceDotClass(status),
              )}
            />
            {status === "ONLINE" ? "Online" : status === "OFFLINE" ? "Offline" : "Busy"}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Members see this live indicator in support chat. Current:{" "}
          <span className="font-medium text-foreground">{presence.label}</span>
          {presence.updatedAt
            ? ` · updated ${new Date(presence.updatedAt).toLocaleString()}`
            : ""}
        </p>
        <SavePresenceButton />
      </div>
    </form>
  );
}
