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
import { Loader2, MessageSquare, Save } from "lucide-react";

export type AutomationState = {
  sendToRespondent: boolean;
  sendToAdmin: boolean;
  adminPhone: string;
  senderId: string;
  respondentMessageTemplate: string;
  adminMessageTemplate: string;
};

type SenderOption = { value: string; label: string; isDefault: boolean };

export function FormAutomationPanel({
  formId,
  formName,
  initial,
  senders,
  ownerPhone,
  smsCredits,
}: {
  formId: string;
  formName: string;
  initial: AutomationState;
  senders: SenderOption[];
  ownerPhone: string;
  smsCredits: number;
}) {
  const [state, setState] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const samplePreview = useMemo(() => {
    const sampleAnswers = [
      { fieldKey: "full_name", value: "Kwame Mensah" },
      { fieldKey: "phone", value: "+233201234567" },
      { fieldKey: "email", value: "kwame@example.com" },
    ];
    const ctx = { formName, submittedAt: new Date(), answers: sampleAnswers };
    return {
      respondent: applySmartFormMergeTags(
        state.respondentMessageTemplate || DEFAULT_RESPONDENT_SMS,
        ctx,
      ),
      admin: applySmartFormMergeTags(state.adminMessageTemplate || DEFAULT_ADMIN_SMS, ctx),
    };
  }, [formName, state.respondentMessageTemplate, state.adminMessageTemplate]);

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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <AppCard>
          <AppCardBody className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h2 className="font-semibold">Sender ID</h2>
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderId">Approved Sender ID</Label>
              <select
                id="senderId"
                value={state.senderId}
                onChange={(e) => setState((s) => ({ ...s, senderId: e.target.value }))}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
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
                <p className="text-xs text-destructive">
                  Register and approve a Sender ID before SMS automation can send.
                </p>
              ) : null}
            </div>
          </AppCardBody>
        </AppCard>

        <AppCard>
          <AppCardBody className="p-5 sm:p-6 space-y-4">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={state.sendToRespondent}
                onChange={(e) =>
                  setState((s) => ({ ...s, sendToRespondent: e.target.checked }))
                }
                className="mt-1"
              />
              <span>
                <span className="font-semibold block">Instant SMS to respondent</span>
                <span className="text-sm text-muted-foreground">
                  Send a confirmation SMS when someone submits the form.
                </span>
              </span>
            </label>
            {state.sendToRespondent ? (
              <div className="space-y-2">
                <Label>Message template</Label>
                <Textarea
                  rows={4}
                  value={state.respondentMessageTemplate}
                  onChange={(e) =>
                    setState((s) => ({ ...s, respondentMessageTemplate: e.target.value }))
                  }
                  placeholder={DEFAULT_RESPONDENT_SMS}
                />
                <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 p-3">
                  Preview: {samplePreview.respondent}
                </p>
              </div>
            ) : null}
          </AppCardBody>
        </AppCard>

        <AppCard>
          <AppCardBody className="p-5 sm:p-6 space-y-4">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={state.sendToAdmin}
                onChange={(e) => setState((s) => ({ ...s, sendToAdmin: e.target.checked }))}
                className="mt-1"
              />
              <span>
                <span className="font-semibold block">SMS notification to you</span>
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
                    className="font-mono h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave blank to use your account phone ({ownerPhone}).
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Admin message template</Label>
                  <Textarea
                    rows={3}
                    value={state.adminMessageTemplate}
                    onChange={(e) =>
                      setState((s) => ({ ...s, adminMessageTemplate: e.target.value }))
                    }
                    placeholder={DEFAULT_ADMIN_SMS}
                  />
                  <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 p-3">
                    Preview: {samplePreview.admin}
                  </p>
                </div>
              </>
            ) : null}
          </AppCardBody>
        </AppCard>

        <Button type="button" className="h-11 gap-2" disabled={isPending} onClick={save}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save automation
        </Button>
      </div>

      <aside className="space-y-4">
        <AppCard>
          <AppCardBody className="p-5 space-y-3 text-sm">
            <h2 className="font-semibold">Credit estimate</h2>
            <p className="text-muted-foreground">
              Each submission may use up to{" "}
              <strong className="text-foreground">{creditEstimate}</strong> SMS credit
              {creditEstimate === 1 ? "" : "s"} (sample message length).
            </p>
            <p className="text-muted-foreground">
              Your balance: <strong className="text-foreground">{smsCredits}</strong> credits
            </p>
            {creditEstimate > smsCredits ? (
              <p className="text-xs text-destructive">
                Low balance — submissions will still save, but SMS may fail until you top up.
              </p>
            ) : null}
          </AppCardBody>
        </AppCard>

        <AppCard>
          <AppCardBody className="p-5 space-y-3">
            <h2 className="font-semibold text-sm">Merge tags</h2>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {SMART_FORM_MERGE_TAGS.map((item) => (
                <li key={item.tag}>
                  <code className="text-foreground">{item.tag}</code> — {item.desc}
                </li>
              ))}
            </ul>
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
