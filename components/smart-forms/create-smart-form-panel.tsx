"use client";

import { useState, useTransition } from "react";
import { createSmartFormAction } from "@/lib/actions/smart-forms";
import { FORM_TEMPLATES } from "@/lib/smart-forms/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Loader2,
} from "lucide-react";

type Group = { id: string; name: string };

const STEPS = [
  { id: 1, label: "Template" },
  { id: 2, label: "Details" },
  { id: 3, label: "Contacts" },
] as const;

const selectClass =
  "flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function StepRail({ current }: { current: number }) {
  return (
    <nav aria-label="Create form steps" className="mb-8">
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

export function CreateSmartFormPanel({ groups }: { groups: Group[] }) {
  const [step, setStep] = useState(1);
  const [pending, startTransition] = useTransition();
  const [stepError, setStepError] = useState<string | null>(null);

  const [templateId, setTemplateId] = useState("blank");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contactGroupId, setContactGroupId] = useState("");
  const [saveToContacts, setSaveToContacts] = useState(false);

  const selectedTemplate =
    FORM_TEMPLATES.find((t) => t.id === templateId) ?? FORM_TEMPLATES[0];

  function goNext() {
    if (step === 2 && !name.trim()) {
      setStepError("Enter a form name to continue.");
      return;
    }
    setStepError(null);
    setStep((s) => Math.min(3, s + 1));
  }

  function goBack() {
    setStepError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function submit() {
    if (!name.trim()) {
      setStepError("Enter a form name to continue.");
      setStep(2);
      return;
    }
    setStepError(null);
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("description", description.trim());
    fd.set("templateId", templateId);
    fd.set("contactGroupId", contactGroupId);
    if (saveToContacts) fd.set("saveToContacts", "on");
    startTransition(() => {
      void createSmartFormAction(fd);
    });
  }

  return (
    <div>
      <StepRail current={step} />

      <div className="rounded-2xl border border-border/60 bg-card">
        <div className="border-b border-border/60 px-5 py-4 sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Step {step} of {STEPS.length}
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            {step === 1 && "Choose a template"}
            {step === 2 && "Name your form"}
            {step === 3 && "Save contacts?"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 1 &&
              "Start blank or pick a preset — you can edit fields in the builder next."}
            {step === 2 && "This name appears in your dashboard and on the public form."}
            {step === 3 &&
              "Optionally add respondents to Contacts or a group when they submit."}
          </p>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          {step === 1 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {FORM_TEMPLATES.map((template) => {
                const selected = templateId === template.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setTemplateId(template.id)}
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
                    <p className="pr-8 text-sm font-semibold">{template.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {template.description}
                    </p>
                    {template.fields.length > 0 ? (
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {template.fields.length} starter field
                        {template.fields.length === 1 ? "" : "s"}
                      </p>
                    ) : (
                      <p className="mt-2 text-[11px] text-muted-foreground">Blank canvas</p>
                    )}
                  </button>
                );
              })}
            </div>
          ) : null}

          {step === 2 ? (
            <>
              <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
                <p className="text-xs text-muted-foreground">Selected template</p>
                <p className="mt-0.5 text-sm font-medium">
                  {selectedTemplate?.name ?? "Blank"}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Form name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer event registration"
                  className="h-11"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Shown on the public form and in your dashboard."
                  className="min-h-[88px]"
                />
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Summary
                </p>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">Template</dt>
                    <dd className="mt-0.5 font-medium">{selectedTemplate?.name ?? "Blank"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Form name</dt>
                    <dd className="mt-0.5 font-medium">{name.trim() || "—"}</dd>
                  </div>
                </dl>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactGroupId">Contact group (optional)</Label>
                <select
                  id="contactGroupId"
                  className={selectClass}
                  value={contactGroupId}
                  onChange={(e) => {
                    setContactGroupId(e.target.value);
                    if (e.target.value) setSaveToContacts(true);
                  }}
                >
                  <option value="">Do not save to a group</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Save respondents into a group for future SMS campaigns.
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 px-4 py-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={saveToContacts}
                  onChange={(e) => setSaveToContacts(e.target.checked)}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    Save respondents as contacts
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    When someone submits, add them to your Contacts list.
                  </span>
                </span>
              </label>
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
          {step < 3 ? (
            <Button type="button" onClick={goNext} className="h-10 gap-2">
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={submit} disabled={pending} className="h-10 gap-2">
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {pending ? "Creating…" : "Create form & open builder"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
