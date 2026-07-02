"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { adminSendMemberOutreachAction } from "@/lib/actions/admin-members";
import {
  MEMBER_OUTREACH_TEMPLATES,
  renderMemberOutreachTemplate,
  type MemberOutreachVars,
} from "@/lib/admin/member-outreach-templates";
import { AdminAlert, AdminCard } from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Mail, MessageSquare, Send } from "lucide-react";

type MemberOutreachPanelProps = {
  userId: string;
  phone: string;
  email: string | null;
  needsOnboarding: boolean;
  vars: MemberOutreachVars;
  flash?: { saved?: string; error?: string };
};

function defaultTemplateId(needsOnboarding: boolean) {
  return needsOnboarding ? "incomplete_registration" : "welcome_check_in";
}

function SendOutreachButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending} className="gap-1.5 h-9">
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Sending…
        </>
      ) : (
        <>
          <Send className="h-4 w-4" />
          Send message
        </>
      )}
    </Button>
  );
}

export function MemberOutreachPanel({
  userId,
  phone,
  email,
  needsOnboarding,
  vars,
  flash,
}: MemberOutreachPanelProps) {
  const [templateId, setTemplateId] = useState(() => defaultTemplateId(needsOnboarding));
  const [sendSms, setSendSms] = useState(true);
  const [sendEmail, setSendEmail] = useState(Boolean(email?.trim()));

  const template = useMemo(
    () => MEMBER_OUTREACH_TEMPLATES.find((t) => t.id === templateId) ?? MEMBER_OUTREACH_TEMPLATES[0],
    [templateId],
  );

  const rendered = useMemo(
    () => renderMemberOutreachTemplate(template, vars),
    [template, vars],
  );

  const [smsBody, setSmsBody] = useState(rendered.sms);
  const [emailSubject, setEmailSubject] = useState(rendered.emailSubject);
  const [emailText, setEmailText] = useState(rendered.emailText);

  function applyTemplate(id: string) {
    setTemplateId(id);
    const next = MEMBER_OUTREACH_TEMPLATES.find((t) => t.id === id) ?? MEMBER_OUTREACH_TEMPLATES[0];
    const content = renderMemberOutreachTemplate(next, vars);
    setSmsBody(content.sms);
    setEmailSubject(content.emailSubject);
    setEmailText(content.emailText);
  }

  const canSendSms = Boolean(phone?.trim());
  const canSendEmail = Boolean(email?.trim());

  return (
    <div className="space-y-3">
      {flash?.error === "outreach_channel" && (
        <AdminAlert variant="warning">Select at least SMS or email.</AdminAlert>
      )}
      {flash?.error === "outreach_no_phone" && (
        <AdminAlert variant="warning">Member has no phone number on file.</AdminAlert>
      )}
      {flash?.error === "outreach_no_email" && (
        <AdminAlert variant="warning">Member has no email on file.</AdminAlert>
      )}
      {(flash?.error === "outreach_sms_failed" || flash?.error === "outreach_email_failed") && (
        <AdminAlert variant="warning">
          Could not send — check mNotify (SMS) or Mailjet (email) in Admin → Providers / General.
        </AdminAlert>
      )}

      <AdminCard
        title="Send SMS & email"
        description="Reach this member with seeded templates or a custom message"
        dense
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {needsOnboarding && (
            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-800 dark:text-amber-200">
              Registration incomplete
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] font-mono">
            {phone}
          </Badge>
          {email ? (
            <Badge variant="outline" className="text-[10px] truncate max-w-[200px]">
              {email}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              No email
            </Badge>
          )}
        </div>

        <form action={adminSendMemberOutreachAction} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="returnTab" value="messaging" />
          <input type="hidden" name="templateId" value={templateId} />

          <div className="space-y-2">
            <Label className="text-xs">Message template</Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {MEMBER_OUTREACH_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-left transition-colors",
                    templateId === t.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border/60 hover:bg-muted/30",
                    t.id === "incomplete_registration" &&
                      needsOnboarding &&
                      templateId !== t.id &&
                      "border-amber-500/30",
                  )}
                >
                  <p className="text-xs font-semibold">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                    {t.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                name="sendSms"
                value="on"
                checked={sendSms}
                onChange={(e) => setSendSms(e.target.checked)}
                disabled={!canSendSms}
                className="rounded border-border"
              />
              <MessageSquare className="h-3.5 w-3.5" />
              SMS {!canSendSms && "(unavailable)"}
            </label>
            <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                name="sendEmail"
                value="on"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                disabled={!canSendEmail}
                className="rounded border-border"
              />
              <Mail className="h-3.5 w-3.5" />
              Email {!canSendEmail && "(unavailable)"}
            </label>
          </div>

          {sendSms && (
            <div className="space-y-1.5">
              <Label htmlFor="outreach-sms" className="text-xs">
                SMS message
              </Label>
              <Textarea
                id="outreach-sms"
                name="smsBody"
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
                rows={3}
                className="text-sm resize-none font-mono"
                required={sendSms}
              />
              <p className="text-[10px] text-muted-foreground">
                Sent from platform mNotify account · {smsBody.length} chars
              </p>
            </div>
          )}

          {sendEmail && (
            <div className="space-y-3 rounded-lg border border-border/50 bg-muted/10 p-3">
              <div className="space-y-1.5">
                <Label htmlFor="outreach-subject" className="text-xs">
                  Email subject
                </Label>
                <Input
                  id="outreach-subject"
                  name="emailSubject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="h-9 text-sm"
                  required={sendEmail}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="outreach-email" className="text-xs">
                  Email body
                </Label>
                <Textarea
                  id="outreach-email"
                  name="emailText"
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  rows={8}
                  className="text-sm resize-y"
                  required={sendEmail}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-1 border-t border-border/40">
            <SendOutreachButton disabled={(!sendSms && !sendEmail) || (sendSms && !smsBody) || (sendEmail && (!emailSubject || !emailText))} />
          </div>
        </form>
      </AdminCard>
    </div>
  );
}
