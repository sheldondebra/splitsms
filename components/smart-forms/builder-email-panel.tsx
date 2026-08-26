"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveSmartFormEmailAutomationAction } from "@/lib/actions/smart-form-automation";
import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_EMAIL_SUBJECT,
  DEFAULT_RESPONDENT_EMAIL,
  DEFAULT_RESPONDENT_EMAIL_SUBJECT,
  SMART_FORM_MERGE_TAGS,
} from "@/lib/smart-forms/merge-tags";
import {
  InspectorSaveBar,
  InspectorTags,
  InspectorToggle,
} from "@/components/smart-forms/builder-inspector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  MAX_NOTICE_EMAILS,
  parseNoticeEmails,
  serializeNoticeEmails,
} from "@/lib/smart-forms/notice-emails";
import { Bell, Check, FileBarChart2, Mail, X } from "lucide-react";
import Link from "next/link";

export type BuilderEmailState = {
  sendToRespondent: boolean;
  sendToAdmin: boolean;
  adminEmail: string;
  respondentSubject: string;
  respondentMessageTemplate: string;
  adminSubject: string;
  adminMessageTemplate: string;
  reportFrequency: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  reportEmail: string;
};

type MergeField = { fieldKey: string; label: string };

const REPORT_OPTIONS: { id: BuilderEmailState["reportFrequency"]; label: string }[] = [
  { id: "NONE", label: "Off" },
  { id: "DAILY", label: "Daily" },
  { id: "WEEKLY", label: "Weekly" },
  { id: "MONTHLY", label: "Monthly" },
];

const REPORT_DETAILS: Record<
  BuilderEmailState["reportFrequency"],
  { title: string; covers: string; when: string; includes: string[] }
> = {
  NONE: {
    title: "Reports are off",
    covers: "Nothing is emailed on a schedule.",
    when: "Pick Daily, Weekly, or Monthly to start.",
    includes: [],
  },
  DAILY: {
    title: "Daily report",
    covers: "Today’s submissions.",
    when: "Emailed about once every 24 hours.",
    includes: [
      "Submission count and conversion",
      "Source and device mix",
      "Recent responses, with a PDF attached",
    ],
  },
  WEEKLY: {
    title: "Weekly report",
    covers: "The last 7 days.",
    when: "Emailed about once a week.",
    includes: [
      "Submission count and conversion",
      "Source and device mix",
      "Recent responses, with a PDF attached",
    ],
  },
  MONTHLY: {
    title: "Monthly report",
    covers: "The last 30 days.",
    when: "Emailed about once a month.",
    includes: [
      "Submission count and conversion",
      "Source and device mix",
      "Recent responses, with a PDF attached",
    ],
  },
};

function EmailConfirmField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  const emails = parseNoticeEmails(value);
  const [draft, setDraft] = useState("");
  const canAdd = emails.length < MAX_NOTICE_EMAILS;

  function commitDraft() {
    if (!draft.trim()) return;
    const added = parseNoticeEmails(draft);
    if (added.length === 0) return;
    onChange(serializeNoticeEmails([...emails, ...added]));
    setDraft("");
  }

  function removeEmail(email: string) {
    onChange(serializeNoticeEmails(emails.filter((item) => item !== email)));
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {emails.map((email) => (
          <div
            key={email}
            className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-2.5"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{email}</span>
            <button
              type="button"
              onClick={() => removeEmail(email)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-background/70 hover:text-foreground"
              aria-label={`Remove ${email}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {canAdd ? (
          <Input
            type="text"
            inputMode="email"
            autoComplete="email"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              commitDraft();
            }}
            placeholder={emails.length === 0 ? placeholder : "Add another email"}
          />
        ) : null}
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {hint ?? `Up to ${MAX_NOTICE_EMAILS} emails.`}
      </p>
    </div>
  );
}

export function BuilderEmailPanel({
  formId,
  fields,
  initial,
  ownerEmail,
}: {
  formId: string;
  fields: MergeField[];
  initial: BuilderEmailState;
  ownerEmail: string;
}) {
  const [state, setState] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const tags = [
    ...SMART_FORM_MERGE_TAGS.filter((item) => item.tag !== "{{field_key}}"),
    ...fields.map((field) => ({ tag: `{{${field.fieldKey}}}`, desc: field.label })),
  ].filter((item, index, arr) => arr.findIndex((other) => other.tag === item.tag) === index);
  const reportDetails = REPORT_DETAILS[state.reportFrequency];

  function insert(tag: string, key: "respondentMessageTemplate" | "adminMessageTemplate") {
    setState((prev) => {
      const current = prev[key] || "";
      const separator = current && !/\s$/.test(current) ? " " : "";
      return { ...prev, [key]: `${current}${separator}${tag}` };
    });
  }

  function save() {
    startTransition(async () => {
      const result = await saveSmartFormEmailAutomationAction(formId, JSON.stringify(state));
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Email settings saved");
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 space-y-4 pb-5">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Confirmations, alerts, and scheduled PDF reports for this form.
      </p>

      <InspectorToggle
        checked={state.sendToRespondent}
        onChange={(checked) => setState((s) => ({ ...s, sendToRespondent: checked }))}
        icon={Mail}
        title="Email the respondent"
        description="Send a confirmation when the form collects an email."
      >
        <div className="space-y-2">
          <Label>Subject</Label>
          <Input
            value={state.respondentSubject}
            onChange={(e) => setState((s) => ({ ...s, respondentSubject: e.target.value }))}
            placeholder={DEFAULT_RESPONDENT_EMAIL_SUBJECT}
          />
        </div>
        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            rows={5}
            value={state.respondentMessageTemplate}
            onChange={(e) => setState((s) => ({ ...s, respondentMessageTemplate: e.target.value }))}
            placeholder={DEFAULT_RESPONDENT_EMAIL}
          />
          <InspectorTags tags={tags} onInsert={(tag) => insert(tag, "respondentMessageTemplate")} />
        </div>
      </InspectorToggle>

      <InspectorToggle
        checked={state.sendToAdmin}
        onChange={(checked) => setState((s) => ({ ...s, sendToAdmin: checked }))}
        icon={Bell}
        title="Email you on each submission"
        description="Instant notice when someone files this form."
      >
        <EmailConfirmField
          label="Notify email"
          value={state.adminEmail}
          onChange={(adminEmail) => setState((s) => ({ ...s, adminEmail }))}
          placeholder={ownerEmail || "you@example.com"}
        />
        <div className="space-y-2">
          <Label>Subject</Label>
          <Input
            value={state.adminSubject}
            onChange={(e) => setState((s) => ({ ...s, adminSubject: e.target.value }))}
            placeholder={DEFAULT_ADMIN_EMAIL_SUBJECT}
          />
        </div>
        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            rows={4}
            value={state.adminMessageTemplate}
            onChange={(e) => setState((s) => ({ ...s, adminMessageTemplate: e.target.value }))}
            placeholder={DEFAULT_ADMIN_EMAIL}
          />
          <InspectorTags tags={tags} onInsert={(tag) => insert(tag, "adminMessageTemplate")} />
        </div>
      </InspectorToggle>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex items-start gap-3 px-4 py-4">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              state.reportFrequency !== "NONE"
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            <FileBarChart2 className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Results report</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              Email a PDF of submissions on a schedule.
            </p>
          </div>
        </div>
        <div className="space-y-3.5 border-t bg-muted/20 px-4 py-4">
          <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
            {REPORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setState((s) => ({ ...s, reportFrequency: option.id }))}
                className={cn(
                  "h-9 rounded-lg text-xs font-semibold transition-colors",
                  state.reportFrequency === option.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-primary/15 hover:text-primary",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="space-y-3 rounded-xl border bg-background px-3.5 py-3.5">
            <div>
              <p className="text-sm font-semibold">{reportDetails.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {reportDetails.covers} {reportDetails.when}
              </p>
            </div>
            {reportDetails.includes.length > 0 ? (
              <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                {reportDetails.includes.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <Link
              href={`/dashboard/forms/${formId}/report`}
              className="inline-flex text-xs font-semibold text-primary hover:underline"
            >
              Preview this report
            </Link>
          </div>

          {state.reportFrequency !== "NONE" ? (
            <EmailConfirmField
              label="Send report to"
              value={state.reportEmail}
              onChange={(reportEmail) => setState((s) => ({ ...s, reportEmail }))}
              placeholder={ownerEmail || "you@example.com"}
              hint={`Up to ${MAX_NOTICE_EMAILS} emails. Leave blank to use your account email (${ownerEmail || "not set"}).`}
            />
          ) : null}
        </div>
      </section>
      </div>

      <InspectorSaveBar pending={isPending} label="Save email" onSave={save} />
    </div>
  );
}
