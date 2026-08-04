"use client";

import { useEffect, useState, useTransition } from "react";
import {
  deleteGoogleFormSmsAutomationAction,
  saveGoogleFormSmsAutomationAction,
  toggleGoogleFormSmsAutomationAction,
} from "@/lib/actions/google-forms";
import type { GoogleFormQuestion, GoogleFormSummary } from "@/lib/google/forms";
import { GOOGLE_FORMS_SCOPES } from "@/lib/google/scopes";
import { googleConnectHref } from "@/lib/google/connect-url";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type AutomationRow = {
  id: string;
  formId: string;
  formTitle: string | null;
  isActive: boolean;
  lastPolledAt: string | null;
  lastError: string | null;
  messageTemplate: string;
};

export function GoogleFormsSmsPanel({
  connected,
  senderIds,
  automations,
}: {
  connected: boolean;
  senderIds: string[];
  automations: AutomationRow[];
}) {
  const [forms, setForms] = useState<GoogleFormSummary[] | null>(null);
  const [questions, setQuestions] = useState<GoogleFormQuestion[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [formId, setFormId] = useState("");
  const [phoneFieldId, setPhoneFieldId] = useState("");
  const [senderId, setSenderId] = useState(senderIds[0] ?? "");
  const [messageTemplate, setMessageTemplate] = useState(
    "Thanks for your submission{{name}}!",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectUrl, setConnectUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const connectHref = googleConnectHref({
    scopes: [...GOOGLE_FORMS_SCOPES],
    returnTo: "/dashboard/integrations/google/forms",
  });

  async function loadForms() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/google/forms");
      const data = await res.json();
      if (!res.ok) {
        setConnectUrl(data.connectUrl ?? null);
        setError("Connect Google and grant Forms access.");
        return;
      }
      setForms(data.forms ?? []);
    } catch {
      setError("Could not list Google Forms.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (connected) void loadForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  async function onPickForm(id: string) {
    setFormId(id);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/dashboard/google/forms?formId=${encodeURIComponent(id)}`,
      );
      const data = await res.json();
      if (!res.ok) {
        setConnectUrl(data.connectUrl ?? null);
        setError("Could not load form questions.");
        return;
      }
      setFormTitle(data.title ?? "");
      setQuestions(data.questions ?? []);
      const phoneGuess =
        (data.questions as GoogleFormQuestion[] | undefined)?.find((q) =>
          /phone|mobile|whatsapp|tel/i.test(q.title),
        )?.questionId ?? "";
      setPhoneFieldId(phoneGuess);
    } catch {
      setError("Could not load form questions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {!connected ? (
        <div className="rounded-xl border p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Connect Google, pick a form, map the phone question, and SplitSMS will
            send SMS when new responses arrive (about every 45 seconds).
          </p>
          <a href={connectHref} className={cn(buttonVariants({ size: "sm" }))}>
            Connect Google
          </a>
        </div>
      ) : (
        <div className="rounded-xl border p-4 space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <h2 className="font-semibold">New automation</h2>
            <Button type="button" size="sm" variant="outline" onClick={loadForms} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh forms"}
            </Button>
          </div>

          {error && (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{error}</p>
              {connectUrl && (
                <a
                  href={connectUrl}
                  className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                >
                  Grant access
                </a>
              )}
            </div>
          )}

          {forms && (
            <div className="space-y-2 max-h-40 overflow-auto">
              {forms.length === 0 ? (
                <p className="text-sm text-muted-foreground">No Google Forms found.</p>
              ) : (
                forms.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onPickForm(f.id)}
                    className={cn(
                      "w-full text-left rounded-lg border px-3 py-2 text-sm hover:bg-muted/50",
                      formId === f.id && "border-primary bg-primary/5",
                    )}
                  >
                    {f.name}
                  </button>
                ))
              )}
            </div>
          )}

          {formId && questions.length > 0 && (
            <form
              action={(fd) => startTransition(() => saveGoogleFormSmsAutomationAction(fd))}
              className="space-y-3"
            >
              <input type="hidden" name="formId" value={formId} />
              <input type="hidden" name="formTitle" value={formTitle} />

              <div className="space-y-1">
                <label className="text-sm font-medium">Phone question</label>
                <select
                  name="phoneFieldId"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={phoneFieldId}
                  onChange={(e) => setPhoneFieldId(e.target.value)}
                  required
                >
                  <option value="">Select question</option>
                  {questions.map((q) => (
                    <option key={q.questionId} value={q.questionId}>
                      {q.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Sender ID</label>
                <select
                  name="senderId"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={senderId}
                  onChange={(e) => setSenderId(e.target.value)}
                  required
                >
                  {senderIds.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">SMS template</label>
                <Textarea
                  name="messageTemplate"
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  rows={4}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{{Question title}}"} merge tags from your form questions.
                </p>
              </div>

              <Button type="submit" disabled={pending || !phoneFieldId || senderIds.length === 0}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save automation"}
              </Button>
              {senderIds.length === 0 && (
                <p className="text-sm text-destructive">
                  Approve a Sender ID before enabling Form SMS.
                </p>
              )}
            </form>
          )}
        </div>
      )}

      <div className="rounded-xl border p-4 space-y-3">
        <h2 className="font-semibold">Active automations</h2>
        {automations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No Google Form automations yet.</p>
        ) : (
          <ul className="space-y-3">
            {automations.map((a) => (
              <li key={a.id} className="rounded-lg border px-3 py-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div>
                    <p className="font-medium text-sm">{a.formTitle ?? a.formId}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.lastPolledAt
                        ? `Last checked ${new Date(a.lastPolledAt).toLocaleString()}`
                        : "Not polled yet"}
                    </p>
                  </div>
                  <Badge variant={a.isActive ? "default" : "outline"}>
                    {a.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
                {a.lastError && (
                  <p className="text-xs text-destructive">{a.lastError}</p>
                )}
                <p className="text-xs text-muted-foreground line-clamp-2">{a.messageTemplate}</p>
                <div className="flex flex-wrap gap-2">
                  <form action={toggleGoogleFormSmsAutomationAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="isActive" value={a.isActive ? "0" : "1"} />
                    <Button type="submit" size="sm" variant="outline">
                      {a.isActive ? "Pause" : "Resume"}
                    </Button>
                  </form>
                  <form action={deleteGoogleFormSmsAutomationAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <Button type="submit" size="sm" variant="destructive">
                      Delete
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
