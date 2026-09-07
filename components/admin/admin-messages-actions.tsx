"use client";

import { useFormStatus } from "react-dom";
import {
  adminCancelPendingSmsAction,
  adminClearFailedSmsAction,
  adminProcessPendingSmsAction,
  adminRetryFailedSmsAction,
} from "@/lib/actions/admin-operations";
import { Button } from "@/components/ui/button";
import { Loader2, Play, RefreshCw, Trash2, XCircle } from "lucide-react";

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

function CancelPendingSubmitButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" className="gap-1.5" disabled={pending}>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
      {pending ? "Cancelling…" : `Cancel pending (${count.toLocaleString()})`}
    </Button>
  );
}

function ClearFailedSubmitButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="sm"
      variant="outline"
      className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
      disabled={pending}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      {pending ? "Clearing…" : `Clear failed (${count.toLocaleString()})`}
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
      {pendingCount > 0 && (
        <form
          action={adminCancelPendingSmsAction}
          className="inline-flex"
          onSubmit={(e) => {
            if (
              !window.confirm(
                `Cancel ${pendingCount.toLocaleString()} pending message${pendingCount === 1 ? "" : "s"}? Each member will be refunded the credits that were charged for it. This cannot be undone.`,
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="limit" value="2000" />
          <input type="hidden" name="returnTo" value={returnTo} />
          {campaignId && <input type="hidden" name="campaignId" value={campaignId} />}
          <CancelPendingSubmitButton count={pendingCount} />
        </form>
      )}
      {failedCount > 0 && (
        <form
          action={adminClearFailedSmsAction}
          className="inline-flex"
          onSubmit={(e) => {
            if (
              !window.confirm(
                `Permanently delete ${failedCount.toLocaleString()} failed message${failedCount === 1 ? "" : "s"} from the log? This cannot be undone. (These were already refunded when they failed.)`,
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="returnTo" value={returnTo} />
          {campaignId && <input type="hidden" name="campaignId" value={campaignId} />}
          <ClearFailedSubmitButton count={failedCount} />
        </form>
      )}
    </div>
  );
}
