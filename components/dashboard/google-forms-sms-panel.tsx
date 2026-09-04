"use client";

import { useState, useTransition } from "react";
import {
  deleteGoogleFormSmsAutomationAction,
  saveGoogleFormSmsAutomationAction,
  toggleGoogleFormSmsAutomationAction,
} from "@/lib/actions/google-forms";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  Loader2,
  CheckCircle2,
  FileSpreadsheet,
  Link2,
  Users,
  Clock,
  Send,
  CalendarClock,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

type Respondent = { name: string | null; phone: string | null; submittedAt: string | null };

type ContactGroupOption = { id: string; name: string };

type AutomationRow = {
  id: string;
  formId: string;
  formTitle: string | null;
  isActive: boolean;
  lastPolledAt: string | null;
  lastError: string | null;
  messageTemplate: string;
  phoneFieldId: string;
  createdAt: string;
  sendCount: number;
  contactGroupId: string | null;
  submissionCount: number | null;
  lastSubmittedAt: string | null;
  recentRespondents: Respondent[];
};

function looksLikeGoogleForm(url: string) {
  return /docs\.google\.com\/forms\//i.test(url);
}

function googleSheetUrl(formId: string) {
  return `https://docs.google.com/spreadsheets/d/${formId}/edit`;
}

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 leading-none">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-xs font-medium">{value}</p>
      </div>
    </div>
  );
}

function AutomationCard({ a }: { a: AutomationRow }) {
  const [showRespondents, setShowRespondents] = useState(false);

  return (
    <li className="rounded-xl border border-border/60 px-4 py-3.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2.5">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{a.formTitle ?? "Google Sheet"}</p>
            <Badge variant={a.isActive ? "default" : "outline"} className="shrink-0">
              {a.isActive ? "On" : "Off"}
            </Badge>
          </div>
          <p className="line-clamp-1 text-xs text-muted-foreground">{a.messageTemplate}</p>

          <div className="flex flex-wrap gap-2">
            <StatChip
              icon={Users}
              label="Responses"
              value={a.submissionCount === null ? "—" : a.submissionCount.toLocaleString()}
            />
            <StatChip
              icon={Clock}
              label="Last response"
              value={
                a.lastSubmittedAt
                  ? formatDistanceToNow(new Date(a.lastSubmittedAt), { addSuffix: true })
                  : "—"
              }
            />
            <StatChip icon={Send} label="SMS sent" value={a.sendCount.toLocaleString()} />
            <StatChip
              icon={CalendarClock}
              label="Connected"
              value={formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Phone column: <span className="font-medium text-foreground">{a.phoneFieldId}</span>
            {a.lastPolledAt
              ? ` · Last checked ${formatDistanceToNow(new Date(a.lastPolledAt), { addSuffix: true })}`
              : " · Not checked yet"}
          </p>
          {a.lastError ? <p className="text-xs text-destructive">{a.lastError}</p> : null}

          {a.recentRespondents.length > 0 ? (
            <div>
              <button
                type="button"
                onClick={() => setShowRespondents((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform", showRespondents && "rotate-180")}
                />
                {showRespondents ? "Hide" : "Show"} recent respondents
              </button>
              {showRespondents ? (
                <div className="mt-2 overflow-hidden rounded-lg border border-border/60">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/30 text-muted-foreground">
                      <tr>
                        <th className="px-2.5 py-1.5 text-left font-medium">Name</th>
                        <th className="px-2.5 py-1.5 text-left font-medium">Phone</th>
                        <th className="px-2.5 py-1.5 text-left font-medium">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.recentRespondents.map((r, i) => (
                        <tr key={i} className="border-t border-border/40">
                          <td className="truncate px-2.5 py-1.5">{r.name || "—"}</td>
                          <td className="truncate px-2.5 py-1.5 font-mono">{r.phone || "—"}</td>
                          <td className="truncate px-2.5 py-1.5">
                            {r.submittedAt
                              ? formatDistanceToNow(new Date(r.submittedAt), { addSuffix: true })
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <a
            href={googleSheetUrl(a.formId)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1.5")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open sheet
          </a>
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
      </div>
    </li>
  );
}

export function GoogleFormsSmsPanel({
  senderIds,
  automations,
  serviceAccountEmail,
  contactGroups,
}: {
  senderIds: string[];
  automations: AutomationRow[];
  serviceAccountEmail: string;
  contactGroups: ContactGroupOption[];
}) {
  const [sheetUrl, setSheetUrl] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [formTab, setFormTab] = useState("");
  const [submissionCount, setSubmissionCount] = useState<number | null>(null);
  const [latestSubmission, setLatestSubmission] = useState<Record<string, string> | null>(null);
  const [formId, setFormId] = useState("");
  const [phoneFieldId, setPhoneFieldId] = useState("");
  const [senderId, setSenderId] = useState(senderIds[0] ?? "");
  const [contactGroupId, setContactGroupId] = useState("");
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
      setFormTab(data.tab ?? "");
      setSubmissionCount(typeof data.submissionCount === "number" ? data.submissionCount : null);
      setLatestSubmission((data.latestSubmission as Record<string, string> | null) ?? null);
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
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight">
                Paste your Google Sheet
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use the sheet that collects form answers. We’ll text new rows from here on.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={sheetUrl}
                onChange={(e) => {
                  setSheetUrl(e.target.value);
                  setFormId("");
                  setHeaders([]);
                  setSubmissionCount(null);
                  setLatestSubmission(null);
                  setNeedsShare(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void continueWithSheet();
                  }
                }}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                aria-label="Google Sheet link"
                className="pl-9"
              />
            </div>
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

              <div className="space-y-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3.5 py-3">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div className="min-w-0 space-y-0.5 text-sm">
                      <p className="font-medium">
                        Connected — <span className="text-muted-foreground font-normal">{formTitle || "this sheet"}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formTab ? `Tab "${formTab}" · ` : ""}
                        {submissionCount === null
                          ? "Checking submissions…"
                          : `${submissionCount.toLocaleString()} submission${submissionCount === 1 ? "" : "s"} so far`}
                        {" · "}
                        {headers.length} column{headers.length === 1 ? "" : "s"} detected
                      </p>
                    </div>
                  </div>
                  <a
                    href={googleSheetUrl(formId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </a>
                </div>

                {latestSubmission ? (
                  <div className="rounded-lg border border-emerald-500/20 bg-background/60 px-3 py-2.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Most recent entry
                    </p>
                    <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                      {headers.map((h) =>
                        latestSubmission[h] ? (
                          <div key={h} className="contents">
                            <dt className="text-muted-foreground">{h}</dt>
                            <dd className="truncate font-medium">{latestSubmission[h]}</dd>
                          </div>
                        ) : null,
                      )}
                    </dl>
                  </div>
                ) : null}
              </div>

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

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="contactGroupId">
                  Save respondents to contacts
                </label>
                <select
                  id="contactGroupId"
                  name="contactGroupId"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  value={contactGroupId}
                  onChange={(e) => setContactGroupId(e.target.value)}
                >
                  <option value="">Save as contact only (no group)</option>
                  {contactGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      Save to group — {g.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Every respondent we successfully text gets saved to your Contacts automatically.
                  Pick a group here to also add them to it.
                </p>
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
            <h2 className="text-base font-semibold tracking-tight">
              Your forms <span className="font-normal text-muted-foreground">({automations.length})</span>
            </h2>
            <ul className="space-y-3">
              {automations.map((a) => (
                <AutomationCard key={a.id} a={a} />
              ))}
            </ul>
          </AppCardBody>
        </AppCard>
      ) : null}
    </div>
  );
}
