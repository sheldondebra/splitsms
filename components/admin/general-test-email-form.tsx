"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendTestEmailAction } from "@/lib/actions/admin-general";
import { Loader2, Mail } from "lucide-react";

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
          <Input
            id="testEmail"
            name="testEmail"
            type="email"
            placeholder="you@company.com"
            required
            disabled={!configured}
          />
        </div>
        <SendTestButton disabled={!configured} />
      </div>
    </form>
  );
}
