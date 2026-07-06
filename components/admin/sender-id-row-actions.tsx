"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  resubmitSenderProvidersJsonAction,
  submitSenderToProvidersJsonAction,
  syncSenderProvidersJsonAction,
} from "@/lib/actions/admin-sender-ids";
import { SenderIdActionProgress } from "@/components/admin/sender-id-action-progress";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, RotateCcw, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubmitToCarriersButton({
  senderId,
  purpose,
  className,
}: {
  senderId: string;
  purpose: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className={cn("gap-1.5", className)}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const toastId = toast.loading("Submitting to carriers…");
          const result = await submitSenderToProvidersJsonAction({ id: senderId, purpose });
          if (!result.ok) {
            toast.error("Submit failed", { id: toastId, description: result.message });
            return;
          }
          toast.success("Submitted", {
            id: toastId,
            description: result.message,
          });
          router.refresh();
        });
      }}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
      Submit to carriers
    </Button>
  );
}

export function SyncCarrierButton({
  senderId,
  className,
}: {
  senderId: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("gap-1", className)}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const toastId = toast.loading("Syncing carrier status…");
          const result = await syncSenderProvidersJsonAction({ senderId });
          if (!result.ok) {
            toast.error("Sync failed", { id: toastId, description: result.message });
            return;
          }
          toast.success("Synced", { id: toastId, description: result.message });
          router.refresh();
        });
      }}
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
      Sync
    </Button>
  );
}

export function ResubmitCarrierButton({
  senderId,
  label,
  className,
}: {
  senderId: string;
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("gap-1", className)}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const toastId = toast.loading("Re-submitting to carriers…");
          const result = await resubmitSenderProvidersJsonAction({ senderId });
          if (!result.ok) {
            toast.error("Re-submit failed", { id: toastId, description: result.message });
            return;
          }
          toast.success("Re-submitted", { id: toastId, description: result.message });
          router.refresh();
        });
      }}
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
      {label}
    </Button>
  );
}

export function CarrierActionProgressHint({
  visible,
  label = "Contacting carriers…",
}: {
  visible: boolean;
  label?: string;
}) {
  if (!visible) return null;
  return (
    <SenderIdActionProgress
      steps={[{ id: "working", label, status: "running" }]}
      className="mt-2"
    />
  );
}
