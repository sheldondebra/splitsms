"use client";

import { useFormStatus } from "react-dom";
import { saveSlackOfficeConfigAction, testSlackConnectionAction } from "@/lib/actions/admin-general";
import type { SlackOfficeConfig } from "@/lib/slack/config-shared";
import { isSlackSupportThreadsConfigured, maskSlackSecret } from "@/lib/slack/config-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Send } from "lucide-react";

function SaveSlackButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="gap-2" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? "Saving…" : "Save Slack settings"}
    </Button>
  );
}

function TestSlackButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" className="gap-2" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      {pending ? "Sending…" : "Send test message"}
    </Button>
  );
}

export function GeneralSlackForm({
  config,
  eventsUrl,
}: {
  config: SlackOfficeConfig;
  eventsUrl: string;
}) {
  const threadsReady = isSlackSupportThreadsConfigured(config);

  return (
    <div className="space-y-6">
      <form
        key={config.updatedAt ?? "default"}
        action={saveSlackOfficeConfigAction}
        className="space-y-5"
      >
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={config.enabled}
            className="h-4 w-4 rounded accent-primary mt-0.5"
          />
          <span>
            Enable Slack notifications
            <span className="block text-xs text-muted-foreground mt-0.5">
              Incoming Webhook for alerts · optional bot for support ticket threads.
            </span>
          </span>
        </label>

        <div className="space-y-2">
          <Label htmlFor="slackWebhookUrl">Incoming Webhook URL</Label>
          <Input
            id="slackWebhookUrl"
            name="webhookUrl"
            type="url"
            autoComplete="off"
            defaultValue={config.webhookUrl}
            placeholder="https://hooks.slack.com/services/…"
          />
          <p className="text-[11px] text-muted-foreground">
            Used for payments, sender IDs, registrations, and support (when threads are off).
            {config.webhookUrl ? ` Saved: ${maskSlackSecret(config.webhookUrl)}` : ""}
          </p>
        </div>

        <fieldset className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Support ticket threads
          </legend>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              name="supportThreadsEnabled"
              defaultChecked={config.supportThreadsEnabled}
              className="h-4 w-4 rounded accent-primary mt-0.5"
            />
            <span>
              One Slack thread per ticket — reply in the thread to answer the member
              <span className="block text-xs text-muted-foreground mt-0.5">
                Requires a Slack bot (xoxb token) and Events API. Replies sync to the member support chat.
              </span>
            </span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="supportBotToken">Bot token</Label>
              <Input
                id="supportBotToken"
                name="supportBotToken"
                type="password"
                autoComplete="off"
                placeholder="xoxb-…"
              />
              {config.supportBotToken ? (
                <p className="text-[11px] text-muted-foreground">
                  Saved: {maskSlackSecret(config.supportBotToken)}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportChannelId">Support channel ID</Label>
              <Input
                id="supportChannelId"
                name="supportChannelId"
                defaultValue={config.supportChannelId}
                placeholder="C0123456789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supportSigningSecret">Signing secret</Label>
              <Input
                id="supportSigningSecret"
                name="supportSigningSecret"
                type="password"
                autoComplete="off"
                placeholder="From Slack app Basic Information"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-background/80 p-3 text-[11px] text-muted-foreground space-y-2 leading-relaxed">
            <p className="font-semibold text-foreground text-xs">Slack app setup</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Bot scopes: <code className="text-[10px]">chat:write</code>,{" "}
                <code className="text-[10px]">users:read.email</code>
              </li>
              <li>
                Event subscriptions → Request URL:{" "}
                <code className="text-[10px] break-all">{eventsUrl}</code>
              </li>
              <li>
                Subscribe to bot event: <code className="text-[10px]">message.channels</code> (or{" "}
                <code className="text-[10px]">message.groups</code> for private channels)
              </li>
              <li>Invite the bot to your support channel</li>
            </ol>
            {threadsReady ? (
              <p className="text-green-700 dark:text-green-400 font-medium">
                Support threads ready — new tickets will open a thread automatically.
              </p>
            ) : null}
          </div>
        </fieldset>

        <div className="rounded-xl border border-border/60 bg-muted/15 p-3 space-y-1.5">
          <p className="text-xs font-semibold">Actions from Slack</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Ticket alerts include <strong>In progress</strong>, <strong>Resolved</strong>, and{" "}
            <strong>Close</strong> buttons (signed admin links). Reply in the thread to send the member a
            message in their dashboard support chat.
          </p>
        </div>

        <fieldset className="space-y-3 rounded-xl border border-border/60 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Notify me about
          </legend>
          {[
            { name: "notifyUserRegistration", label: "New member registration", default: config.notifyUserRegistration },
            { name: "notifyUserLogin", label: "Member logins", default: config.notifyUserLogin },
            { name: "notifyAuthFailures", label: "Failed login attempts", default: config.notifyAuthFailures },
            { name: "notifySenderIdRequests", label: "Sender ID registration requests", default: config.notifySenderIdRequests },
            { name: "notifyOfflinePayments", label: "Offline / bank transfer top-ups (pending)", default: config.notifyOfflinePayments },
            { name: "notifyOnlinePayments", label: "Online payments completed", default: config.notifyOnlinePayments },
            { name: "notifySupportTickets", label: "New support tickets", default: config.notifySupportTickets },
            { name: "notifyStuckSms", label: "SMS stuck in queue (5+ minutes)", default: config.notifyStuckSms },
            { name: "notifySmsFailures", label: "Individual SMS send failures", default: config.notifySmsFailures },
            {
              name: "notifySmsBatchResults",
              label: "SMS batch results (manual runs + cron failures)",
              default: config.notifySmsBatchResults,
            },
            {
              name: "notifyLowBalances",
              label: "Low mNotify / provider balances",
              default: config.notifyLowBalances,
            },
            {
              name: "notifySystemSync",
              label: "System sync reports (what worked, what didn't)",
              default: config.notifySystemSync,
            },
          ].map((item) => (
            <label key={item.name} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                name={item.name}
                defaultChecked={item.default}
                className="h-4 w-4 rounded accent-primary"
              />
              {item.label}
            </label>
          ))}
        </fieldset>

        <SaveSlackButton />
      </form>

      <form action={testSlackConnectionAction}>
        <TestSlackButton />
      </form>
    </div>
  );
}
