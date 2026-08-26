"use client";

import { useState, useTransition } from "react";
import {
  deleteGoogleFormSmsAutomationAction,
  saveGoogleFormSmsAutomationAction,
  toggleGoogleFormSmsAutomationAction,
} from "@/lib/actions/google-forms";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Copy, Loader2 } from "lucide-react";

type AutomationRow = {
  id: string;
  formId: string;
  formTitle: string | null;
  isActive: boolean;
  lastPolledAt: string | null;
  lastError: string | null;
  messageTemplate: string;
};

function looksLikeGoogleForm(url: string) {
  return /docs\.google\.com\/forms\//i.test(url);
}

export function GoogleFormsSmsPanel({
  senderIds,
  automations,
  serviceAccountEmail,
}: {
  senderIds: string[];
  automations: AutomationRow[];
  serviceAccountEmail: string;
}) {
  const [sheetUrl, setSheetUrl] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [formId, setFormId] = useState("");
  const [phoneFieldId, setPhoneFieldId] = useState("");
  const [senderId, setSenderId] = useState(senderIds[0] ?? "");
  const [messageTemplate, setMessageTemplate] = useState(
    "Thanks for submitting the form.",
  );
  const [loading, setLoading] = useState(false);
  const [needsShare, setNeedsShare] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  async function continueWithSheet() {
    setLoading(true);
    setError(null);
    setNeedsShare(false);
    if (looksLikeGoogleForm(sheetUrl)) {
      setLoading(false);
      setError(
        "Paste the Google Sheet that stores answers. In your form: Responses → Link to Sheets.",
      );
      return;
    }
    try {
      const res = await fetch(
        `/api/dashboard/google/forms/sheet?url=${encodeURIComponent(sheetUrl)}`,
      );
      const data = await res.json();
      if (res.status === 403) {
        setNeedsShare(true);
        return;
      }
      if (!res.ok) {
        setError("We couldn’t open that link. Check it’s a Google Sheet and try again.");
        return;
      }
      const cols = (data.headers as string[]) ?? [];
      setFormId(data.id ?? "");
      setFormTitle(data.title ?? "");
      setHeaders(cols);
      setPhoneFieldId(cols.find((h) => /phone|mobile|whatsapp|tel/i.test(h)) ?? cols[0] ?? "");
    } catch {
      setError("We couldn’t open that link. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyEmail() {
    if (!serviceAccountEmail) return;
    try {
      await navigator.clipboard.writeText(serviceAccountEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const ready = Boolean(formId && headers.length > 0);

  return (
    <div className="space-y-6">
      <AppCard>
        <AppCardBody className="space-y-5">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Paste your Google Sheet
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the sheet that collects form answers. We’ll text new rows from here on.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={sheetUrl}
              onChange={(e) => {
                setSheetUrl(e.target.value);
                setFormId("");
                setHeaders([]);
                setNeedsShare(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void continueWithSheet();
                }
              }}
              placeholder="Paste Google Sheet link"
              aria-label="Google Sheet link"
            />
            <Button
              type="button"
              onClick={() => void continueWithSheet()}
              disabled={loading || !sheetUrl.trim()}
              className="h-10 shrink-0 px-4"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
            </Button>
          </div>

          {needsShare ? (
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-sm font-medium">Share the sheet, then Continue again.</p>
              <p className="text-sm text-muted-foreground">
                In Google Sheets: Share → add this email as Viewer.
              </p>
              <div className="flex gap-2">
                <Input readOnly value={serviceAccountEmail} className="font-mono text-xs" />
                <Button type="button" variant="outline" onClick={() => void copyEmail()} className="h-10 shrink-0 gap-1.5">
                  <Copy className="h-4 w-4" />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {ready ? (
            <form
              action={(fd) => startTransition(() => saveGoogleFormSmsAutomationAction(fd))}
              className="space-y-4 border-t border-border/60 pt-5"
            >
              <input type="hidden" name="formId" value={formId} />
              <input type="hidden" name="formTitle" value={formTitle} />
              {senderIds.length === 1 ? (
                <input type="hidden" name="senderId" value={senderId} />
              ) : null}

              <p className="text-sm">
                Using <span className="font-medium">{formTitle || "this sheet"}</span>
              </p>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="phoneFieldId">
                  Phone column
                </label>
                <select
                  id="phoneFieldId"
                  name="phoneFieldId"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={phoneFieldId}
                  onChange={(e) => setPhoneFieldId(e.target.value)}
                  required
                >
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {senderIds.length > 1 ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium" htmlFor="senderId">
                    Sender ID
                  </label>
                  <select
                    id="senderId"
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
              ) : null}

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="messageTemplate">
                  Message
                </label>
                <Textarea
                  id="messageTemplate"
                  name="messageTemplate"
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={pending || !phoneFieldId || senderIds.length === 0}
                className="h-10 px-4"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Turn on SMS"}
              </Button>
              {senderIds.length === 0 ? (
                <p className="text-sm text-destructive">
                  You need an approved Sender ID first.
                </p>
              ) : null}
            </form>
          ) : null}
        </AppCardBody>
      </AppCard>

      {automations.length > 0 ? (
        <AppCard>
          <AppCardBody className="space-y-4">
            <h2 className="text-base font-semibold tracking-tight">Your forms</h2>
            <ul className="space-y-3">
              {automations.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.formTitle ?? "Google Sheet"}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {a.messageTemplate}
                    </p>
                    {a.lastError ? (
                      <p className="mt-1 text-xs text-destructive">{a.lastError}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Badge variant={a.isActive ? "default" : "outline"}>
                      {a.isActive ? "On" : "Off"}
                    </Badge>
                    <form action={toggleGoogleFormSmsAutomationAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="isActive" value={a.isActive ? "0" : "1"} />
                      <Button type="submit" size="sm" variant="outline">
                        {a.isActive ? "Pause" : "Resume"}
                      </Button>
                    </form>
                    <form action={deleteGoogleFormSmsAutomationAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <Button type="submit" size="sm" variant="ghost">
                        Remove
                      </Button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          </AppCardBody>
        </AppCard>
      ) : null}
    </div>
  );
}
