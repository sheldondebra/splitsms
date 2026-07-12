"use client";

import { useFormStatus } from "react-dom";
import {
  adminProcessPendingSmsAction,
  adminRetryFailedSmsAction,
} from "@/lib/actions/admin-operations";
import { Button } from "@/components/ui/button";
import { Loader2, Play, RefreshCw } from "lucide-react";

function ProcessSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="default" className="gap-1.5" disabled={pending}>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
      {pending ? "Processing…" : "Process pending now"}
    </Button>
  );
}

function RetrySubmitButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" className="gap-1.5" disabled={pending}>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
      {pending ? "Retrying…" : `Retry failed (${count.toLocaleString()})`}
    </Button>
  );
}

export function AdminMessagesActions({
  pendingCount,
  failedCount,
  campaignId,
  returnTo = "/admin/messages",
}: {
  pendingCount: number;
  failedCount: number;
  campaignId?: string;
  returnTo?: string;
}) {
  if (pendingCount <= 0 && failedCount <= 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pendingCount > 0 && (
        <form action={adminProcessPendingSmsAction} className="inline-flex">
          <input type="hidden" name="limit" value="80" />
          <input type="hidden" name="rounds" value="3" />
          <input type="hidden" name="returnTo" value={returnTo} />
          <ProcessSubmitButton />
        </form>
      )}
      {failedCount > 0 && (
        <form action={adminRetryFailedSmsAction} className="inline-flex">
          <input type="hidden" name="limit" value="200" />
          <input type="hidden" name="returnTo" value={returnTo} />
          {campaignId && <input type="hidden" name="campaignId" value={campaignId} />}
          <RetrySubmitButton count={failedCount} />
        </form>
      )}
    </div>
  );
}
