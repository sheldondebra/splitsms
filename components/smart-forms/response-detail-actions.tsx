"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  deleteResponseAction,
  markResponseReviewedAction,
  saveResponseContactAction,
} from "@/lib/actions/smart-form-responses";
import { retryRespondentSmsAction } from "@/lib/actions/smart-form-automation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RefreshCw, Trash2, UserPlus } from "lucide-react";

export function ResponseDetailActions({
  formId,
  responseId,
  reviewed,
  contactSaveStatus,
  smsStatus,
}: {
  formId: string;
  responseId: string;
  reviewed: boolean;
  contactSaveStatus: string;
  smsStatus: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {!reviewed ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 gap-1.5"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await markResponseReviewedAction(formId, responseId);
              if (!result.ok) toast.error(result.error);
              else toast.success("Marked as reviewed");
            })
          }
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Mark reviewed
        </Button>
      ) : null}
      {contactSaveStatus !== "SAVED" ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 gap-1.5"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await saveResponseContactAction(formId, responseId);
              if (!result.ok) toast.error(result.error);
              else toast.success("Contact saved");
            })
          }
        >
          <UserPlus className="h-3.5 w-3.5" />
          Save as contact
        </Button>
      ) : null}
      {smsStatus === "FAILED" ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 gap-1.5"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await retryRespondentSmsAction(formId, responseId);
              if (!result.ok) toast.error(result.error);
              else toast.success("SMS queued for delivery");
            })
          }
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry SMS
        </Button>
      ) : null}
      <form action={deleteResponseAction}>
        <input type="hidden" name="formId" value={formId} />
        <input type="hidden" name="responseId" value={responseId} />
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="h-9 gap-1.5 text-destructive hover:text-destructive"
          disabled={isPending}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </form>
    </div>
  );
}
