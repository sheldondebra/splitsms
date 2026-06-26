"use client";

import { resendReceiptAction } from "@/lib/actions/admin-payments";
import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, Send, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type ReceiptChannel = "email" | "sms" | "both";

function ReceiptSubmitButton({
  label,
  icon: Icon,
}: {
  label: string;
  icon: typeof Mail;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      className="h-7 px-2 gap-1 text-xs"
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Icon className="h-3 w-3" />
      )}
      {pending ? "Sending…" : label}
    </Button>
  );
}

function ReceiptForm({
  paymentId,
  channel,
  label,
  icon,
}: {
  paymentId: string;
  channel: ReceiptChannel;
  label: string;
  icon: typeof Mail;
}) {
  return (
    <form action={resendReceiptAction}>
      <input type="hidden" name="paymentId" value={paymentId} />
      <input type="hidden" name="channel" value={channel} />
      <ReceiptSubmitButton label={label} icon={icon} />
    </form>
  );
}

export function AdminReceiptActions({
  paymentId,
  email,
  phone,
}: {
  paymentId: string;
  email?: string | null;
  phone?: string | null;
}) {
  const emailTarget = email?.trim() || null;
  const phoneTarget = phone?.trim() || null;

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-medium text-muted-foreground mr-0.5">Receipt</span>
        <ReceiptForm paymentId={paymentId} channel="email" label="Email" icon={Mail} />
        <ReceiptForm paymentId={paymentId} channel="sms" label="SMS" icon={MessageSquare} />
        <ReceiptForm paymentId={paymentId} channel="both" label="Both" icon={Send} />
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        {emailTarget ? (
          <span>
            Email: <span className="text-foreground/80">{emailTarget}</span>
          </span>
        ) : (
          <span className="text-amber-600/90">No email on file</span>
        )}
        {(emailTarget || phoneTarget) && phoneTarget && (
          <span className="mx-1.5 text-border">·</span>
        )}
        {phoneTarget && (
          <span>
            SMS: <span className="text-foreground/80 font-mono">{phoneTarget}</span>
          </span>
        )}
      </p>
    </div>
  );
}
