"use client";

import { useMemo, useState, useTransition } from "react";
import { createReminderAction } from "@/lib/actions/reminders";
import { REMINDER_PRESETS, type ReminderPresetId } from "@/lib/reminders/types";
import { validateRecipientPhone } from "@/lib/sms/phone-validation";
import { normalizePhones } from "@/lib/sms/units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  Gift,
  Loader2,
  PartyPopper,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Group = { id: string; name: string; memberCount: number };
type Sender = { value: string; status: string; isDefault: boolean };
type Country = { countryCode: string; countryName: string };

const TIMEZONES = [
  { id: "Africa/Accra", label: "Accra (Ghana)" },
  { id: "Africa/Lagos", label: "Lagos" },
  { id: "Africa/Nairobi", label: "Nairobi" },
  { id: "UTC", label: "UTC" },
  { id: "Europe/London", label: "London" },
] as const;

const STEPS = [
  { id: 1, label: "Type" },
  { id: 2, label: "Recipients" },
  { id: 3, label: "Schedule" },
  { id: 4, label: "Message" },
] as const;

const PRESET_ICONS: Record<ReminderPresetId, LucideIcon> = {
  payment: Wallet,
  birthday: PartyPopper,
  meeting: CalendarDays,
  holiday: Gift,
  custom: Bell,
};

const selectClass =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDuePreview(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function tryNormalizePhone(raw: string, countryCode?: string | null) {
  const check = validateRecipientPhone(raw, countryCode ?? "GH");
  return check.valid ? check.normalized : null;
}

function StepRail({ current }: { current: number }) {
  return (
    <nav aria-label="Reminder steps" className="mb-8">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, index) => {
          const done = current > step.id;
          const active = current === step.id;
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 flex-col items-center gap-2 text-center">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    done && "bg-primary text-primary-foreground",
                    active && "bg-primary text-primary-foreground ring-4 ring-primary/15",
                    !done && !active && "bg-muted text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : step.id}
                </span>
                <span
                  className={cn(
                    "hidden text-[11px] font-medium sm:block",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 ? (
                <div
                  className={cn(
                    "mx-2 mb-5 hidden h-px flex-1 sm:block",
                    current > step.id ? "bg-primary/50" : "bg-border",
                  )}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-center text-xs text-muted-foreground sm:hidden">
        Step {current} of {STEPS.length} · {STEPS[current - 1]?.label}
      </p>
    </nav>
  );
}

function PhoneChipInput({
  phones,
  onChange,
  countryCode,
}: {
  phones: string[];
  onChange: (phones: string[]) => void;
  countryCode?: string | null;
}) {
  const [draft, setDraft] = useState("");
  const [invalid, setInvalid] = useState<string | null>(null);

  function commitTokens(raw: string) {
    const tokens = raw
      .split(/[\n,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length === 0) return;

    const next = [...phones];
    const seen = new Set(phones);
    let bad: string | null = null;

    for (const token of tokens) {
      const normalized = tryNormalizePhone(token, countryCode);
      if (!normalized) {
        bad = token;
        continue;
      }
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      next.push(normalized);
    }

    onChange(next);
    setDraft("");
    setInvalid(
      bad
        ? `“${bad}” is not a valid phone number. Use 233… or a local 0… number for the selected country.`
        : null,
    );
  }

  function removePhone(phone: string) {
    onChange(phones.filter((p) => p !== phone));
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="recipient-draft">Phone numbers</Label>
      <div
        className={cn(
          "min-h-[120px] rounded-lg border border-input bg-background px-2.5 py-2",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40",
        )}
      >
        {phones.length > 0 ? (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {phones.map((phone) => (
              <span
                key={phone}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-200"
              >
                {phone}
                <button
                  type="button"
                  onClick={() => removePhone(phone)}
                  className="rounded p-0.5 text-emerald-700/70 hover:bg-emerald-500/15 hover:text-emerald-900 dark:text-emerald-300/80"
                  aria-label={`Remove ${phone}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <input
          id="recipient-draft"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setInvalid(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "," || e.key === ";") {
              e.preventDefault();
              commitTokens(draft);
            }
            if (e.key === "Backspace" && !draft && phones.length > 0) {
              removePhone(phones[phones.length - 1]!);
            }
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (/[\n,;]/.test(text) || normalizePhones(text, countryCode).length > 0) {
              e.preventDefault();
              commitTokens(`${draft} ${text}`);
            }
          }}
          onBlur={() => {
            if (draft.trim()) commitTokens(draft);
          }}
          placeholder={phones.length === 0 ? "Type a number and press Enter" : "Add another number"}
          className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          inputMode="tel"
          autoComplete="tel"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Press Enter after each number. Valid numbers appear as green cards.
      </p>
      {invalid ? <p className="text-xs text-destructive">{invalid}</p> : null}
      {phones.length > 0 ? (
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          {phones.length} valid number{phones.length === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}

export function ReminderForm({
  groups,
  senders,
  countries,
  defaultSenderId,
  defaultCountryCode,
}: {
  groups: Group[];
  senders: Sender[];
  countries: Country[];
  defaultSenderId: string;
  defaultCountryCode: string;
}) {
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [stepError, setStepError] = useState<string | null>(null);

  const [presetId, setPresetId] = useState<ReminderPresetId>("payment");
  const [title, setTitle] = useState("Gold payment");
  const [audience, setAudience] = useState<"group" | "all" | "numbers">(
    groups.length > 0 ? "group" : "numbers",
  );
  const [contactGroupId, setContactGroupId] = useState(groups[0]?.id ?? "");
  const [phones, setPhones] = useState<string[]>([]);
  const [senderId, setSenderId] = useState(defaultSenderId);
  const [countryCode, setCountryCode] = useState(defaultCountryCode);
  const [timezone, setTimezone] = useState("Africa/Accra");
  const [repeat, setRepeat] = useState<"once" | "monthly">("monthly");
  const [dueAt, setDueAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(9, 0, 0, 0);
    return toLocalInputValue(d);
  });
  const [earlyEnabled, setEarlyEnabled] = useState(true);
  const [earlyDays, setEarlyDays] = useState(3);
  const [earlyMessage, setEarlyMessage] = useState<string>(
    REMINDER_PRESETS[0]?.earlyMessage ?? "",
  );
  const [dueMessage, setDueMessage] = useState<string>(
    REMINDER_PRESETS[0]?.dueMessage ?? "",
  );

  const approvedSenders = useMemo(
    () => senders.filter((s) => s.status === "APPROVED"),
    [senders],
  );

  const recipients = phones.join("\n");
  const selectedGroup = groups.find((g) => g.id === contactGroupId);
  const recipientPreview =
    audience === "group"
      ? selectedGroup
        ? `${selectedGroup.name} · ${selectedGroup.memberCount} contacts`
        : "No group selected"
      : audience === "all"
        ? "All contacts"
        : `${phones.length} number${phones.length === 1 ? "" : "s"}`;

  function applyPreset(id: ReminderPresetId) {
    const next = REMINDER_PRESETS.find((p) => p.id === id);
    if (!next) return;
    setPresetId(id);
    setEarlyMessage(next.earlyMessage);
    setDueMessage(next.dueMessage);
    setEarlyDays(next.earlyDaysDefault || 3);
    setEarlyEnabled(next.earlyDaysDefault > 0);
    if (id === "payment") {
      setTitle("Gold payment");
      setRepeat("monthly");
    } else if (id === "birthday") {
      setTitle("Birthday wish");
      setRepeat("once");
    } else if (id === "meeting") {
      setTitle("Meeting");
      setRepeat("once");
    } else if (id === "holiday") {
      setTitle("Holiday greeting");
      setRepeat("once");
    } else {
      setTitle("Reminder");
      setRepeat("once");
    }
  }

  function validateStep(current: number) {
    if (current === 1) {
      if (!title.trim()) return "Enter a name for this reminder.";
      return null;
    }
    if (current === 2) {
      if (audience === "group" && !contactGroupId) return "Choose a contact group.";
      if (audience === "numbers" && phones.length < 1) {
        return "Add at least one valid phone number.";
      }
      if (!senderId) return "Choose an approved Sender ID.";
      return null;
    }
    if (current === 3) {
      const due = new Date(dueAt);
      if (Number.isNaN(due.getTime()) || due <= new Date()) {
        return "Pick a future date and time.";
      }
      if (earlyEnabled && earlyDays < 1) return "Early reminder needs at least 1 day.";
      return null;
    }
    if (current === 4) {
      if (!dueMessage.trim()) return "Write the due-date message.";
      if (earlyEnabled && !earlyMessage.trim()) return "Write the early reminder message.";
      return null;
    }
    return null;
  }

  function goNext() {
    const error = validateStep(step);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(4, s + 1));
  }

  function goBack() {
    setStepError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function submit() {
    const error = validateStep(4);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    const fd = new FormData();
    fd.set("title", title.trim());
    fd.set("audience", audience);
    fd.set("contactGroupId", contactGroupId);
    fd.set("recipients", recipients);
    fd.set("senderId", senderId);
    fd.set("countryCode", countryCode);
    fd.set("timezone", timezone);
    fd.set("repeat", repeat);
    fd.set("dueAt", dueAt);
    fd.set("earlyEnabled", earlyEnabled ? "1" : "0");
    fd.set("earlyDays", String(earlyDays));
    fd.set("earlyMessage", earlyMessage);
    fd.set("dueMessage", dueMessage);
    startTransition(() => {
      void createReminderAction(fd);
    });
  }

  return (
    <div className="space-y-0">
      <StepRail current={step} />

      <div className="rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-5 py-4 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Step {step} of {STEPS.length}
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            {step === 1 && "What kind of reminder?"}
            {step === 2 && "Who should receive it?"}
            {step === 3 && "When should we send it?"}
            {step === 4 && "Write the SMS"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 1 && "Choose a type and give it a clear name."}
            {step === 2 && "Send to a group, all contacts, or specific numbers."}
            {step === 3 && "One-time or monthly — with an optional early reminder."}
            {step === 4 && "Personalize with {name}. Review and save when ready."}
          </p>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          {step === 1 ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {REMINDER_PRESETS.map((p) => {
                  const Icon = PRESET_ICONS[p.id];
                  const selected = presetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p.id)}
                      className={cn(
                        "relative rounded-xl border p-4 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border/70 hover:border-primary/30 hover:bg-muted/20",
                      )}
                    >
                      {selected ? (
                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : null}
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="mt-3 text-sm font-semibold">{p.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {p.description}
                      </p>
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Reminder name</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Gold payment"
                  className="h-11"
                />
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="grid gap-2 sm:grid-cols-3">
                {(
                  [
                    ["group", "Contact group", "Use a saved list"],
                    ["all", "All contacts", "Everyone in Contacts"],
                    ["numbers", "Phone numbers", "Paste one per line"],
                  ] as const
                ).map(([id, label, hint]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAudience(id)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-left transition-colors",
                      audience === id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border/70 hover:border-primary/30",
                    )}
                  >
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
                  </button>
                ))}
              </div>

              {audience === "group" ? (
                <div className="space-y-2">
                  <Label htmlFor="group">Group</Label>
                  <select
                    id="group"
                    className={selectClass}
                    value={contactGroupId}
                    onChange={(e) => setContactGroupId(e.target.value)}
                  >
                    {groups.length === 0 ? (
                      <option value="">No groups yet</option>
                    ) : (
                      groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.memberCount})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ) : null}

              {audience === "numbers" ? (
                <PhoneChipInput phones={phones} onChange={setPhones} countryCode={countryCode} />
              ) : null}

              {audience === "all" ? (
                <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    This reminder will send to every contact currently in your Contacts list.
                  </p>
                </div>
              ) : null}

              <div className="grid gap-4 border-t border-border/60 pt-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="senderId">Sender ID</Label>
                  <select
                    id="senderId"
                    className={selectClass}
                    value={senderId}
                    onChange={(e) => setSenderId(e.target.value)}
                  >
                    {approvedSenders.length === 0 ? (
                      <option value="">No approved Sender ID</option>
                    ) : (
                      approvedSenders.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.value}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="countryCode">Country pricing</Label>
                  <select
                    id="countryCode"
                    className={selectClass}
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                  >
                    {countries.map((c) => (
                      <option key={c.countryCode} value={c.countryCode}>
                        {c.countryName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["once", "One time", "Send on this date only"],
                    ["monthly", "Every month", "Repeats on the same day each month"],
                  ] as const
                ).map(([id, label, hint]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setRepeat(id)}
                    className={cn(
                      "rounded-xl border px-4 py-3 text-left transition-colors",
                      repeat === id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border/70 hover:border-primary/30",
                    )}
                  >
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dueAt">
                    {repeat === "monthly" ? "Next due date & time" : "Date & time"}
                  </Label>
                  <Input
                    id="dueAt"
                    type="datetime-local"
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    className={selectClass}
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.id} value={tz.id}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                className={cn(
                  "rounded-xl border px-4 py-4 transition-colors",
                  earlyEnabled ? "border-primary/30 bg-primary/5" : "border-border/60",
                )}
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={earlyEnabled}
                    onChange={(e) => setEarlyEnabled(e.target.checked)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">Send an early reminder</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      First SMS before the due date, then again on the due date.
                    </span>
                  </span>
                </label>
                {earlyEnabled ? (
                  <div className="mt-4 space-y-2 border-t border-border/50 pt-4">
                    <Label htmlFor="earlyDays">Days before due date</Label>
                    <Input
                      id="earlyDays"
                      type="number"
                      min={1}
                      max={30}
                      value={earlyDays}
                      onChange={(e) => setEarlyDays(Number(e.target.value) || 1)}
                      className="h-11 max-w-[160px]"
                    />
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          {step === 4 ? (
            <>
              {earlyEnabled ? (
                <div className="space-y-2">
                  <Label htmlFor="earlyMessage">Early reminder message</Label>
                  <Textarea
                    id="earlyMessage"
                    value={earlyMessage}
                    onChange={(e) => setEarlyMessage(e.target.value)}
                    rows={3}
                    className="min-h-[88px]"
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="dueMessage">
                  {earlyEnabled ? "Due-date message" : "Message"}
                </Label>
                <Textarea
                  id="dueMessage"
                  value={dueMessage}
                  onChange={(e) => setDueMessage(e.target.value)}
                  rows={3}
                  className="min-h-[88px]"
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{name}"} to personalize when sending to contacts.
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Summary
                </p>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">Name</dt>
                    <dd className="mt-0.5 font-medium">{title || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Recipients</dt>
                    <dd className="mt-0.5 font-medium">{recipientPreview}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Schedule</dt>
                    <dd className="mt-0.5 font-medium">
                      {repeat === "monthly" ? "Every month" : "One time"} · {formatDuePreview(dueAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Sender</dt>
                    <dd className="mt-0.5 font-medium">{senderId || "—"}</dd>
                  </div>
                  {earlyEnabled ? (
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-muted-foreground">Early reminder</dt>
                      <dd className="mt-0.5 font-medium">{earlyDays} days before due date</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            </>
          ) : null}

          {stepError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {stepError}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={step === 1 || pending}
            className="h-10 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {step < 4 ? (
            <Button type="button" onClick={goNext} className="h-10 gap-2">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={pending} className="h-10 gap-2">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              {pending ? "Saving…" : "Save reminder"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
