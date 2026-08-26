"use client";

import { useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Trash2, UserPlus, X } from "lucide-react";
import { AdminEmpty } from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmailMarketingDashboard } from "@/lib/admin/email-marketing-dashboard";
import {
  adminAddEmailMarketingSubscribersAction,
  adminDeleteEmailMarketingSubscriberAction,
  adminUpdateEmailMarketingSubscriberAction,
} from "@/lib/actions/admin-email-marketing";
import {
  isValidNewsletterEmail,
  normalizeNewsletterEmail,
} from "@/lib/newsletter/validate";
import { cn } from "@/lib/utils";

function takeCompleteEmails(raw: string, consumeLast: boolean) {
  const trimmed = raw.trim();
  if (!trimmed) return { emails: [] as string[], rest: "" };

  const endsWithBreak = /[\s,;]$/.test(raw);
  const parts = raw.split(/[\s,;]+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { emails: [] as string[], rest: raw };

  const complete =
    consumeLast || endsWithBreak || parts.length > 1
      ? parts
      : parts.slice(0, -1);
  const leftover =
    consumeLast || endsWithBreak || parts.length > 1
      ? ""
      : parts[parts.length - 1] ?? "";

  const emails: string[] = [];
  let invalid = "";
  for (const part of complete) {
    const email = normalizeNewsletterEmail(part);
    if (isValidNewsletterEmail(email)) emails.push(email);
    else if (part) invalid = part;
  }

  return {
    emails,
    rest: [invalid, leftover].filter(Boolean).join(" "),
  };
}

function mergeEmails(prev: string[], next: string[]) {
  const seen = new Set(prev);
  const merged = [...prev];
  for (const email of next) {
    if (!seen.has(email)) {
      seen.add(email);
      merged.push(email);
    }
  }
  return merged;
}

function sourceLabel(source: string) {
  if (source === "footer") return "Footer";
  if (source === "admin") return "Admin";
  return source.replaceAll("_", " ");
}

type SubscriberRecord = EmailMarketingDashboard["subscribers"][number];

function SubscriberRow({ row }: { row: SubscriberRecord }) {
  const subscribed = row.status === "subscribed";
  const joined = new Date(row.createdAt);

  return (
    <tr className="border-t border-border/40 hover:bg-muted/25">
      <td className="max-w-[18rem] px-5 py-3 align-middle">
        <p className="truncate font-medium">{row.email}</p>
        <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
          Joined {Number.isNaN(joined.getTime()) ? "—" : format(joined, "MMM d, yyyy")}
        </p>
      </td>
      <td className="px-3 py-3 align-middle">
        <form action={adminUpdateEmailMarketingSubscriberAction}>
          <input type="hidden" name="subscriberId" value={row.id} />
          <input type="hidden" name="status" value={row.status} />
          <Input
            name="fullName"
            defaultValue={row.fullName ?? ""}
            placeholder="Add name"
            aria-label={`Name for ${row.email}`}
            className="h-8 min-w-[10rem] max-w-[14rem] border-transparent bg-transparent px-2 shadow-none hover:border-input hover:bg-background focus-visible:border-input focus-visible:bg-background"
            onBlur={(event) => {
              if (event.currentTarget.value !== (row.fullName ?? "")) {
                event.currentTarget.form?.requestSubmit();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
        </form>
      </td>
      <td className="px-3 py-3 align-middle">
        <form action={adminUpdateEmailMarketingSubscriberAction}>
          <input type="hidden" name="subscriberId" value={row.id} />
          <input type="hidden" name="fullName" value={row.fullName ?? ""} />
          <select
            name="status"
            defaultValue={row.status}
            aria-label={`Status for ${row.email}`}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className={cn(
              "h-7 rounded-full border px-2.5 text-[11px] font-semibold",
              subscribed
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                : "border-border bg-muted/70 text-muted-foreground",
            )}
          >
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </form>
      </td>
      <td className="px-3 py-3 align-middle">
        <Badge variant="outline" className="h-5 capitalize">
          {sourceLabel(row.source)}
        </Badge>
      </td>
      <td className="px-5 py-3 text-right align-middle">
        <form action={adminDeleteEmailMarketingSubscriberAction}>
          <input type="hidden" name="subscriberId" value={row.id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            aria-label={`Remove ${row.email}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </form>
      </td>
    </tr>
  );
}

function EmailCard({
  email,
  onRemove,
}: {
  email: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/12 px-2.5 py-1.5 text-sm font-medium text-emerald-900 dark:text-emerald-100">
      <CheckCircle2
        className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
        aria-hidden
      />
      <span className="min-w-0 truncate">{email}</span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove();
        }}
        className="rounded p-0.5 text-emerald-800/70 hover:bg-emerald-500/20 hover:text-emerald-950 dark:text-emerald-200/80 dark:hover:text-emerald-50"
        aria-label={`Remove ${email}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

export function AdminEmailMarketingSubscribers({
  subscribers,
  count,
}: {
  subscribers: EmailMarketingDashboard["subscribers"];
  count: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [emails, setEmails] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState<string | null>(null);

  const draftEmail = normalizeNewsletterEmail(draft);
  const draftValid = Boolean(draftEmail) && isValidNewsletterEmail(draftEmail);
  const payload = useMemo(
    () => [...emails, draftValid ? draftEmail : ""].filter(Boolean).join("\n"),
    [emails, draftValid, draftEmail],
  );

  function addEmails(next: string[], rest: string) {
    if (next.length === 0) {
      setDraft(rest);
      return;
    }
    setEmails((prev) => mergeEmails(prev, next));
    setDraft(rest);
    setHint(null);
  }

  function commit(raw: string, consumeLast: boolean) {
    const { emails: found, rest } = takeCompleteEmails(raw, consumeLast);
    if (consumeLast && found.length === 0 && rest) {
      if (rest.includes("@")) setHint("Enter a valid email address.");
      setDraft(rest);
      return;
    }
    addEmails(found, rest);
  }

  function removeEmail(email: string) {
    setEmails((prev) => prev.filter((item) => item !== email));
  }

  return (
    <div>
      <form
        action={adminAddEmailMarketingSubscribersAction}
        className="space-y-4 pb-6"
        onSubmit={(event) => {
          if (draft.trim()) commit(draft, true);
          if (emails.length === 0 && !draftValid) {
            event.preventDefault();
            setHint("Enter a valid email address.");
          }
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Add emails</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Type or paste addresses. Valid emails become green cards. No welcome email is sent.
          </p>
        </div>

        <input type="hidden" name="emails" value={payload} />

        <div className="space-y-2">
          <Label htmlFor="subscriber-email-draft">Email addresses</Label>
          <div
            role="group"
            aria-labelledby="subscriber-email-draft"
            onClick={() => inputRef.current?.focus()}
            className={cn(
              "flex min-h-[7.5rem] w-full cursor-text flex-wrap content-start gap-2 rounded-lg border border-input bg-background px-2.5 py-2.5",
              "focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40",
            )}
          >
            {emails.map((email) => (
              <EmailCard
                key={email}
                email={email}
                onRemove={() => removeEmail(email)}
              />
            ))}
            <span
              className={cn(
                "inline-flex min-w-[12rem] max-w-full flex-1 items-center gap-1.5",
                draftValid &&
                  "rounded-lg border border-emerald-500/35 bg-emerald-500/12 px-2.5 py-1.5 text-sm font-medium text-emerald-900 dark:text-emerald-100",
              )}
            >
              {draftValid ? (
                <CheckCircle2
                  className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
              ) : null}
              <input
                ref={inputRef}
                id="subscriber-email-draft"
                value={draft}
                autoComplete="off"
                placeholder={emails.length ? "Add another email" : "ops@company.com"}
                onChange={(e) => {
                  setHint(null);
                  const value = e.target.value;
                  if (/[\n,;]/.test(value) || /[^\s]\s/.test(value)) {
                    commit(value, /[\s,;\n]$/.test(value));
                    return;
                  }
                  setDraft(value);
                }}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  if (!/[\n,;\s]/.test(text) && !text.includes("@")) return;
                  e.preventDefault();
                  commit(`${draft} ${text} `, true);
                }}
                onBlur={() => {
                  if (draft.trim()) commit(draft, true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "," || e.key === ";" || e.key === " ") {
                    if (draft.trim()) {
                      e.preventDefault();
                      commit(draft, true);
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                    }
                  }
                  if (e.key === "Backspace" && !draft && emails.length > 0) {
                    removeEmail(emails[emails.length - 1]!);
                  }
                }}
                className={cn(
                  "min-w-0 flex-1 border-0 bg-transparent outline-none placeholder:text-muted-foreground",
                  draftValid
                    ? "p-0 text-sm font-medium text-emerald-900 dark:text-emerald-100"
                    : "px-1 py-1 text-sm",
                )}
              />
            </span>
          </div>
          {hint ? (
            <p className="text-xs text-destructive">{hint}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Press Enter, comma, or space after a valid address. Paste a list anytime.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor="fullName">Name (optional)</Label>
            <Input id="fullName" name="fullName" placeholder="Applied to new rows" />
          </div>
          <Button type="submit" disabled={emails.length === 0 && !draftValid}>
            Add {emails.length + (draftValid ? 1 : 0) > 0 ? `${emails.length + (draftValid ? 1 : 0)} ` : ""}
            to list
          </Button>
        </div>
      </form>

      <section className="-mx-5 -mb-5 border-t border-border/50">
        <div className="flex items-baseline justify-between gap-3 px-5 py-3">
          <h3 className="text-sm font-semibold">Subscribers</h3>
          <p className="text-xs tabular-nums text-muted-foreground">
            {count.toLocaleString()} {count === 1 ? "person" : "people"}
          </p>
        </div>
        {subscribers.length === 0 ? (
          <div className="px-5 pb-5">
            <AdminEmpty dense>No subscribers yet.</AdminEmpty>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/30">
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2.5 font-semibold">Email</th>
                  <th className="px-3 py-2.5 font-semibold">Name</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Source</th>
                  <th className="px-5 py-2.5 font-semibold">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((row) => (
                  <SubscriberRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
