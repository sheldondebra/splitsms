"use client";

import { useMemo, useState } from "react";
import {
  MEMBER_OUTREACH_TEMPLATES,
  buildMemberOutreachVars,
  renderMemberOutreachTemplate,
} from "@/lib/admin/member-outreach-templates";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Mail, MessageSquare } from "lucide-react";

const MERGE_TAGS = ["{{firstName}}", "{{fullName}}", "{{siteName}}", "{{dashboardUrl}}"];

function ChannelToggle({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof MessageSquare;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20"
          : "border-border/70 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export type OutreachComposeState = {
  templateId: string;
  sendSms: boolean;
  sendEmail: boolean;
  smsBody: string;
  emailSubject: string;
  emailText: string;
};

export function useOutreachCompose(initialTemplateId = "welcome_check_in") {
  const previewVars = buildMemberOutreachVars({ fullName: "Member" });
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [sendSms, setSendSms] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [activePane, setActivePane] = useState<"sms" | "email">("sms");

  const template = useMemo(
    () => MEMBER_OUTREACH_TEMPLATES.find((t) => t.id === templateId) ?? MEMBER_OUTREACH_TEMPLATES[0],
    [templateId],
  );

  const rendered = useMemo(
    () => renderMemberOutreachTemplate(template, previewVars),
    [template, previewVars],
  );

  const [smsBody, setSmsBody] = useState(rendered.sms);
  const [emailSubject, setEmailSubject] = useState(rendered.emailSubject);
  const [emailText, setEmailText] = useState(rendered.emailText);

  function applyTemplate(id: string) {
    setTemplateId(id);
    const next = MEMBER_OUTREACH_TEMPLATES.find((t) => t.id === id) ?? MEMBER_OUTREACH_TEMPLATES[0];
    const content = renderMemberOutreachTemplate(next, previewVars);
    setSmsBody(content.sms);
    setEmailSubject(content.emailSubject);
    setEmailText(content.emailText);
  }

  const canSubmit =
    (sendSms || sendEmail) &&
    (!sendSms || smsBody.trim().length > 0) &&
    (!sendEmail || (emailSubject.trim() && emailText.trim()));

  return {
    templateId,
    template,
    sendSms,
    setSendSms,
    sendEmail,
    setSendEmail,
    activePane,
    setActivePane,
    smsBody,
    setSmsBody,
    emailSubject,
    setEmailSubject,
    emailText,
    setEmailText,
    applyTemplate,
    canSubmit,
  };
}

export function AdminOutreachComposeFields({
  compose,
  idPrefix = "outreach",
  showMergeTags = true,
  personalizedHint = "Names and links are filled in automatically for each recipient.",
}: {
  compose: ReturnType<typeof useOutreachCompose>;
  idPrefix?: string;
  showMergeTags?: boolean;
  personalizedHint?: string;
}) {
  const {
    templateId,
    template,
    sendSms,
    setSendSms,
    sendEmail,
    setSendEmail,
    activePane,
    setActivePane,
    smsBody,
    setSmsBody,
    emailSubject,
    setEmailSubject,
    emailText,
    setEmailText,
    applyTemplate,
  } = compose;

  return (
    <div className="space-y-5">
      <section className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Template
          </Label>
          <span className="text-[10px] text-muted-foreground">{template.description}</span>
        </div>
        <div className="grid max-h-[148px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {MEMBER_OUTREACH_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t.id)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition-all",
                templateId === t.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/15"
                  : "border-border/60 bg-background hover:border-primary/25 hover:bg-muted/20",
              )}
            >
              <p className="text-xs font-semibold leading-tight">{t.label}</p>
              <p className="mt-1 text-[10px] leading-snug text-muted-foreground line-clamp-2">
                {t.description}
              </p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Channels
        </Label>
        <div className="flex flex-wrap gap-2">
          <ChannelToggle
            active={sendSms}
            onClick={() => {
              const next = !sendSms;
              setSendSms(next);
              if (next) setActivePane("sms");
              else if (!next && activePane === "sms" && sendEmail) setActivePane("email");
            }}
            icon={MessageSquare}
            label="SMS"
          />
          <ChannelToggle
            active={sendEmail}
            onClick={() => {
              const next = !sendEmail;
              setSendEmail(next);
              if (next) setActivePane("email");
              else if (!next && activePane === "email" && sendSms) setActivePane("sms");
            }}
            icon={Mail}
            label="Email"
          />
          {sendSms && sendEmail && (
            <>
              <span className="mx-1 hidden h-5 w-px bg-border sm:inline" />
              <ChannelToggle
                active={activePane === "sms"}
                onClick={() => setActivePane("sms")}
                icon={MessageSquare}
                label="Edit SMS"
              />
              <ChannelToggle
                active={activePane === "email"}
                onClick={() => setActivePane("email")}
                icon={Mail}
                label="Edit email"
              />
            </>
          )}
        </div>
        {!sendSms && !sendEmail && (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Turn on at least one channel to send.
          </p>
        )}
      </section>

      {sendSms && (!sendEmail || activePane === "sms") && (
        <section className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-3.5">
          <Label htmlFor={`${idPrefix}-sms`} className="text-xs font-semibold">
            SMS message
          </Label>
          <Textarea
            id={`${idPrefix}-sms`}
            value={smsBody}
            onChange={(e) => setSmsBody(e.target.value)}
            rows={4}
            className="resize-none border-border/50 bg-background text-sm font-mono leading-relaxed"
          />
          <p className="text-[10px] text-muted-foreground">
            Sent via platform mNotify · {smsBody.length} characters · {personalizedHint}
          </p>
        </section>
      )}

      {sendEmail && (!sendSms || activePane === "email") && (
        <section className="space-y-3 rounded-xl border border-border/60 bg-muted/10 p-3.5">
          <Label className="text-xs font-semibold">Email message</Label>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-subject`} className="text-[11px] text-muted-foreground">
              Subject
            </Label>
            <Input
              id={`${idPrefix}-subject`}
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              className="h-9 bg-background text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-email`} className="text-[11px] text-muted-foreground">
              Body
            </Label>
            <Textarea
              id={`${idPrefix}-email`}
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              rows={6}
              className="resize-y bg-background text-sm leading-relaxed"
            />
          </div>
        </section>
      )}

      {showMergeTags && (
        <div className="flex flex-wrap gap-1.5">
          {MERGE_TAGS.map((tag) => (
            <code
              key={tag}
              className="rounded-md border border-border/50 bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {tag}
            </code>
          ))}
        </div>
      )}
    </div>
  );
}

export function OutreachComposeHiddenFields({
  compose,
}: {
  compose: ReturnType<typeof useOutreachCompose>;
}) {
  return (
    <>
      <input type="hidden" name="templateId" value={compose.templateId} />
      {compose.sendSms && <input type="hidden" name="sendSms" value="on" />}
      {compose.sendEmail && <input type="hidden" name="sendEmail" value="on" />}
      <input type="hidden" name="smsBody" value={compose.smsBody} />
      <input type="hidden" name="emailSubject" value={compose.emailSubject} />
      <input type="hidden" name="emailText" value={compose.emailText} />
    </>
  );
}
