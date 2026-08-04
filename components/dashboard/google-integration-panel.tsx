"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { GoogleConnectionPublic } from "@/lib/google/connection";
import { CheckCircle2, Link2, Loader2, Unplug } from "lucide-react";

const ERROR_COPY: Record<string, string> = {
  google_config: "Google OAuth is not configured on this server.",
  google_denied: "Google access was denied. Try again and allow SplitSMS.",
  google_failed: "Google connection failed. Please try again.",
  google_session: "Your session expired during connect. Sign in and retry.",
  google_reconnect:
    "Google did not return a refresh token. Click Connect again and accept all permissions.",
};

function scopeLabel(scope: string) {
  if (scope.includes("contacts.readonly")) return "Contacts (read)";
  if (scope.includes("/auth/contacts")) return "Contacts";
  if (scope.includes("spreadsheets")) return "Sheets";
  if (scope.includes("drive.readonly")) return "Drive (read)";
  if (scope.includes("forms.body")) return "Forms";
  if (scope.includes("forms.responses")) return "Form responses";
  if (scope === "openid" || scope === "email" || scope === "profile") {
    return scope;
  }
  return scope.replace("https://www.googleapis.com/auth/", "");
}

export function GoogleIntegrationPanel({
  connection,
  flash,
}: {
  connection: GoogleConnectionPublic | null;
  flash?: { connected?: boolean; disconnected?: boolean; error?: string };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [disconnectError, setDisconnectError] = useState<string | null>(null);

  function disconnect() {
    setDisconnectError(null);
    startTransition(async () => {
      const res = await fetch("/api/integrations/google/disconnect", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        setDisconnectError("Could not disconnect. Try again.");
        return;
      }
      router.refresh();
      router.replace("/dashboard/integrations/google?disconnected=1");
    });
  }

  return (
    <div className="space-y-4">
      {flash?.error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {ERROR_COPY[flash.error] ?? "Something went wrong connecting Google."}
        </p>
      )}
      {flash?.connected && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Google account connected.
        </p>
      )}
      {flash?.disconnected && (
        <p className="rounded-lg border px-3 py-2 text-sm text-muted-foreground">
          Google account disconnected.
        </p>
      )}
      {disconnectError && (
        <p className="text-sm text-destructive">{disconnectError}</p>
      )}

      <AppCard>
        <AppCardBody className="p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                Google account
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Connect once, then grant Contacts, Sheets, or Forms access when
                you use each feature.
              </p>
            </div>
            {connection ? (
              <Badge variant="outline" className="text-emerald-700 border-emerald-500/40">
                Connected
              </Badge>
            ) : (
              <Badge variant="outline">Not connected</Badge>
            )}
          </div>

          {connection ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">{connection.email}</p>
                <p className="text-xs text-muted-foreground">
                  Connected {connection.connectedAt.toLocaleString()}
                </p>
                {connection.lastError && (
                  <p className="text-xs text-destructive mt-1">
                    Last error: {connection.lastError}. Reconnect to fix.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {connection.scopes.map((scope) => (
                  <Badge key={scope} variant="secondary" className="text-[10px] font-normal">
                    {scopeLabel(scope)}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href="/api/integrations/google/connect?returnTo=/dashboard/integrations/google&force=1"
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  Reconnect
                </a>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={disconnect}
                  disabled={pending}
                  className="gap-2"
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unplug className="h-4 w-4" />
                  )}
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This is separate from “Continue with Google” on login. Connecting
                here lets SplitSMS read your Contacts, Sheets, and Forms when you
                choose.
              </p>
              <a
                href="/api/integrations/google/connect?returnTo=/dashboard/integrations/google"
                className={cn(buttonVariants({ size: "sm" }), "inline-flex gap-2")}
              >
                <Link2 className="h-4 w-4" />
                Connect Google
              </a>
            </div>
          )}
        </AppCardBody>
      </AppCard>

      <AppCard>
        <AppCardBody className="p-5 space-y-3">
          <h2 className="font-semibold">What you can do next</h2>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li>Import or export Google Contacts (select one or all)</li>
            <li>Import a Google Sheet / Excel file to send SMS</li>
            <li>Export Smart Forms responses to Google Sheets</li>
            <li>
              <a href="/dashboard/integrations/google/forms" className="text-primary underline">
                Send SMS when someone submits a Google Form
              </a>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Features request only the Google permissions they need when you use
            them.
          </p>
        </AppCardBody>
      </AppCard>
    </div>
  );
}
