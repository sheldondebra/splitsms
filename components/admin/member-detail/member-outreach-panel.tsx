"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { adminSendMemberOutreachAction } from "@/lib/actions/admin-members";
import {
  MEMBER_OUTREACH_TEMPLATES,
  renderMemberOutreachTemplate,
  type MemberOutreachVars,
} from "@/lib/admin/member-outreach-templates";
import { AdminCard } from "@/components/admin/admin-page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  Check,
  ClipboardList,
  Hand,
  LifeBuoy,
  Loader2,
  Mail,
  MessageSquare,
  PenLine,
  Send,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  incomplete_registration: ClipboardList,
  register_sender_id: BadgeCheck,
  top_up_wallet: Wallet,
  welcome_check_in: Hand,
  support_follow_up: LifeBuoy,
  custom: PenLine,
};

type MemberOutreachPanelProps = {
  userId: string;
  phone: string;
  email: string | null;
  needsOnboarding: boolean;
  vars: MemberOutreachVars;
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
            <div className="overflow-hidden rounded-xl border border-border/50 bg-muted/10">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-border/40">
                {MEMBER_OUTREACH_TEMPLATES.map((t) => {
                  const selected = templateId === t.id;
                  const Icon = TEMPLATE_ICONS[t.id] ?? PenLine;
                  const highlightOnboarding =
                    t.id === "incomplete_registration" && needsOnboarding && !selected;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyTemplate(t.id)}
                      aria-pressed={selected}
                      className={cn(
                        "group relative flex items-start gap-2.5 px-3.5 py-3 text-left transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
                        selected
                          ? "bg-primary/[0.06]"
                          : "bg-transparent hover:bg-background/70",
                        highlightOnboarding && "bg-amber-500/[0.04]",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                          selected
                            ? "bg-primary/12 text-primary"
                            : highlightOnboarding
                              ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "text-xs font-semibold leading-tight",
                              selected && "text-primary",
                            )}
                          >
                            {t.label}
                          </span>
                          {selected && (
                            <Check className="h-3 w-3 shrink-0 text-primary" aria-hidden />
                          )}
                        </span>
                        <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
                          {t.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
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
