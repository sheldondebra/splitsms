"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { saveEmailOfficeConfigAction } from "@/lib/actions/admin-general";
import type { EmailOfficeStored } from "@/lib/email/office-config";
import { maskTailSecret } from "@/lib/mask-secret";
import { Loader2, Save } from "lucide-react";

type GeneralEmailFormProps = {
  stored: EmailOfficeStored;
  envMailjetConfigured: boolean;
  envSmtpConfigured: boolean;
  envResendConfigured?: boolean;
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

export function GeneralEmailForm({
  stored,
  envMailjetConfigured,
  envSmtpConfigured,
  envResendConfigured = false,
  senderSavedInDashboard,
}: GeneralEmailFormProps) {
  return (
    <form
      key={stored.updatedAt ?? "default"}
      action={saveEmailOfficeConfigAction}
      className="space-y-6"
    >
      <section className="space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4">
        <div>
          <p className="text-sm font-semibold">Delivery provider</p>
          <p className="text-xs text-muted-foreground mt-1">
            Choose Resend, Mailjet, or your own SMTP server.
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="provider"
              value="resend"
              defaultChecked={stored.provider === "resend"}
              className="h-4 w-4 accent-primary"
            />
            Resend
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="provider"
              value="mailjet"
              defaultChecked={stored.provider === "mailjet"}
              className="h-4 w-4 accent-primary"
            />
            Mailjet API
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="provider"
              value="smtp"
              defaultChecked={stored.provider === "smtp"}
              className="h-4 w-4 accent-primary"
            />
            SMTP
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div>
          <p className="text-sm font-semibold">Sender identity</p>
          <p className="text-xs text-muted-foreground mt-1">
            This address appears on OTP codes, receipts, support emails, and marketing messages.
            {senderSavedInDashboard ? " Saved in dashboard." : " Using site default until saved."}
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-200 mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            Verify the From domain in your provider (Resend / Mailjet). For SMTP, the From domain’s
            SPF must authorize your SMTP host or Gmail may silently drop messages.
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
          <p className="text-sm font-semibold">Email header image</p>
          <p className="text-xs text-muted-foreground mt-1">
            Optional full-width image for all transactional and marketing emails. Use a
            public HTTPS URL (recommended width 1120px).
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="headerImageUrl">Image URL</Label>
          <input
            id="headerImageUrl"
            name="headerImageUrl"
            type="url"
            defaultValue={stored.headerImageUrl}
            placeholder="https://www.splitsms.com/email-header.png"
            className={inputClassName}
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to remove the header image.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Image position</Label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="headerImagePosition"
                value="above"
                defaultChecked={stored.headerImagePosition !== "below"}
                className="h-4 w-4 accent-primary"
              />
              Above headline
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="headerImagePosition"
                value="below"
                defaultChecked={stored.headerImagePosition === "below"}
                className="h-4 w-4 accent-primary"
              />
              Below headline
            </label>
          </div>
        </div>
        {stored.headerImageUrl ? (
          <div className="overflow-hidden rounded-lg border border-border/60 bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={stored.headerImageUrl}
              alt="Email header preview"
              className="block w-full max-h-40 object-cover"
            />
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4">
        <div>
          <p className="text-sm font-semibold">Resend API</p>
          <p className="text-xs text-muted-foreground mt-1">
            Used when Resend is selected. Leave blank to keep the existing key.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="resendApiKey">API key</Label>
          <input
            id="resendApiKey"
            name="resendApiKey"
            type="password"
            placeholder={
              stored.resendApiKey
                ? maskTailSecret(stored.resendApiKey)
                : "re_xxxxxxxx"
            }
            autoComplete="off"
            className={inputClassName}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4">
        <div>
          <p className="text-sm font-semibold">Mailjet API</p>
          <p className="text-xs text-muted-foreground mt-1">
            Used when Mailjet is selected. Leave keys blank to keep existing values.
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

      <section className="space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4">
        <div>
          <p className="text-sm font-semibold">SMTP server</p>
          <p className="text-xs text-muted-foreground mt-1">
            Used when SMTP is selected. Common ports: 587 (STARTTLS) or 465 (SSL).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="smtpHost">SMTP host</Label>
            <input
              id="smtpHost"
              name="smtpHost"
              type="text"
              defaultValue={stored.smtpHost}
              placeholder="smtp.gmail.com"
              className={inputClassName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpPort">Port</Label>
            <input
              id="smtpPort"
              name="smtpPort"
              type="number"
              min={1}
              max={65535}
              defaultValue={stored.smtpPort}
              placeholder="587"
              className={inputClassName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpUser">Username</Label>
            <input
              id="smtpUser"
              name="smtpUser"
              type="text"
              defaultValue={stored.smtpUser}
              placeholder="user@yourdomain.com"
              autoComplete="off"
              className={inputClassName}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="smtpPassword">Password</Label>
            <input
              id="smtpPassword"
              name="smtpPassword"
              type="password"
              placeholder={
                stored.smtpPassword
                  ? maskTailSecret(stored.smtpPassword)
                  : "SMTP password or app password"
              }
              autoComplete="new-password"
              className={inputClassName}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            name="smtpSecure"
            defaultChecked={stored.smtpSecure}
            className="h-4 w-4 rounded accent-primary"
          />
          Use SSL/TLS (typically port 465)
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <SaveButton />
        {envResendConfigured && (
          <span className="text-[11px] text-muted-foreground">Resend .env key detected</span>
        )}
        {envMailjetConfigured && (
          <span className="text-[11px] text-muted-foreground">Mailjet .env keys detected</span>
        )}
        {envSmtpConfigured && (
          <span className="text-[11px] text-muted-foreground">SMTP .env vars detected</span>
        )}
      </div>
    </form>
  );
}

/** @deprecated Use GeneralEmailForm */
export const GeneralMailjetForm = GeneralEmailForm;
