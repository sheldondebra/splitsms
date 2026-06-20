"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { saveSmartFormAutomationAction } from "@/lib/actions/smart-form-automation";
import {
  applySmartFormMergeTags,
  DEFAULT_ADMIN_SMS,
  DEFAULT_RESPONDENT_SMS,
  SMART_FORM_MERGE_TAGS,
} from "@/lib/smart-forms/merge-tags";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { countSmsUnits } from "@/lib/sms/units";
import { Bell, Loader2, MessageSquare, Save, Send, Tags } from "lucide-react";

export type AutomationState = {
  sendToRespondent: boolean;
  sendToAdmin: boolean;
  adminPhone: string;
  senderId: string;
  respondentMessageTemplate: string;
  adminMessageTemplate: string;
};

type SenderOption = { value: string; label: string; isDefault: boolean };
type MergeField = { fieldKey: string; label: string; dynamicValue?: string };
type TemplateTarget = "respondent" | "admin";

export function FormAutomationPanel({
  formId,
  formName,
  fields,
  initial,
  senders,
  ownerPhone,
  smsCredits,
}: {
  formId: string;
  formName: string;
  fields: MergeField[];
  initial: AutomationState;
  senders: SenderOption[];
  ownerPhone: string;
  smsCredits: number;
}) {
  const [state, setState] = useState(initial);
  const [activeTemplate, setActiveTemplate] = useState<TemplateTarget>("respondent");
  const [isPending, startTransition] = useTransition();

  const samplePreview = useMemo(() => {
    const fieldSamples = fields.map((field) => ({
      fieldKey: field.fieldKey,
      value: sampleValueForField(field),
    }));
    const sampleAnswers = [
      { fieldKey: "full_name", value: "Kwame Mensah" },
      { fieldKey: "phone", value: "+233201234567" },
      { fieldKey: "email", value: "kwame@example.com" },
      ...fieldSamples,
    ];
    const ctx = { formName, submittedAt: new Date(), answers: sampleAnswers, fields };
    return {
      respondent: applySmartFormMergeTags(
        state.respondentMessageTemplate || DEFAULT_RESPONDENT_SMS,
        ctx,
      ),
      admin: applySmartFormMergeTags(state.adminMessageTemplate || DEFAULT_ADMIN_SMS, ctx),
    };
  }, [fields, formName, state.respondentMessageTemplate, state.adminMessageTemplate]);

  const creditEstimate = useMemo(() => {
    let units = 0;
    if (state.sendToRespondent) units += countSmsUnits(samplePreview.respondent);
    if (state.sendToAdmin) units += countSmsUnits(samplePreview.admin);
    return units;
  }, [state.sendToRespondent, state.sendToAdmin, samplePreview]);

  function save() {
    startTransition(async () => {
      const result = await saveSmartFormAutomationAction(formId, JSON.stringify(state));
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Automation settings saved");
    });
  }

  function insertTag(tag: string, target: TemplateTarget = activeTemplate) {
    setState((prev) => {
      const key =
        target === "respondent" ? "respondentMessageTemplate" : "adminMessageTemplate";
      const current = prev[key] || "";
      const separator = current && !/\s$/.test(current) ? " " : "";
      return { ...prev, [key]: `${current}${separator}${tag}` };
    });
  }

  const mergeTags = [
    ...SMART_FORM_MERGE_TAGS.filter((item) => item.tag !== "{{field_key}}").map((item) => ({
      tag: item.tag,
      label: item.desc,
      group: "Basic",
    })),
    ...fields.map((field) => ({
      tag: `{{${field.fieldKey}}}`,
      label: field.label,
      group: field.dynamicValue ? "Mapped field" : "Field",
    })),
  ].filter((item, index, arr) => arr.findIndex((other) => other.tag === item.tag) === index);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-5">
        <AppCard className="overflow-hidden border-primary/10">
          <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <MessageSquare className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold">Sender and delivery</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose the approved Sender ID used for automated SMS replies.
                </p>
              </div>
            </div>
          </div>
          <AppCardBody className="p-5 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="senderId">Approved Sender ID</Label>
              <select
                id="senderId"
                value={state.senderId}
                onChange={(e) => setState((s) => ({ ...s, senderId: e.target.value }))}
                className="flex h-12 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm"
              >
                <option value="">Default approved sender</option>
                {senders.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                    {s.isDefault ? " (default)" : ""}
                  </option>
                ))}
              </select>
              {senders.length === 0 ? (
                <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  Register and approve a Sender ID before SMS automation can send.
                </p>
              ) : null}
            </div>
          </AppCardBody>
        </AppCard>

        <AppCard className="overflow-hidden">
          <AppCardBody className="p-5 sm:p-6 space-y-5">
            <label className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
              <input
                type="checkbox"
                checked={state.sendToRespondent}
                onChange={(e) =>
                  setState((s) => ({ ...s, sendToRespondent: e.target.checked }))
                }
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span>
                <span className="flex items-center gap-2 font-semibold">
                  <Send className="h-4 w-4 text-primary" />
                  Instant SMS to respondent
                </span>
                <span className="text-sm text-muted-foreground">
                  Send a confirmation SMS when someone submits the form.
                </span>
              </span>
            </label>
            {state.sendToRespondent ? (
              <div className="space-y-3">
                <Label>Message template</Label>
                <Textarea
                  rows={4}
                  value={state.respondentMessageTemplate}
                  onFocus={() => setActiveTemplate("respondent")}
                  onChange={(e) =>
                    setState((s) => ({ ...s, respondentMessageTemplate: e.target.value }))
                  }
                  placeholder={DEFAULT_RESPONDENT_SMS}
                  className="min-h-32 rounded-xl"
                />
                <TemplatePreview label="Respondent preview" value={samplePreview.respondent} />
              </div>
            ) : null}
          </AppCardBody>
        </AppCard>

        <AppCard className="overflow-hidden">
          <AppCardBody className="p-5 sm:p-6 space-y-5">
            <label className="flex items-start gap-3 rounded-2xl border bg-muted/20 p-4">
              <input
                type="checkbox"
                checked={state.sendToAdmin}
                onChange={(e) => setState((s) => ({ ...s, sendToAdmin: e.target.checked }))}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span>
                <span className="flex items-center gap-2 font-semibold">
                  <Bell className="h-4 w-4 text-primary" />
                  SMS notification to you
                </span>
                <span className="text-sm text-muted-foreground">
                  Get an alert on your phone when a new submission arrives.
                </span>
              </span>
            </label>
            {state.sendToAdmin ? (
              <>
                <div className="space-y-2">
                  <Label>Admin phone</Label>
                  <Input
                    value={state.adminPhone}
                    onChange={(e) => setState((s) => ({ ...s, adminPhone: e.target.value }))}
                    placeholder={ownerPhone}
                    className="h-12 rounded-xl font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to use your account phone ({ownerPhone}).
                  </p>
                </div>
                <div className="space-y-3">
                  <Label>Admin message template</Label>
                  <Textarea
                    rows={3}
                    value={state.adminMessageTemplate}
                    onFocus={() => setActiveTemplate("admin")}
                    onChange={(e) =>
                      setState((s) => ({ ...s, adminMessageTemplate: e.target.value }))
                    }
                    placeholder={DEFAULT_ADMIN_SMS}
                    className="min-h-28 rounded-xl"
                  />
                  <TemplatePreview label="Admin preview" value={samplePreview.admin} />
                </div>
              </>
            ) : null}
          </AppCardBody>
        </AppCard>

        <Button type="button" className="h-12 gap-2 rounded-xl" disabled={isPending} onClick={save}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save automation
        </Button>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-20 xl:h-fit">
        <AppCard className="overflow-hidden">
          <AppCardBody className="space-y-3 p-5 text-sm">
            <h2 className="font-semibold">Credit estimate</h2>
            <div className="rounded-2xl border bg-muted/30 p-4">
              <p className="text-muted-foreground">Estimated per submission</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">
                {creditEstimate}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  credit{creditEstimate === 1 ? "" : "s"}
                </span>
              </p>
            </div>
            <p className="text-muted-foreground">
              Your balance: <strong className="text-foreground">{smsCredits}</strong> credits
            </p>
            {creditEstimate > smsCredits ? (
              <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                Low balance — submissions will still save, but SMS may fail until you top up.
              </p>
            ) : null}
          </AppCardBody>
        </AppCard>

        <AppCard className="overflow-hidden">
          <div className="border-b bg-muted/30 px-5 py-4">
            <div className="flex items-center gap-2">
              <Tags className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Merge tags</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Click a value to insert it into the selected SMS template.
            </p>
          </div>
          <AppCardBody className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
              {(
                [
                  { id: "respondent", label: "Respondent" },
                  { id: "admin", label: "Admin" },
                ] as const
              ).map((target) => (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => setActiveTemplate(target.id)}
                  className={[
                    "h-9 rounded-lg text-xs font-semibold transition-colors",
                    activeTemplate === target.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {target.label}
                </button>
              ))}
            </div>

            <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">
              {mergeTags.map((item) => (
                <button
                  key={item.tag}
                  type="button"
                  onClick={() => insertTag(item.tag)}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary/10"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {item.group}
                    </span>
                  </span>
                  <code className="mt-1 block text-[11px] text-primary">{item.tag}</code>
                </button>
              ))}
            </div>
          </AppCardBody>
        </AppCard>

        <AppCard>
          <AppCardBody className="p-5 text-xs text-muted-foreground space-y-2">
            <p>
              Responses are always saved even if SMS fails. Failed sends are logged on the
              response and in analytics.
            </p>
            <p>You can retry failed respondent SMS from the response detail page.</p>
          </AppCardBody>
        </AppCard>
      </aside>
    </div>
  );
}

function TemplatePreview({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  );
}

function sampleValueForField(field: MergeField) {
  if (field.dynamicValue === "name" || field.dynamicValue === "first_name" || field.dynamicValue === "last_name") {
    return "Kwame Mensah";
  }
  if (field.dynamicValue === "phone" || field.fieldKey.toLowerCase().includes("phone")) {
    return "+233201234567";
  }
  if (field.dynamicValue === "email" || field.fieldKey.toLowerCase().includes("email")) {
    return "kwame@example.com";
  }
  if (field.fieldKey.toLowerCase().includes("date")) return "2026-06-19";
  return field.label;
}
