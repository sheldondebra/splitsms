"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { saveEmailOfficeConfigAction } from "@/lib/actions/admin-general";
import type { EmailOfficePublic } from "@/lib/email/office-config";
import type { EmailProvider } from "@/lib/email/config";
import { Check, KeyRound, Loader2, Lock, Save, Server, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmailBrandingEditor } from "@/components/admin/email-branding-editor";

type GeneralEmailFormProps = {
  stored: EmailOfficePublic;
  envMailjetConfigured: boolean;
  envSmtpConfigured: boolean;
  envResendConfigured?: boolean;
  senderSavedInDashboard: boolean;
};

function providerReady(id: EmailProvider, stored: EmailOfficePublic) {
  if (id === "smtp") return Boolean(stored.smtpHost && stored.smtpUser && stored.hasSmtpPassword);
  if (id === "resend") return stored.hasResendApiKey;
  return stored.hasApiKey && stored.hasApiSecret;
}

const PROVIDERS: {
  id: EmailProvider;
  label: string;
  description: string;
}[] = [
  {
    id: "smtp",
    label: "SMTP",
    description: "Send through your mail server (recommended)",
  },
  {
    id: "resend",
    label: "Resend",
    description: "API delivery — requires a verified domain",
  },
  {
    id: "mailjet",
    label: "Mailjet",
    description: "API keys for transactional mail",
  },
];

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="gap-2" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? "Saving…" : label}
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
  const dirtyDefault = provider !== stored.provider;

  const readiness = useMemo(
    () =>
      Object.fromEntries(PROVIDERS.map((p) => [p.id, providerReady(p.id, stored)])) as Record<
        EmailProvider,
        boolean
      >,
    [stored],
  );

  return (
    <form
      key={stored.updatedAt ?? "default"}
      action={saveEmailOfficeConfigAction}
      className="space-y-8"
    >
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Default delivery provider</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xl">
              Choose how SplitSMS sends OTP, receipts, support mail, and bulk email. Only the default
              is used — other credentials stay saved for later.
            </p>
          </div>
          {dirtyDefault ? (
            <Badge variant="secondary" className="gap-1">
              Unsaved change
            </Badge>
          ) : (
            <Badge className="gap-1 bg-emerald-600/90 text-white hover:bg-emerald-600/90">
              <Check className="h-3 w-3" />
              Default: {PROVIDERS.find((p) => p.id === stored.provider)?.label}
            </Badge>
          )}
        </div>

        <input type="hidden" name="provider" value={provider} />
        <div className="grid gap-3 sm:grid-cols-3">
          {PROVIDERS.map((item) => {
            const selected = provider === item.id;
            const isLiveDefault = stored.provider === item.id && !dirtyDefault;
            const ready = readiness[item.id];
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setProvider(item.id)}
                className={cn(
                  "relative flex flex-col items-start gap-2 rounded-xl border px-4 py-4 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border/70 bg-background hover:border-border hover:bg-muted/30",
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    {item.id === "smtp" ? <Server className="h-4 w-4 text-primary" /> : null}
                    {item.label}
                  </span>
                  {isLiveDefault ? (
                    <span className="rounded-md bg-emerald-600/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                      Default
                    </span>
                  ) : selected ? (
                    <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Set default
                    </span>
                  ) : null}
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                <p
                  className={cn(
                    "text-[11px] font-medium",
                    ready ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300",
                  )}
                >
                  {ready ? "Credentials ready" : "Needs setup below"}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4 border-t border-border/60 pt-6">
        <div>
          <p className="text-sm font-semibold">Sender identity</p>
          <p className="mt-1 text-xs text-muted-foreground">
            From address shown on every outbound message.
            {senderSavedInDashboard
              ? " Saved in the dashboard."
              : " Using the site default until you save."}
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

      <section
        className={cn(
          "space-y-4 border-t border-border/60 pt-6",
          provider !== "smtp" && "hidden",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
              <Server className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">SMTP server</p>
              <p className="mt-1 max-w-lg text-xs text-muted-foreground">
                Connect to your mail host. Port 587 uses STARTTLS; port 465 uses SSL/TLS.
              </p>
            </div>
          </div>
          {stored.hasSmtpPassword ? (
            <Badge
              variant="secondary"
              className="gap-1 bg-emerald-600/10 text-emerald-800 dark:text-emerald-300"
            >
              <KeyRound className="h-3 w-3" />
              Password saved
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 text-amber-800 dark:text-amber-200">
              <KeyRound className="h-3 w-3" />
              Password needed
            </Badge>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-border/70">
          <div className="space-y-4 border-b border-border/60 bg-muted/15 px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Connection
            </p>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7.5rem]">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">Host</Label>
                <Input
                  id="smtpHost"
                  name="smtpHost"
                  type="text"
                  defaultValue={stored.smtpHost}
                  placeholder="mail.yourdomain.com"
                  className="font-mono text-sm"
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
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Encryption</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 bg-background px-3 py-3 transition-colors hover:bg-muted/30 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="smtpSecure"
                    value="off"
                    disabled={provider !== "smtp"}
                    defaultChecked={
                      stored.smtpPort === 465
                        ? false
                        : stored.smtpPort === 587
                          ? true
                          : !stored.smtpSecure
                    }
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      STARTTLS
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      Usual for port 587
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 bg-background px-3 py-3 transition-colors hover:bg-muted/30 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="smtpSecure"
                    value="on"
                    disabled={provider !== "smtp"}
                    defaultChecked={
                      stored.smtpPort === 465
                        ? true
                        : stored.smtpPort === 587
                          ? false
                          : stored.smtpSecure
                    }
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      <Lock className="h-3.5 w-3.5 text-primary" />
                      SSL / TLS
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      Usual for port 465
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-background px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Credentials
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="space-y-2">
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
              </div>
            </div>
          </div>
        </div>
      </section>
      {provider !== "smtp" && stored.smtpSecure ? (
        <input type="hidden" name="smtpSecure" value="on" />
      ) : null}

      <section
        className={cn(
          "space-y-4 border-t border-border/60 pt-6",
          provider !== "resend" && "hidden",
        )}
      >
        <div>
          <p className="text-sm font-semibold">Resend API</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Leave blank to keep the key that is already saved. Domain must be verified in Resend.
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
          "space-y-4 border-t border-border/60 pt-6",
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

      <EmailBrandingEditor stored={stored} />

      <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-5">
        <SaveButton
          label={
            dirtyDefault
              ? `Set ${PROVIDERS.find((p) => p.id === provider)?.label ?? "provider"} as default`
              : "Save settings"
          }
        />
        {envSmtpConfigured || envResendConfigured || envMailjetConfigured ? (
          <p className="text-[11px] text-muted-foreground">
            {[
              envSmtpConfigured ? "SMTP .env" : null,
              envResendConfigured ? "Resend .env" : null,
              envMailjetConfigured ? "Mailjet .env" : null,
            ]
              .filter(Boolean)
              .join(" · ")}{" "}
            also available as fallback
          </p>
        ) : null}
      </div>
    </form>
  );
}

/** @deprecated Use GeneralEmailForm */
export const GeneralMailjetForm = GeneralEmailForm;
