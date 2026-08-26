"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  AppCard,
  AppCardBody,
  AppCardTitle,
} from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/user/user-avatar";
import { cn } from "@/lib/utils";
import { GOOGLE_CONNECT_ERROR_COPY } from "@/lib/google/connect-errors";
import type { GoogleConnectionPublic } from "@/lib/google/connection";
import { googleConnectHref } from "@/lib/google/connect-url";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  Unplug,
  Users,
  type LucideIcon,
} from "lucide-react";

function grantedAccessLabels(scopes: string[]) {
  const labels = ["Profile"];
  if (scopes.some((s) => s.includes("contacts"))) labels.push("Contacts");
  if (scopes.some((s) => s.includes("spreadsheets"))) labels.push("Sheets");
  if (scopes.some((s) => s.includes("forms"))) labels.push("Forms");
  return labels;
}

function formatWhen(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { absolute: "—", relative: undefined as string | undefined };
  }
  return {
    absolute: format(date, "MMM d, yyyy · h:mm a"),
    relative: formatDistanceToNow(date, { addSuffix: true }),
  };
}

function DetailItem({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium">{value}</p>
        {hint ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

function DestinationCard({
  href,
  icon: Icon,
  title,
  description,
  actions,
  connected,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  actions: string[];
  connected: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/15 sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <span
            key={action}
            className="rounded-md border border-border/60 bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
          >
            {action}
          </span>
        ))}
        <span
          className={cn(
            "ml-auto text-[11px] font-medium",
            connected ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
          )}
        >
          {connected ? "Google connected" : "Needs Google account"}
        </span>
      </div>
    </Link>
  );
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [disconnectError, setDisconnectError] = useState<string | null>(null);
  const accessLabels = connection ? grantedAccessLabels(connection.scopes) : [];

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
      setConfirmOpen(false);
      router.refresh();
      router.replace("/dashboard/integrations/google?disconnected=1");
    });
  }

  return (
    <div className="space-y-6">
      {flash?.error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {GOOGLE_CONNECT_ERROR_COPY[flash.error] ??
            "Something went wrong connecting Google."}
        </p>
      ) : null}
      {flash?.connected ? (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Google account connected.
        </p>
      ) : null}
      {flash?.disconnected ? (
        <p className="rounded-xl border border-border/60 px-4 py-3 text-sm text-muted-foreground">
          Google account disconnected.
        </p>
      ) : null}
      {disconnectError ? (
        <p className="text-sm text-destructive">{disconnectError}</p>
      ) : null}

      <Link
        href="/dashboard/integrations/google/forms"
        className="group flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/15 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight">
                Google Forms → SMS
              </h2>
              <span className="rounded-md border border-border/60 bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                No Google login needed
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Paste your Google Sheet and we’ll text new form answers automatically.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Paste sheet", "Turn on SMS"].map((step) => (
                <span
                  key={step}
                  className="rounded-md border border-border/60 bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
        </div>
        <span
          className={cn(
            buttonVariants(),
            "h-9 shrink-0 gap-2 px-3 pointer-events-none",
          )}
        >
          Set up Forms SMS
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      <div className="grid gap-4 lg:grid-cols-2">
        <DestinationCard
          href="/dashboard/contacts"
          icon={Users}
          title="Contacts"
          description="Import people from Google Contacts, or export your SplitSMS list back to Google."
          actions={["Import", "Export"]}
          connected={Boolean(connection)}
        />
        <DestinationCard
          href="/dashboard/contacts"
          icon={FileSpreadsheet}
          title="Sheets"
          description="Import a Google Sheet to send SMS, or export Smart Form responses to Sheets."
          actions={["Import to SMS", "Export responses"]}
          connected={Boolean(connection)}
        />
      </div>

      <AppCard>
        <AppCardBody>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <AppCardTitle
              title="Google account"
              description="Optional. Used for Contacts and Sheets import — not for Forms SMS."
              className="mb-0"
            />
            {connection ? (
              <Badge
                variant="outline"
                className="text-emerald-700 border-emerald-500/40"
              >
                Connected
              </Badge>
            ) : (
              <Badge variant="outline">Not connected</Badge>
            )}
          </div>

          {connection ? (
            <div className="mt-6 space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    name={connection.name || connection.email}
                    src={connection.pictureUrl}
                    size="xl"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {connection.name || "Google account"}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {connection.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={googleConnectHref({
                      scopes: [],
                      returnTo: "/dashboard/integrations/google",
                      force: true,
                    })}
                    className={cn(buttonVariants({ variant: "outline" }), "h-9 gap-2 px-3")}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reconnect
                  </a>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setConfirmOpen(true)}
                    disabled={pending}
                    className="h-9 gap-2 px-3"
                  >
                    <Unplug className="h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              </div>

              {connection.lastError ? (
                <p className="text-sm text-destructive">
                  Last error: {connection.lastError}. Reconnect to fix.
                </p>
              ) : null}

              <div>
                <h3 className="text-sm font-semibold">More details</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    icon={Mail}
                    label="Email"
                    value={connection.email}
                  />
                  <DetailItem
                    icon={Calendar}
                    label="Connected"
                    value={formatWhen(connection.connectedAt).absolute}
                    hint={formatWhen(connection.connectedAt).relative}
                  />
                  <DetailItem
                    icon={RefreshCw}
                    label="Last updated"
                    value={formatWhen(connection.updatedAt).absolute}
                    hint={formatWhen(connection.updatedAt).relative}
                  />
                  <DetailItem
                    icon={Fingerprint}
                    label="Google ID"
                    value={connection.googleSubject}
                  />
                  <DetailItem
                    icon={KeyRound}
                    label="Access"
                    value={accessLabels.join(" · ")}
                    hint="Forms SMS does not use this connection."
                  />
                  <DetailItem
                    icon={CheckCircle2}
                    label="Status"
                    value="Connected"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <a
                href={googleConnectHref({
                  scopes: [],
                  returnTo: "/dashboard/integrations/google",
                })}
                className={cn(buttonVariants(), "h-9 gap-2 px-3")}
              >
                Connect Google
              </a>
            </div>
          )}

          <Dialog
            open={confirmOpen}
            onOpenChange={(open) => {
              if (pending) return;
              setConfirmOpen(open);
            }}
          >
            <DialogContent
              className="gap-0 overflow-hidden p-0 sm:max-w-[400px]"
              showCloseButton={!pending}
            >
              <div className="px-6 pt-7 pb-5 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/15">
                  <Unplug className="h-6 w-6 text-destructive" aria-hidden />
                </div>
                <DialogHeader className="items-center gap-2 text-center sm:text-center">
                  <DialogTitle className="text-lg font-semibold tracking-tight">
                    Disconnect Google?
                  </DialogTitle>
                  <DialogDescription className="mx-auto max-w-[300px] text-center leading-relaxed">
                    Contacts and Sheets import will stop until you connect again.
                    Forms SMS is not affected.
                  </DialogDescription>
                </DialogHeader>
              </div>
              <DialogFooter className="!mx-0 !mb-0 flex-row gap-2 border-t border-border/60 bg-muted/25 px-6 py-4 sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmOpen(false)}
                  disabled={pending}
                  className="h-10 flex-1 rounded-lg sm:flex-none sm:min-w-[100px]"
                >
                  No
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={disconnect}
                  disabled={pending}
                  className="h-10 flex-1 gap-2 rounded-lg font-semibold sm:flex-none sm:min-w-[120px]"
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unplug className="h-4 w-4" />
                  )}
                  Yes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </AppCardBody>
      </AppCard>
    </div>
  );
}
