"use client";

import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { sendSmsAction } from "@/lib/actions/sms";
import { getMessagePreview } from "@/lib/sms/message-preview";
import { SendCostPreview } from "@/components/sms/send-cost-preview";
import { SmsPreview } from "@/components/sms/sms-preview";
import { TEMPLATE_VARIABLES } from "@/lib/sms/personalize";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  FileText,
  Loader2,
  MessageSquare,
  Phone,
  BadgeCheck,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SendTemplateOption = {
  id: string;
  name: string;
  content: string;
};

type SendSmsFormProps = {
  defaultSender: string;
  senderOptions: { value: string }[];
  templates: SendTemplateOption[];
  initialTemplateId?: string;
  defaultCountryCode?: string;
};

function countRecipients(raw: string) {
  return raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean).length;
}

export function SendSmsForm({
  defaultSender,
  senderOptions,
  templates,
  initialTemplateId,
  defaultCountryCode = DEFAULT_COUNTRY_CODE,
}: SendSmsFormProps) {
  const [pending, setPending] = useState(false);
  const [recipients, setRecipients] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId ?? "");
  const [senderId, setSenderId] = useState(senderOptions[0]?.value ?? defaultSender);
  const [countryCode, setCountryCode] = useState(defaultCountryCode);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId],
  );

  useEffect(() => {
    if (!initialTemplateId || templates.length === 0) return;
    const tpl = templates.find((t) => t.id === initialTemplateId);
    if (tpl) {
      setSelectedTemplateId(tpl.id);
      setBody(tpl.content);
    }
  }, [initialTemplateId, templates]);

  function applyTemplate(id: string) {
    setSelectedTemplateId(id);
    if (!id) return;
    const tpl = templates.find((t) => t.id === id);
    if (tpl) setBody(tpl.content);
  }

  function insertVariable(key: string) {
    const token = `{${key}}`;
    setBody((b) => (b ? `${b}${b.endsWith(" ") ? "" : " "}${token}` : token));
  }

  const recipientCount = countRecipients(recipients);
  const preview = useMemo(() => getMessagePreview(body), [body]);
  const hasApprovedSender = senderOptions.length > 0;

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          await sendSmsAction(formData);
        } finally {
          setPending(false);
        }
      }}
      className="grid gap-6 xl:grid-cols-[1fr_minmax(300px,340px)] xl:items-start"
    >
      <div className="space-y-5 min-w-0">
        {/* Sender */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-primary shrink-0" />
            <Label className="text-sm font-semibold">Sender name</Label>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            What recipients see as the message sender.
          </p>
          {hasApprovedSender ? (
            <select
              id="senderId"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              className={cn(
                "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              {senderOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.value}
                </option>
              ))}
            </select>
          ) : (
            <div className="space-y-2">
              <Input
                id="senderId"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                className="h-11 text-base"
                placeholder="e.g. MYBRAND"
              />
              <p className="text-xs text-muted-foreground">
                No approved sender yet.{" "}
                <Link href="/dashboard/sender-ids" className="text-primary font-medium hover:underline">
                  Request a sender ID
                </Link>{" "}
                for production sends.
              </p>
            </div>
          )}
        </div>

        {/* Template */}
        <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <Label htmlFor="template" className="text-sm font-semibold">
                Template
              </Label>
            </div>
            <Link
              href="/dashboard/templates"
              className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
            >
              <Pencil className="h-3 w-3" />
              Manage templates
            </Link>
          </div>
          <select
            id="template"
            value={selectedTemplateId}
            onChange={(e) => applyTemplate(e.target.value)}
            className={cn(
              "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <option value="">Write custom message</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {selectedTemplate ? (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Using <strong>{selectedTemplate.name}</strong> — edit the message below or pick another
              template.
            </p>
          ) : templates.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No templates yet.{" "}
              <Link href="/dashboard/templates" className="text-primary font-medium hover:underline">
                Create templates
              </Link>{" "}
              with placeholders like {"{firstName}"}.
            </p>
          ) : null}
        </div>

        {/* Recipients */}
        <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <Label htmlFor="recipients" className="text-sm font-semibold">
                Phone numbers
              </Label>
            </div>
            {recipientCount > 0 ? (
              <Badge variant="secondary" className="shrink-0">
                {recipientCount} number{recipientCount === 1 ? "" : "s"}
              </Badge>
            ) : null}
          </div>
          <Textarea
            id="recipients"
            name="recipients"
            rows={5}
            required
            value={recipients}
            onChange={(e) => setRecipients(e.target.value)}
            placeholder={"One number per line\ne.g. 233201234567"}
            className="min-h-[130px] resize-y font-mono text-sm sm:text-base"
          />
          <p className="text-xs text-muted-foreground">
            Separate with a new line, comma, or semicolon. Use international format without +.
          </p>
        </div>

        {/* Message */}
        <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary shrink-0" />
              <Label htmlFor="body" className="text-sm font-semibold">
                Message
              </Label>
            </div>
            {body.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[10px]">
                  {preview.characters} chars
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {preview.segments} segment{preview.segments === 1 ? "" : "s"}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {preview.encoding}
                </Badge>
              </div>
            ) : null}
          </div>
          <Textarea
            id="body"
            name="body"
            rows={5}
            required
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (selectedTemplateId && e.target.value !== selectedTemplate?.content) {
                setSelectedTemplateId("");
              }
            }}
            placeholder="Hello {firstName}, your order is ready!"
            className="min-h-[120px] text-base resize-y"
          />
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_VARIABLES.slice(0, 5).map((v) => (
              <Button
                key={v.key}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-md text-[10px] font-mono px-2"
                onClick={() => insertVariable(v.key)}
              >
                {`{${v.key}}`}
              </Button>
            ))}
          </div>
        </div>

        <input type="hidden" name="senderId" value={senderId} />
        <input type="hidden" name="countryCode" value={countryCode} />

        <details className="group rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-muted-foreground select-none">
            Advanced options
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 shrink-0" />
          </summary>
          <div className="mt-4 space-y-3 border-t border-border/60 pt-4">
            <div>
              <Label htmlFor="countryCode">Destination country code</Label>
              <Input
                id="countryCode"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                className="mt-1.5 h-11 text-base font-mono uppercase"
                placeholder="US"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Used for per-country pricing (e.g. US, NG, GLOBAL).
              </p>
            </div>
          </div>
        </details>

        <div className="xl:hidden space-y-4">
          <SmsPreview message={body} senderLabel={senderId} showVariableHints={false} />
          <SendCostPreview message={body} recipientsRaw={recipients} countryCode={countryCode} />
        </div>

        <Button
          type="submit"
          disabled={pending || recipientCount === 0 || !body.trim()}
          className="h-12 w-full text-base font-semibold rounded-xl shadow-sm"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Sending…
            </>
          ) : (
            <>Send to {recipientCount > 0 ? recipientCount : "…"} recipient{recipientCount === 1 ? "" : "s"}</>
          )}
        </Button>
      </div>

      <aside className="hidden xl:block xl:sticky xl:top-20 space-y-5">
        <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm">
          <SmsPreview message={body} senderLabel={senderId} />
        </div>
        <SendCostPreview message={body} recipientsRaw={recipients} countryCode={countryCode} />
      </aside>
    </form>
  );
}
