"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { sendTestEmailAction } from "@/lib/actions/admin-general";
import { Loader2, Mail } from "lucide-react";

const inputClassName =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 md:text-sm dark:bg-input/30";

function SendTestButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="gap-2 shrink-0" disabled={disabled || pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
      {pending ? "Sending…" : "Send test"}
    </Button>
  );
}

type GeneralTestEmailFormProps = {
  configured: boolean;
  fromEmail: string;
};

export function GeneralTestEmailForm({ configured, fromEmail }: GeneralTestEmailFormProps) {
  return (
    <form action={sendTestEmailAction} className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Sends a test message from <span className="font-mono text-foreground">{fromEmail}</span>.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1 space-y-2 min-w-0 max-w-md">
          <Label htmlFor="testEmail">Recipient email</Label>
          <input
            id="testEmail"
            name="testEmail"
            type="email"
            placeholder="you@company.com"
            required
            disabled={!configured}
            className={inputClassName}
          />
        </div>
        <SendTestButton disabled={!configured} />
      </div>
    </form>
  );
}
