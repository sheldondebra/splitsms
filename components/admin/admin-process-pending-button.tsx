"use client";

import { useFormStatus } from "react-dom";
import { adminProcessPendingSmsAction } from "@/lib/actions/admin-operations";
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" className="gap-1.5 w-full" disabled={pending}>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
      {pending ? "Processing…" : "Process pending now"}
    </Button>
  );
}

export function AdminProcessPendingButton({
  pendingCount,
  limit = 50,
  rounds = 3,
  returnTo = "/admin/operations",
}: {
  pendingCount: number;
  limit?: number;
  rounds?: number;
  returnTo?: string;
}) {
  if (pendingCount <= 0) return null;

  return (
    <form action={adminProcessPendingSmsAction} className="mt-3 pt-3 border-t border-border/50">
      <input type="hidden" name="limit" value={String(limit)} />
      <input type="hidden" name="rounds" value={String(rounds)} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <SubmitButton />
      <p className="text-[10px] text-muted-foreground mt-1.5 leading-snug">
        Sends up to {limit * rounds} queued message{limit * rounds === 1 ? "" : "s"} immediately (bypasses worker delay).
      </p>
    </form>
  );
}
