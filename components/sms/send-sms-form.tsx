"use client";

import { DEFAULT_COUNTRY_CODE } from "@/lib/constants/defaults";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveSendDraftAction, sendSmsAction } from "@/lib/actions/sms";
import {
  clearSendCompose,
  hasSendComposeContent,
  loadSendCompose,
  persistSendCompose,
  type SendComposeSnapshot,
} from "@/lib/sms/send-compose-storage";
import { getMessagePreview } from "@/lib/sms/message-preview";
import { SendCostPreview } from "@/components/sms/send-cost-preview";
import { SmsSchedulePicker, isSmsScheduledForLater } from "@/components/sms/sms-schedule-picker";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Clock3,
  FileText,
  Globe,
  Loader2,
  MessageSquare,
  Phone,
  Pencil,
  CheckCircle2,
  Send,
  Bookmark,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SendTemplateOption = {
  id: string;
  name: string;
  content: string;
};

export type SendDraftInitial = {
  id: string;
  name: string;
  recipientsText: string;
  body: string;
  senderId: string;
  countryCode: string;
  scheduledAt: string | null;
};

export type SendDraftOption = {
  id: string;
  name: string;
  message: string;
  recipientCount: number;
  updatedAt: string;
};

export type SendPricingOption = {
  countryCode: string;
  countryName: string;
};

type SendSmsFormProps = {
  userId: string;
  registeredSenders: RegisteredSenderOption[];
  allowPlatformSearch?: boolean;
  templates: SendTemplateOption[];
  pricingCountries?: SendPricingOption[];
  initialTemplateId?: string;
  initialRecipients?: string;
  defaultCountryCode?: string;
  initialDraft?: SendDraftInitial | null;
  savedDrafts?: SendDraftOption[];
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

function pickDefaultSender(registeredSenders: RegisteredSenderOption[], preferred?: string) {
  if (preferred) return preferred;
  const approved = registeredSenders.filter((s) => s.status === "APPROVED");
  const picked = approved.find((s) => s.isDefault)?.value ?? approved[0]?.value;
  if (picked) return picked;
  return registeredSenders.find((s) => s.status === "PENDING")?.value ?? "";
}

export function SendSmsForm({
  userId,
  registeredSenders,
  allowPlatformSearch = false,
  templates,
  pricingCountries = [],
  initialTemplateId,
  initialRecipients = "",
  defaultCountryCode = DEFAULT_COUNTRY_CODE,
  initialDraft = null,
  savedDrafts = [],
  contacts = [],
  contactGroups = [],
  totalContacts = 0,
}: SendSmsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSavingDraft, startSaveDraft] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);
  const [restoredNotice, setRestoredNotice] = useState<"local" | "draft" | null>(
    initialDraft ? "draft" : null,
  );
  const restoredFromStorageRef = useRef(false);
  const [lastSent, setLastSent] = useState<
    | { count: number; credits: number; scheduled?: false }
    | { count: number; credits: number; scheduled: true; scheduledAt: string; campaignId: string }
    | null
  >(null);
  const initialTpl = initialTemplateId
    ? templates.find((t) => t.id === initialTemplateId)
    : undefined;
  const [recipients, setRecipients] = useState(
    initialDraft?.recipientsText ?? initialRecipients,
  );
  const [recipientChips, setRecipientChips] = useState<RecipientChip[]>([]);
  const [body, setBody] = useState(initialDraft?.body ?? initialTpl?.content ?? "");
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplateId ?? "");
  const [senderId, setSenderId] = useState(() =>
    pickDefaultSender(registeredSenders, initialDraft?.senderId),
  );
  const [countryCode, setCountryCode] = useState(
    initialDraft?.countryCode ?? defaultCountryCode,
  );
  const [scheduledAt, setScheduledAt] = useState(initialDraft?.scheduledAt ?? "");
  const [scheduleResetKey, setScheduleResetKey] = useState(0);
  const [draftCampaignId, setDraftCampaignId] = useState(initialDraft?.id ?? "");

  const applySavedSnapshot = useCallback((saved: SendComposeSnapshot) => {
    if (!initialRecipients) setRecipients(saved.recipients);
    if (!initialTemplateId) {
      setBody(saved.body);
      setSelectedTemplateId(saved.selectedTemplateId);
    }
    if (saved.senderId) setSenderId(saved.senderId);
    if (!initialDraft) setCountryCode(saved.countryCode || defaultCountryCode);
    setScheduledAt(saved.scheduledAt);
    if (saved.draftCampaignId) setDraftCampaignId(saved.draftCampaignId);
  }, [defaultCountryCode, initialDraft, initialRecipients, initialTemplateId]);

  useEffect(() => {
    if (initialDraft || restoredFromStorageRef.current) return;
    restoredFromStorageRef.current = true;

    const saved = loadSendCompose(userId);
    if (!saved) return;

    const timer = window.setTimeout(() => {
      applySavedSnapshot(saved);
      setRestoredNotice("local");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [applySavedSnapshot, initialDraft, userId]);

  const composeSnapshot = useMemo<SendComposeSnapshot>(
    () => ({
      recipients,
      body,
      senderId,
      countryCode,
      selectedTemplateId,
      scheduledAt,
      draftCampaignId,
      savedAt: new Date().toISOString(),
    }),
    [body, countryCode, draftCampaignId, recipients, scheduledAt, selectedTemplateId, senderId],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!hasSendComposeContent(composeSnapshot)) {
        clearSendCompose(userId);
        return;
      }
      persistSendCompose(userId, composeSnapshot);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [composeSnapshot, userId]);

  const canSaveDraft = Boolean(body.trim() || recipients.trim());

  const countryOptions = useMemo(() => {
    const options = [...pricingCountries];
    const code = countryCode.toUpperCase();
    if (code && !options.some((o) => o.countryCode === code)) {
      options.unshift({ countryCode: code, countryName: code });
    }
    return options;
  }, [countryCode, pricingCountries]);

  const isScheduling = useMemo(() => isSmsScheduledForLater(scheduledAt), [scheduledAt]);

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

  function resetCompose() {
    setRecipients("");
    setRecipientChips([]);
    setBody("");
    setSelectedTemplateId("");
    setScheduledAt("");
    setScheduleResetKey((k) => k + 1);
    setDraftCampaignId("");
    setRestoredNotice(null);
    clearSendCompose(userId);
  }

  function handleDiscard() {
    resetCompose();
    if (initialDraft) {
      router.replace("/dashboard/send");
    }
    toast.success("Message cleared", {
      description: "Your compose draft was removed from this page.",
    });
  }

  function handleSaveDraft() {
    if (!canSaveDraft) return;

    const form = document.getElementById("send-sms-form") as HTMLFormElement | null;
    if (!form) return;

    const formData = new FormData(form);
    if (draftCampaignId) {
      formData.set("draftId", draftCampaignId);
    }

    const toastId = toast.loading("Saving draft…");
    startSaveDraft(async () => {
      try {
        const result = await saveSendDraftAction(formData);
        if (!result.ok) {
          toast.error("Could not save draft", {
            id: toastId,
            description: friendlyError(result.error),
          });
          return;
        }

        setDraftCampaignId(result.draftId);
        clearSendCompose(userId);
        setRestoredNotice(null);
        toast.success("Draft saved", {
          id: toastId,
          description: "You can continue later from Send SMS or Campaigns.",
          duration: 5000,
          action: {
            label: "View campaigns",
            onClick: () => router.push("/dashboard/campaigns?status=DRAFT"),
          },
        });
        router.replace(`/dashboard/send?draft=${result.draftId}`);
        router.refresh();
      } catch {
        toast.error("Could not save draft", {
          id: toastId,
          description: "Please try again in a moment.",
        });
      }
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setShowSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const count = recipientCount;
    const toastId = toast.loading(
      isScheduling ? "Scheduling your messages…" : "Sending your messages…",
      {
        description: isScheduling
          ? `${count} message${count === 1 ? "" : "s"} for ${new Date(scheduledAt).toLocaleString()}`
          : `Queuing ${count} message${count === 1 ? "" : "s"} via ${senderId}`,
      },
    );

    startTransition(async () => {
      try {
        const result = await sendSmsAction(formData);

        if (result.ok) {
          if (result.scheduled) {
            setLastSent({
              count: result.recipientCount,
              credits: result.estimatedCredits,
              scheduled: true,
              scheduledAt: result.scheduledAt,
              campaignId: result.campaignId,
            });
          } else {
            setLastSent({
              count: result.recipientCount,
              credits: result.creditsUsed,
            });
          }
          setShowSuccess(true);
          resetCompose();

          if (result.scheduled) {
            const when = new Date(result.scheduledAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });
            toast.success("Messages scheduled!", {
              id: toastId,
              description: `${result.recipientCount} recipient${result.recipientCount === 1 ? "" : "s"} · ${when}`,
              duration: 6000,
              action: {
                label: "View campaigns",
                onClick: () => router.push("/dashboard/campaigns"),
              },
            });
          } else {
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
          }
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
  const savingDraft = isSavingDraft;

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
            <p className="mt-5 text-lg font-semibold">
              {isScheduling ? "Scheduling messages…" : "Sending messages…"}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {isScheduling
                ? `Setting up ${recipientCount} message${recipientCount === 1 ? "" : "s"} for later`
                : `Delivering to ${recipientCount} recipient${recipientCount === 1 ? "" : "s"}`}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">This usually takes a few seconds</p>
          </div>
        </div>
      )}

      <form
        id="send-sms-form"
        onSubmit={handleSubmit}
        className="grid gap-6 xl:grid-cols-[1fr_minmax(300px,340px)] xl:items-start"
      >
        <div className="space-y-5 min-w-0">
          {restoredNotice && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3.5"
            >
              <Bookmark className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {restoredNotice === "draft"
                    ? initialDraft
                      ? `Editing saved draft: ${initialDraft.name}`
                      : "Editing saved draft"
                    : "We restored your unsent message"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {restoredNotice === "draft"
                    ? "Changes auto-save locally until you send or discard."
                    : "Your message is kept while you browse the dashboard. Send, save as draft, or discard to clear."}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
                onClick={() => setRestoredNotice(null)}
                aria-label="Dismiss notice"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {savedDrafts.length > 0 && !initialDraft && (
            <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3.5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Saved drafts
              </p>
              <div className="flex flex-wrap gap-2">
                {savedDrafts.map((draft) => (
                  <Link
                    key={draft.id}
                    href={`/dashboard/send?draft=${draft.id}`}
                    className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-left text-xs hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{draft.name}</span>
                      <span className="block truncate text-muted-foreground">
                        {draft.recipientCount} recipient{draft.recipientCount === 1 ? "" : "s"}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {showSuccess && lastSent && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-4 animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                  {lastSent.scheduled ? "Messages scheduled" : "Messages queued successfully"}
                </p>
                <p className="text-sm text-emerald-800/90 dark:text-emerald-200/90 mt-0.5">
                  {lastSent.scheduled ? (
                    <>
                      {lastSent.count} recipient{lastSent.count === 1 ? "" : "s"} ·{" "}
                      {new Date(lastSent.scheduledAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" · "}
                      ~{lastSent.credits} credit{lastSent.credits === 1 ? "" : "s"} at send time
                    </>
                  ) : (
                    <>
                      Sent to {lastSent.count} recipient{lastSent.count === 1 ? "" : "s"} ·{" "}
                      {lastSent.credits} credit{lastSent.credits === 1 ? "" : "s"} used
                    </>
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {lastSent.scheduled ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                      render={<Link href="/dashboard/campaigns" />}
                    >
                      View campaigns
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 border-emerald-500/30 text-emerald-800 dark:text-emerald-200"
                    onClick={() => setShowSuccess(false)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}

          <SendSmsSenderField
            registeredSenders={registeredSenders}
            value={senderId}
            onChange={setSenderId}
            disabled={pending}
            allowPlatformSearch={allowPlatformSearch}
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
            <div className="space-y-1.5 pt-1">
              <p className="text-xs font-medium text-muted-foreground">Personalize your message</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tap a tag to insert it. Saved contacts get their own name, phone, and other details
                filled in automatically.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {TEMPLATE_VARIABLES.slice(0, 5).map((v) => (
                  <Button
                    key={v.key}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    className="h-7 rounded-md text-[10px] font-mono px-2"
                    onClick={() => insertVariable(v.key)}
                    title={`Insert ${v.label} — e.g. ${v.example}`}
                  >
                    {`{${v.key}}`}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <input type="hidden" name="senderId" value={senderId} />
          {draftCampaignId ? (
            <input type="hidden" name="draftId" value={draftCampaignId} />
          ) : null}

          <SmsSchedulePicker
            key={scheduleResetKey}
            value={scheduledAt}
            onChange={setScheduledAt}
            disabled={pending}
          />

          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3.5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-2.5">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <Label htmlFor="countryCode" className="text-sm font-medium">
                    Destination country
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    Used for per-country pricing in your cost estimate.
                  </p>
                </div>
              </div>
              <select
                id="countryCode"
                name="countryCode"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={pending || countryOptions.length === 0}
                className={cn(
                  "flex h-10 w-full shrink-0 rounded-lg border border-input bg-background px-3 text-sm sm:w-auto sm:min-w-[200px]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {countryOptions.length === 0 ? (
                  <option value={countryCode}>{countryCode}</option>
                ) : (
                  countryOptions.map((country) => (
                    <option key={country.countryCode} value={country.countryCode}>
                      {country.countryName} ({country.countryCode})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="xl:hidden space-y-4">
            <SmsPreview message={body} senderLabel={senderId} showVariableHints={false} />
            <SendCostPreview message={body} recipientsRaw={recipients} countryCode={countryCode} />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={pending || savingDraft || !hasSendComposeContent(composeSnapshot)}
                className="h-11 flex-1 sm:flex-none rounded-xl"
                onClick={handleDiscard}
              >
                Discard
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending || savingDraft || !canSaveDraft}
                className="h-11 flex-1 sm:flex-none rounded-xl gap-2"
                onClick={handleSaveDraft}
              >
                {savingDraft ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Bookmark className="h-4 w-4" />
                    Save draft
                  </>
                )}
              </Button>
            </div>
            <Button
              type="submit"
              disabled={pending || savingDraft || recipientCount === 0 || hasInvalidRecipients || !body.trim() || !canUseSender}
              className="h-12 flex-1 sm:flex-[1.4] text-base font-semibold rounded-xl shadow-sm gap-2"
            >
              {pending ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isScheduling ? "Scheduling…" : "Sending…"}
                </>
              ) : isScheduling ? (
                <>
                  <Clock3 className="h-5 w-5" />
                  Schedule for {recipientCount > 0 ? recipientCount : "…"} recipient
                  {recipientCount === 1 ? "" : "s"}
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
