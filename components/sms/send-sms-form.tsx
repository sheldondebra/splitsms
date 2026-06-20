"use client";

import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendSmsAction } from "@/lib/actions/sms";
import { getMessagePreview } from "@/lib/sms/message-preview";
import { SendCostPreview } from "@/components/sms/send-cost-preview";
import { SmsPreview } from "@/components/sms/sms-preview";
import {
  SendSmsSenderField,
  isApprovedSenderSelection,
  type RegisteredSenderOption,
} from "@/components/sms/send-sms-sender-field";
import {
  RecipientChipInput,
  type RecipientChip,
} from "@/components/sms/recipient-chip-input";
import { ContactPickerTrigger } from "@/components/sms/contact-picker-dialog";
import type {
  SendContactGroupOption,
  SendContactOption,
} from "@/lib/contacts/send-picker";
import {
  splitRecipientInput,
  validateRecipientPhone,
} from "@/lib/sms/phone-validation";
import { TEMPLATE_VARIABLES } from "@/lib/sms/personalize";
import { friendlyError } from "@/lib/ux/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ChevronDown,
  FileText,
  Loader2,
  MessageSquare,
  Phone,
  Pencil,
  CheckCircle2,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SendTemplateOption = {
  id: string;
  name: string;
  content: string;
};

type SendSmsFormProps = {
  registeredSenders: RegisteredSenderOption[];
  templates: SendTemplateOption[];
  initialTemplateId?: string;
  initialRecipients?: string;
  defaultCountryCode?: string;
  contacts?: SendContactOption[];
  contactGroups?: SendContactGroupOption[];
  totalContacts?: number;
};

function validRecipientCount(chips: RecipientChip[]) {
  return chips.filter((c) => c.valid).length;
}

function mergeRecipientPhones(existing: string, phones: string[]): string {
  const seen = new Set(
    splitRecipientInput(existing).map(
      (p) => validateRecipientPhone(p).display || p.replace(/\D/g, ""),
    ),
  );
  const merged = splitRecipientInput(existing);
  for (const phone of phones) {
    const display = validateRecipientPhone(phone).display || phone.replace(/^\+/, "");
    const key = display.replace(/\D/g, "") || display;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(display);
  }
  return merged.join("\n");
}

export function SendSmsForm({
  registeredSenders,
  templates,
  initialTemplateId,
  initialRecipients = "",
  defaultCountryCode = DEFAULT_COUNTRY_CODE,
  contacts = [],
  contactGroups = [],
  totalContacts = 0,
}: SendSmsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSent, setLastSent] = useState<{ count: number; credits: number } | null>(null);
  const initialTpl = initialTemplateId
    ? templates.find((t) => t.id === initialTemplateId)
    : undefined;
  const [recipients, setRecipients] = useState(initialRecipients);
  const [recipientChips, setRecipientChips] = useState<RecipientChip[]>([]);
  const [body, setBody] = useState(initialTpl?.content ?? "");
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId ?? "");
  const [senderId, setSenderId] = useState(() => {
    const approved = registeredSenders.filter((s) => s.status === "APPROVED");
    const picked = approved.find((s) => s.isDefault)?.value ?? approved[0]?.value;
    if (picked) return picked;
    return registeredSenders.find((s) => s.status === "PENDING")?.value ?? "";
  });
  const [countryCode, setCountryCode] = useState(defaultCountryCode);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId],
  );

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

  const recipientCount = validRecipientCount(recipientChips);
  const invalidRecipientCount = recipientChips.length - recipientCount;
  const hasInvalidRecipients = invalidRecipientCount > 0;
  const preview = useMemo(() => getMessagePreview(body), [body]);
  const canUseSender = isApprovedSenderSelection(senderId, registeredSenders);

  function addContactsFromPicker(phones: string[]) {
    if (phones.length === 0) return;
    setRecipients((prev) => mergeRecipientPhones(prev, phones));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setShowSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const count = recipientCount;
    const toastId = toast.loading("Sending your messages…", {
      description: `Queuing ${count} message${count === 1 ? "" : "s"} via ${senderId}`,
    });

    startTransition(async () => {
      try {
        const result = await sendSmsAction(formData);

        if (result.ok) {
          setLastSent({ count: result.recipientCount, credits: result.creditsUsed });
          setShowSuccess(true);
          setRecipients("");
          setRecipientChips([]);
          setBody("");
          setSelectedTemplateId("");

          toast.success("Messages sent successfully!", {
            id: toastId,
            description: `${result.recipientCount} recipient${result.recipientCount === 1 ? "" : "s"} · ${result.creditsUsed} credit${result.creditsUsed === 1 ? "" : "s"} used`,
            duration: 6000,
            action: {
              label: "View report",
              onClick: () =>
                router.push(`/dashboard/reports?campaign=${result.campaignId}`),
            },
          });
          router.refresh();
          return;
        }

        toast.error("Could not send messages", {
          id: toastId,
          description: friendlyError(result.error),
          duration: 5000,
        });
      } catch {
        toast.error("Something went wrong", {
          id: toastId,
          description: "Please try again in a moment.",
        });
      }
    });
  }

  const pending = isPending;

  return (
    <>
      {pending && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/75 backdrop-blur-sm px-4"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-card p-8 shadow-xl text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
            <p className="mt-5 text-lg font-semibold">Sending messages…</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Delivering to {recipientCount} recipient{recipientCount === 1 ? "" : "s"}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">This usually takes a few seconds</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid gap-6 xl:grid-cols-[1fr_minmax(300px,340px)] xl:items-start"
      >
        <div className="space-y-5 min-w-0">
          {showSuccess && lastSent && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-4 animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                  Messages queued successfully
                </p>
                <p className="text-sm text-emerald-800/90 dark:text-emerald-200/90 mt-0.5">
                  Sent to {lastSent.count} recipient{lastSent.count === 1 ? "" : "s"} ·{" "}
                  {lastSent.credits} credit{lastSent.credits === 1 ? "" : "s"} used
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 h-8 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                  onClick={() => setShowSuccess(false)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          <SendSmsSenderField
            registeredSenders={registeredSenders}
            value={senderId}
            onChange={setSenderId}
            disabled={pending}
          />

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
              disabled={pending}
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
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <Label htmlFor="recipients" className="text-sm font-semibold">
                  Phone numbers
                </Label>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <ContactPickerTrigger
                  contacts={contacts}
                  groups={contactGroups}
                  totalContacts={totalContacts}
                  onAdd={addContactsFromPicker}
                  disabled={pending}
                />
                {recipientChips.length > 0 ? (
                  <div className="flex items-center gap-1.5">
                    {recipientCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 border-0"
                      >
                        {recipientCount} valid
                      </Badge>
                    )}
                    {hasInvalidRecipients && (
                      <Badge
                        variant="secondary"
                        className="bg-red-500/15 text-red-800 dark:text-red-200 border-0"
                      >
                        {invalidRecipientCount} invalid
                      </Badge>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
            <RecipientChipInput
              id="recipients"
              name="recipients"
              value={recipients}
              onChange={(value, chips) => {
                setRecipients(value);
                setRecipientChips(chips);
              }}
              disabled={pending}
              placeholder="233201234567 then Space or comma"
            />
            {hasInvalidRecipients && (
              <p className="text-xs text-red-700 dark:text-red-400">
                Remove or fix invalid numbers before sending.
              </p>
            )}
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
              disabled={pending}
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
                  disabled={pending}
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
                  disabled={pending}
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
            disabled={pending || recipientCount === 0 || hasInvalidRecipients || !body.trim() || !canUseSender}
            className="h-12 w-full text-base font-semibold rounded-xl shadow-sm gap-2"
          >
            {pending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Send to {recipientCount > 0 ? recipientCount : "…"} recipient
                {recipientCount === 1 ? "" : "s"}
              </>
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
    </>
  );
}
