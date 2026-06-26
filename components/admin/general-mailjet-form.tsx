"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { saveMailjetOfficeConfigAction } from "@/lib/actions/admin-general";
import type { MailjetOfficeStored } from "@/lib/email/office-config";
import { maskTailSecret } from "@/lib/mask-secret";
import { Loader2, Save } from "lucide-react";

type GeneralMailjetFormProps = {
  stored: MailjetOfficeStored;
  envConfigured: boolean;
  senderSavedInDashboard: boolean;
};

const inputClassName =
  "h-10 w-full min-w-0 rounded-lg border border-input bg-background px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 md:text-sm dark:bg-input/30";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" className="gap-2" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? "Saving…" : "Save settings"}
    </Button>
  );
}

export function GeneralMailjetForm({
  stored,
  envConfigured,
  senderSavedInDashboard,
}: GeneralMailjetFormProps) {
  return (
    <form
      key={stored.updatedAt ?? "default"}
      action={saveMailjetOfficeConfigAction}
      className="space-y-6"
    >
      <section className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div>
          <p className="text-sm font-semibold">Sender identity</p>
          <p className="text-xs text-muted-foreground mt-1">
            This address appears on OTP codes, receipts, support emails, and alerts.
            {senderSavedInDashboard ? " Saved in dashboard." : " Using site default until saved."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fromEmail">From email</Label>
            <input
              id="fromEmail"
              name="fromEmail"
              type="email"
              required
              defaultValue={stored.fromEmail}
              placeholder="noreply@yourdomain.com"
              className={inputClassName}
            />
            <p className="text-[11px] text-muted-foreground">
              Must be verified as a sender in Mailjet.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromName">From name</Label>
            <input
              id="fromName"
              name="fromName"
              type="text"
              required
              defaultValue={stored.fromName}
              placeholder="SplitSMS"
              className={inputClassName}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4">
        <div>
          <p className="text-sm font-semibold">Mailjet API</p>
          <p className="text-xs text-muted-foreground mt-1">
            Leave keys blank to keep existing values. Keys in .env are used until saved here.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API key</Label>
            <input
              id="apiKey"
              name="apiKey"
              type="password"
              placeholder={
                stored.apiKey ? maskTailSecret(stored.apiKey) : "Mailjet public API key"
              }
              autoComplete="off"
              className={inputClassName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiSecret">API secret</Label>
            <input
              id="apiSecret"
              name="apiSecret"
              type="password"
              placeholder={
                stored.apiSecret ? maskTailSecret(stored.apiSecret) : "Mailjet secret key"
              }
              autoComplete="off"
              className={inputClassName}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            name="sandbox"
            defaultChecked={stored.sandbox}
            className="h-4 w-4 rounded accent-primary"
          />
          Sandbox mode (no real delivery)
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <SaveButton />
        {envConfigured && (
          <span className="text-[11px] text-muted-foreground">.env keys detected</span>
        )}
      </div>
    </form>
  );
}
