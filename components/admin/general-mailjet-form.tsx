"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveEmailOfficeConfigAction } from "@/lib/actions/admin-general";
import type { EmailOfficePublic } from "@/lib/email/office-config";
import type { EmailProvider } from "@/lib/email/config";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

type GeneralEmailFormProps = {
  stored: EmailOfficePublic;
  envMailjetConfigured: boolean;
  envSmtpConfigured: boolean;
  envResendConfigured?: boolean;
  senderSavedInDashboard: boolean;
};

const PROVIDERS: { id: EmailProvider; label: string; hint: string }[] = [
  { id: "resend", label: "Resend", hint: "API key" },
  { id: "mailjet", label: "Mailjet", hint: "API keys" },
  { id: "smtp", label: "SMTP", hint: "Your server" },
];

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="gap-2" disabled={pending}>
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
  const [provider, setProvider] = useState<EmailProvider>(stored.provider);

  return (
    <form
      key={stored.updatedAt ?? "default"}
      action={saveEmailOfficeConfigAction}
      className="space-y-6"
    >
      <section className="space-y-3">
        <div>
          <p className="text-sm font-semibold">Delivery provider</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Only the selected provider is used. Other credentials stay saved.
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {PROVIDERS.map((item) => (
            <label
              key={item.id}
              className={cn(
                "flex cursor-pointer flex-col gap-0.5 rounded-xl border px-3 py-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50",
                provider === item.id
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/70 bg-muted/15 hover:border-border hover:bg-muted/30",
              )}
            >
              <input
                type="radio"
                name="provider"
                value={item.id}
                checked={provider === item.id}
                onChange={() => setProvider(item.id)}
                className="sr-only"
              />
              <span className="text-sm font-medium">{item.label}</span>
              <span className="text-[11px] text-muted-foreground">{item.hint}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div>
          <p className="text-sm font-semibold">Sender identity</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Shown on OTP codes, receipts, support mail, and campaigns.
            {senderSavedInDashboard ? " Saved in the dashboard." : " Using the site default until you save."}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fromEmail">From email</Label>
            <Input
              id="fromEmail"
              name="fromEmail"
              type="email"
              required
              defaultValue={stored.fromEmail}
              placeholder="noreply@yourdomain.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromName">From name</Label>
            <Input
              id="fromName"
              name="fromName"
              type="text"
              required
              defaultValue={stored.fromName}
              placeholder="SplitSMS"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4">
        <div>
          <p className="text-sm font-semibold">Email header image</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Optional full-width image. Public HTTPS URL, about 1120px wide.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="headerImageUrl">Image URL</Label>
          <Input
            id="headerImageUrl"
            name="headerImageUrl"
            type="url"
            defaultValue={stored.headerImageUrl}
            placeholder="https://www.splitsms.com/email-header.png"
          />
        </div>
        <div className="space-y-2">
          <Label>Image position</Label>
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="headerImagePosition"
                value="above"
                defaultChecked={stored.headerImagePosition !== "below"}
                className="h-4 w-4 accent-primary"
              />
              Above headline
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
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
              className="block max-h-40 w-full object-cover"
            />
          </div>
        ) : null}
      </section>

      <section
        className={cn(
          "space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4",
          provider !== "resend" && "hidden",
        )}
      >
        <div>
          <p className="text-sm font-semibold">Resend API</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Leave blank to keep the key that is already saved.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="resendApiKey">API key</Label>
          <Input
            id="resendApiKey"
            name="resendApiKey"
            type="password"
            placeholder={stored.hasResendApiKey ? "Saved — leave blank to keep" : "re_xxxxxxxx"}
            autoComplete="off"
          />
        </div>
      </section>

      <section
        className={cn(
          "space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4",
          provider !== "mailjet" && "hidden",
        )}
      >
        <div>
          <p className="text-sm font-semibold">Mailjet API</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Leave keys blank to keep existing values.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API key</Label>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              placeholder={stored.hasApiKey ? "Saved — leave blank to keep" : "Mailjet public API key"}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiSecret">API secret</Label>
            <Input
              id="apiSecret"
              name="apiSecret"
              type="password"
              placeholder={
                stored.hasApiSecret ? "Saved — leave blank to keep" : "Mailjet secret key"
              }
              autoComplete="off"
            />
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="sandbox"
            defaultChecked={stored.sandbox}
            className="h-4 w-4 rounded accent-primary"
          />
          Sandbox mode (no real delivery)
        </label>
      </section>
      {provider !== "mailjet" && stored.sandbox ? (
        <input type="hidden" name="sandbox" value="on" />
      ) : null}

      <section
        className={cn(
          "space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4",
          provider !== "smtp" && "hidden",
        )}
      >
        <div>
          <p className="text-sm font-semibold">SMTP server</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Typical ports: 587 (STARTTLS) or 465 (SSL).
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="smtpHost">SMTP host</Label>
            <Input
              id="smtpHost"
              name="smtpHost"
              type="text"
              defaultValue={stored.smtpHost}
              placeholder="smtp.gmail.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpPort">Port</Label>
            <Input
              id="smtpPort"
              name="smtpPort"
              type="number"
              min={1}
              max={65535}
              defaultValue={stored.smtpPort}
              placeholder="587"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtpUser">Username</Label>
            <Input
              id="smtpUser"
              name="smtpUser"
              type="text"
              defaultValue={stored.smtpUser}
              placeholder="user@yourdomain.com"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="smtpPassword">Password</Label>
            <Input
              id="smtpPassword"
              name="smtpPassword"
              type="password"
              placeholder={
                stored.hasSmtpPassword ? "Saved — leave blank to keep" : "SMTP password"
              }
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              {stored.hasSmtpPassword
                ? "A password is saved. Leave this blank unless you are changing it."
                : "Required for SMTP delivery."}
            </p>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="smtpSecure"
            defaultChecked={stored.smtpSecure}
            className="h-4 w-4 rounded accent-primary"
          />
          Use SSL/TLS (typically port 465)
        </label>
      </section>
      {provider !== "smtp" && stored.smtpSecure ? (
        <input type="hidden" name="smtpSecure" value="on" />
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
        <SaveButton />
        {envResendConfigured ? (
          <span className="text-[11px] text-muted-foreground">Resend .env key detected</span>
        ) : null}
        {envMailjetConfigured ? (
          <span className="text-[11px] text-muted-foreground">Mailjet .env keys detected</span>
        ) : null}
        {envSmtpConfigured ? (
          <span className="text-[11px] text-muted-foreground">SMTP .env vars detected</span>
        ) : null}
      </div>
    </form>
  );
}

/** @deprecated Use GeneralEmailForm */
export const GeneralMailjetForm = GeneralEmailForm;
