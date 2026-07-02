"use client";

import { useFormStatus } from "react-dom";
import { adminBulkMembersAction } from "@/lib/actions/admin-members-bulk";
import {
  AdminOutreachComposeFields,
  OutreachComposeHiddenFields,
  useOutreachCompose,
} from "@/components/admin/admin-outreach-compose";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Send, Users } from "lucide-react";

type Recipient = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
};

function SendBulkButton({
  count,
  disabled,
}: {
  count: number;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending} className="gap-1.5 min-w-[140px]">
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Sending…
        </>
      ) : (
        <>
          <Send className="h-4 w-4" />
          Send to {count}
        </>
      )}
    </Button>
  );
}

export function AdminMembersBulkMessageDialog({
  open,
  onOpenChange,
  recipients,
  returnTo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: Recipient[];
  returnTo: string;
}) {
  const compose = useOutreachCompose();

  const withPhone = recipients.filter((r) => r.phone?.trim()).length;
  const withEmail = recipients.filter((r) => r.email?.trim()).length;
  const namePreview =
    recipients.length <= 3
      ? recipients.map((r) => r.fullName).join(", ")
      : `${recipients
          .slice(0, 2)
          .map((r) => r.fullName)
          .join(", ")} +${recipients.length - 2} more`;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) compose.applyTemplate(compose.templateId);
      }}
    >
      <DialogContent className="flex max-h-[min(90vh,720px)] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <div className="shrink-0 border-b border-border/60 bg-muted/15 px-5 pt-5 pb-4">
          <DialogHeader className="text-left gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Send className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <DialogTitle className="text-lg">Bulk outreach</DialogTitle>
                <DialogDescription className="leading-relaxed">
                  Send personalized SMS and email to selected members.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 rounded-xl border border-border/60 bg-card px-3.5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="gap-1 rounded-full bg-primary/15 text-primary hover:bg-primary/15 border-0">
                <Users className="h-3 w-3" />
                {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
              </Badge>
              {compose.sendSms && (
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {withPhone} with phone
                </Badge>
              )}
              {compose.sendEmail && (
                <Badge variant="outline" className="rounded-full text-[10px]">
                  {withEmail} with email
                </Badge>
              )}
            </div>
            <p className="mt-2 truncate text-xs text-muted-foreground">{namePreview}</p>
          </div>
        </div>

        <form
          action={adminBulkMembersAction}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <input type="hidden" name="action" value="send_message" />
          <input type="hidden" name="userIds" value={recipients.map((r) => r.id).join(",")} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <OutreachComposeHiddenFields compose={compose} />

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <AdminOutreachComposeFields
              compose={compose}
              idPrefix="bulk-dialog"
              personalizedHint="personalized per member"
            />
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 rounded-none border-t border-border/60 bg-muted/20 px-5 py-4 sm:justify-between">
            <p className="hidden text-[11px] text-muted-foreground sm:block">
              Names and links are filled in automatically for each member.
            </p>
            <div className="flex w-full flex-col-reverse gap-2 sm:ml-auto sm:w-auto sm:flex-row">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <SendBulkButton count={recipients.length} disabled={!compose.canSubmit} />
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
