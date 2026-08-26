"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveSmartFormAutomationAction } from "@/lib/actions/smart-form-automation";
import {
  DEFAULT_ADMIN_SMS,
  DEFAULT_RESPONDENT_SMS,
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
import { Bell, MessageSquare } from "lucide-react";

export type BuilderSmsState = {
  sendToRespondent: boolean;
  sendToAdmin: boolean;
  adminPhone: string;
  senderId: string;
  respondentMessageTemplate: string;
  adminMessageTemplate: string;
};

type MergeField = { fieldKey: string; label: string };
type SenderOption = { value: string; label: string; isDefault: boolean };

export function BuilderSmsPanel({
  formId,
  fields,
  initial,
  senders,
  ownerPhone,
  smsCredits,
}: {
  formId: string;
  fields: MergeField[];
  initial: BuilderSmsState;
  senders: SenderOption[];
  ownerPhone: string;
  smsCredits: number;
}) {
  const [state, setState] = useState(initial);
  const [isPending, startTransition] = useTransition();

  function insertTag(tag: string, key: "respondentMessageTemplate" | "adminMessageTemplate") {
    setState((prev) => {
      const current = prev[key] || "";
      const separator = current && !/\s$/.test(current) ? " " : "";
      return { ...prev, [key]: `${current}${separator}${tag}` };
    });
  }

  const tags = [
    ...SMART_FORM_MERGE_TAGS.filter((item) => item.tag !== "{{field_key}}"),
    ...fields.map((field) => ({ tag: `{{${field.fieldKey}}}`, desc: field.label })),
  ].filter((item, index, arr) => arr.findIndex((other) => other.tag === item.tag) === index);

  function save() {
    startTransition(async () => {
      const result = await saveSmartFormAutomationAction(formId, JSON.stringify(state));
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("SMS settings saved");
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex-1 space-y-4 pb-5">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Confirmation and alert texts for this form. Uses your SMS credits.
      </p>

      <div className="space-y-2 rounded-2xl border bg-card p-4">
        <Label>Sender ID</Label>
        <select
          value={state.senderId}
          onChange={(e) => setState((s) => ({ ...s, senderId: e.target.value }))}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
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
          <p className="text-xs text-destructive">Approve a Sender ID before SMS can send.</p>
        ) : (
          <p className="text-xs text-muted-foreground">{smsCredits.toLocaleString()} SMS credits available</p>
        )}
      </div>

      <InspectorToggle
        checked={state.sendToRespondent}
        onChange={(checked) => setState((s) => ({ ...s, sendToRespondent: checked }))}
        icon={MessageSquare}
        title="SMS to respondent"
        description="Confirmation text after they submit."
      >
        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            rows={4}
            value={state.respondentMessageTemplate}
            onChange={(e) => setState((s) => ({ ...s, respondentMessageTemplate: e.target.value }))}
            placeholder={DEFAULT_RESPONDENT_SMS}
          />
          <InspectorTags tags={tags} onInsert={(tag) => insertTag(tag, "respondentMessageTemplate")} />
        </div>
      </InspectorToggle>

      <InspectorToggle
        checked={state.sendToAdmin}
        onChange={(checked) => setState((s) => ({ ...s, sendToAdmin: checked }))}
        icon={Bell}
        title="SMS to you"
        description="Alert your phone on each submission."
      >
        <div className="space-y-2">
          <Label>Admin phone</Label>
          <Input
            value={state.adminPhone}
            onChange={(e) => setState((s) => ({ ...s, adminPhone: e.target.value }))}
            placeholder={ownerPhone}
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea
            rows={3}
            value={state.adminMessageTemplate}
            onChange={(e) => setState((s) => ({ ...s, adminMessageTemplate: e.target.value }))}
            placeholder={DEFAULT_ADMIN_SMS}
          />
          <InspectorTags tags={tags} onInsert={(tag) => insertTag(tag, "adminMessageTemplate")} />
        </div>
      </InspectorToggle>
      </div>

      <InspectorSaveBar pending={isPending} label="Save SMS" onSave={save} />
    </div>
  );
}
