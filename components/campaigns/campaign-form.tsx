"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createCampaignAction } from "@/lib/actions/campaigns";
import { CampaignMessagePreview } from "@/components/campaigns/message-preview";
import { SmsSchedulePicker } from "@/components/sms/sms-schedule-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarClock,
  Loader2,
  Megaphone,
  MessageSquare,
  Users,
} from "lucide-react";

type Group = { id: string; name: string; _count?: { members: number } };
type Template = { id: string; name: string; content: string };
type Sender = { value: string; status: string; isDefault: boolean };
type Country = { countryCode: string; countryName: string };

const TIMEZONES = [
  { id: "Africa/Accra", label: "Accra (Ghana)" },
  { id: "Africa/Lagos", label: "Lagos" },
  { id: "Africa/Nairobi", label: "Nairobi" },
  { id: "UTC", label: "UTC" },
  { id: "Europe/London", label: "London" },
] as const;

const selectClass =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-base md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description?: string;
  icon: typeof Megaphone;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SubmitButton({ recipientCount }: { recipientCount: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || recipientCount === 0} className="h-11 w-full gap-2 rounded-xl text-sm font-semibold">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
      {pending ? "Creating campaign…" : recipientCount > 0 ? `Create campaign · ${recipientCount.toLocaleString()}` : "Create campaign"}
    </Button>
  );
}

export function CampaignForm({
  groups,
  templates,
  senders,
  countries,
  defaultSenderId = "",
  defaultCountryCode = "GH",
  initialMessage = "",
}: {
  groups: Group[];
  templates: Template[];
  senders: Sender[];
  countries: Country[];
  defaultSenderId?: string;
  defaultCountryCode?: string;
  initialMessage?: string;
}) {
  const approvedSenders = senders.filter((s) => s.status === "APPROVED");
  const initialSender =
    defaultSenderId ||
    approvedSenders.find((s) => s.isDefault)?.value ||
    approvedSenders[0]?.value ||
    "";

  const [message, setMessage] = useState(initialMessage);
  const [contactGroupId, setContactGroupId] = useState("");
  const [recipients, setRecipients] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [recurrence, setRecurrence] = useState("NONE");

  const recipientCount = useMemo(() => {
    if (contactGroupId) {
      const g = groups.find((x) => x.id === contactGroupId);
      return g?._count?.members ?? 0;
    }
    return recipients
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean).length;
  }, [contactGroupId, recipients, groups]);

  const preview = (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4 sm:p-5">
      <div>
        <p className="text-sm font-semibold">Preview</p>
        <p className="mt-0.5 text-xs text-muted-foreground">How the SMS will look on a phone.</p>
      </div>
      <CampaignMessagePreview message={message} recipientCount={recipientCount} />
    </div>
  );

  return (
    <form action={createCampaignAction} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,22rem)] xl:items-start">
      <div className="min-w-0 space-y-5">
        <FormSection title="Campaign" description="Name, sender, and destination." icon={Megaphone}>
          <Field label="Campaign name" htmlFor="campaign-name">
            <Input id="campaign-name" name="name" required placeholder="August promo" className="h-11" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Sender ID"
              htmlFor="campaign-sender"
              hint={
                approvedSenders.length === 0
                  ? undefined
                  : "Only approved sender IDs can send."
              }
            >
              {approvedSenders.length === 0 ? (
                <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  No approved Sender ID yet.{" "}
                  <Link href="/dashboard/sender-ids" className="font-semibold underline underline-offset-2">
                    Register one
                  </Link>
                  .
                </p>
              ) : (
                <select
                  id="campaign-sender"
                  name="senderId"
                  required
                  defaultValue={initialSender}
                  className={selectClass}
                >
                  {approvedSenders.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.value}
                      {s.isDefault ? " (default)" : ""}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Country" htmlFor="campaign-country">
              <select
                id="campaign-country"
                name="countryCode"
                defaultValue={defaultCountryCode}
                className={selectClass}
              >
                {(countries.length > 0 ? countries : [{ countryCode: "GH", countryName: "Ghana" }]).map(
                  (c) => (
                    <option key={c.countryCode} value={c.countryCode}>
                      {c.countryName} ({c.countryCode})
                    </option>
                  ),
                )}
              </select>
            </Field>
          </div>
        </FormSection>

        <FormSection title="Audience" description="A saved group, or paste numbers." icon={Users}>
          <Field label="Contact group" htmlFor="campaign-group">
            <select
              id="campaign-group"
              name="contactGroupId"
              className={selectClass}
              value={contactGroupId}
              onChange={(e) => setContactGroupId(e.target.value)}
            >
              <option value="">Paste numbers below</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g._count?.members ?? 0})
                </option>
              ))}
            </select>
          </Field>

          {!contactGroupId ? (
            <Field
              label="Recipients"
              htmlFor="campaign-recipients"
              hint="One number per line, or comma-separated. Include country code."
            >
              <Textarea
                id="campaign-recipients"
                name="recipients"
                rows={5}
                placeholder={"+233241234567\n+233201112233"}
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                className="min-h-[8rem] font-mono text-sm"
              />
            </Field>
          ) : (
            <p className="rounded-xl bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
              Sending to <span className="font-semibold text-foreground">{recipientCount.toLocaleString()}</span>{" "}
              contact{recipientCount === 1 ? "" : "s"} in this group.
            </p>
          )}
        </FormSection>

        <FormSection title="Message" description="Write the SMS or load a template." icon={MessageSquare}>
          {templates.length > 0 ? (
            <Field label="Template" htmlFor="campaign-template">
              <select
                id="campaign-template"
                className={selectClass}
                defaultValue=""
                onChange={(e) => {
                  const t = templates.find((x) => x.id === e.target.value);
                  if (t) setMessage(t.content);
                }}
              >
                <option value="">Write a custom message</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <p className="text-xs text-muted-foreground">
              No templates yet.{" "}
              <Link href="/dashboard/templates" className="font-medium text-primary hover:underline">
                Create templates
              </Link>{" "}
              to reuse messages.
            </p>
          )}

          <Field label="Message" htmlFor="campaign-message">
            <Textarea
              id="campaign-message"
              name="message"
              rows={6}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi {firstName}, …"
              className="min-h-[9rem]"
            />
          </Field>
        </FormSection>

        <div className="xl:hidden">{preview}</div>

        <FormSection title="Schedule" description="Send now, or set a time and optional repeat." icon={CalendarClock}>
          <input type="hidden" name="scheduledAt" value={scheduledAt} />
          <SmsSchedulePicker value={scheduledAt} onChange={setScheduledAt} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Timezone" htmlFor="campaign-tz">
              <select id="campaign-tz" name="timezone" defaultValue="Africa/Accra" className={selectClass}>
                {TIMEZONES.map((tz) => (
                  <option key={tz.id} value={tz.id}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Repeat" htmlFor="campaign-recurrence">
              <select
                id="campaign-recurrence"
                name="recurrence"
                className={selectClass}
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
              >
                <option value="NONE">Does not repeat</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="CUSTOM_DAYS">Custom interval</option>
              </select>
            </Field>
          </div>

          {recurrence === "CUSTOM_DAYS" ? (
            <Field label="Repeat every (days)" htmlFor="campaign-days">
              <Input id="campaign-days" name="recurrenceDays" type="number" min={1} placeholder="7" className="h-11" />
            </Field>
          ) : (
            <input type="hidden" name="recurrenceDays" value="" />
          )}

          {recurrence !== "NONE" ? (
            <Field label="Stop repeating (optional)" htmlFor="campaign-end" hint="Leave blank to keep repeating.">
              <Input id="campaign-end" name="recurrenceEndAt" type="datetime-local" className="h-11" />
            </Field>
          ) : null}
        </FormSection>

        <SubmitButton recipientCount={recipientCount} />
      </div>

      <aside className="hidden min-w-0 xl:sticky xl:top-20 xl:block">{preview}</aside>
    </form>
  );
}
