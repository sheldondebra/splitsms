"use client";

import { useMemo, useState } from "react";
import { createAutomationAction } from "@/lib/actions/automation";
import {
  AUTOMATION_TEMPLATES,
  CLIENT_AUTOMATION_TRIGGERS,
} from "@/lib/automation/catalog";
import {
  PERSONALIZATION_HINT,
  personalizeMessage,
  SMS_PREVIEW_SAMPLE,
} from "@/lib/sms/personalize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import type { AutomationTrigger } from "@/lib/generated/prisma/client";

type SenderOption = { senderId: string; label: string };

export function AutomationCreateForm({ senders }: { senders: SenderOption[] }) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<AutomationTrigger>("SIGNUP");
  const [message, setMessage] = useState<string>(AUTOMATION_TEMPLATES[0].message);
  const [senderId, setSenderId] = useState(senders[0]?.senderId ?? "");

  const preview = useMemo(
    () => personalizeMessage(message, SMS_PREVIEW_SAMPLE),
    [message],
  );

  function applyTemplate(id: string) {
    const t = AUTOMATION_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setName(t.name);
    setTrigger(t.trigger);
    setMessage(t.message);
  }

  return (
    <form action={createAutomationAction} className="space-y-7">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quick start
        </p>
        <div className="flex flex-wrap gap-2">
          {AUTOMATION_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t.id)}
              className="rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="auto-name">Workflow name</Label>
        <Input
          id="auto-name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Welcome new customers"
          className="h-11"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">Trigger event</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {CLIENT_AUTOMATION_TRIGGERS.map((t) => (
            <label
              key={t.value}
              className={cn(
                "relative flex cursor-pointer flex-col rounded-xl border p-4 sm:p-5 transition-colors",
                trigger === t.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary/25"
                  : "border-border/60 bg-card hover:border-border",
              )}
            >
              <input
                type="radio"
                name="trigger"
                value={t.value}
                checked={trigger === t.value}
                onChange={() => setTrigger(t.value)}
                className="sr-only"
              />
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                {t.label}
                {t.live ? (
                  <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                    Live
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                    Draft
                  </span>
                )}
              </span>
              <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {t.description}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {senders.length > 0 ? (
        <div className="space-y-2">
          <Label htmlFor="auto-sender">Sender ID</Label>
          <select
            id="auto-sender"
            name="senderId"
            value={senderId}
            onChange={(e) => setSenderId(e.target.value)}
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            {senders.map((s) => (
              <option key={s.senderId} value={s.senderId}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          Approve a Sender ID so automations can send welcome SMS to your contacts.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="auto-message">Message</Label>
        <Textarea
          id="auto-message"
          name="message"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-[120px] text-base"
        />
        <p className="text-xs text-muted-foreground">{PERSONALIZATION_HINT}</p>
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Preview
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{preview}</p>
      </div>

      <Button
        type="submit"
        className="min-h-11 w-full gap-2 font-semibold sm:w-auto"
        disabled={!senders.length}
      >
        <Send className="h-4 w-4" />
        Create workflow
      </Button>
    </form>
  );
}
