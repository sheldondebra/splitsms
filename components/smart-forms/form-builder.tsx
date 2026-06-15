"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  closeSmartFormAction,
  publishSmartFormAction,
  reopenSmartFormAction,
  saveSmartFormBuilderAction,
} from "@/lib/actions/smart-forms";
import {
  FIELD_TYPE_CATALOG,
  defaultLabelForType,
  getFieldTypeMeta,
  newClientFieldId,
  suggestFieldKey,
} from "@/lib/smart-forms/field-meta";
import { FormFieldRender } from "@/components/smart-forms/form-field-render";
import type { BuilderField, SerializedSmartForm } from "@/lib/smart-forms/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ExternalLink,
  Eye,
  Loader2,
  Save,
  Trash2,
  Upload,
  MessageSquare,
} from "lucide-react";
import type { SmartFormFieldType } from "@/lib/generated/prisma/client";

export function SmartFormBuilder({
  form: initial,
  siteUrl,
  contactGroups,
}: {
  form: SerializedSmartForm;
  siteUrl: string;
  contactGroups: { id: string; name: string }[];
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [fields, setFields] = useState<BuilderField[]>(initial.fields);
  const [selectedId, setSelectedId] = useState<string | null>(fields[0]?.id ?? null);
  const [themeSettings, setThemeSettings] = useState(initial.themeSettings);
  const [successSettings, setSuccessSettings] = useState(initial.successSettings);
  const [saveToContacts, setSaveToContacts] = useState(initial.saveToContacts);
  const [contactGroupId, setContactGroupId] = useState(initial.contactGroupId ?? "");
  const [preventDuplicatePhone, setPreventDuplicatePhone] = useState(initial.preventDuplicatePhone);
  const [preventDuplicateEmail, setPreventDuplicateEmail] = useState(initial.preventDuplicateEmail);
  const [captchaEnabled, setCaptchaEnabled] = useState(initial.captchaEnabled);
  const [status, setStatus] = useState(initial.status);
  const [mobilePanel, setMobilePanel] = useState<"add" | "preview" | "settings">("preview");
  const [isPending, startTransition] = useTransition();

  const selected = useMemo(
    () => fields.find((f) => f.id === selectedId) ?? null,
    [fields, selectedId],
  );

  const publicUrl = `${siteUrl}/f/${initial.shortCode}`;
  const previewUrl = `/dashboard/forms/${initial.id}/preview`;

  function buildPayload(): string {
    return JSON.stringify({
      name,
      description,
      themeSettings,
      successSettings,
      saveToContacts: saveToContacts || Boolean(contactGroupId),
      contactGroupId: contactGroupId || null,
      preventDuplicatePhone,
      preventDuplicateEmail,
      captchaEnabled,
      fields: fields.map((f, index) => ({ ...f, sortOrder: index })),
    });
  }

  function saveDraft(onDone?: () => void) {
    startTransition(async () => {
      const result = await saveSmartFormBuilderAction(initial.id, buildPayload());
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setFields(result.fields);
      toast.success("Draft saved");
      onDone?.();
    });
  }

  function addField(type: SmartFormFieldType) {
    const keys = fields.map((f) => f.fieldKey);
    const label = defaultLabelForType(type);
    const field: BuilderField = {
      id: newClientFieldId(),
      label,
      fieldKey: suggestFieldKey(label, keys),
      fieldType: type,
      isRequired: getFieldTypeMeta(type).isInput && type === "PHONE",
      options:
        type === "SELECT" || type === "RADIO" || type === "CHECKBOX"
          ? ["Option 1", "Option 2"]
          : [],
      sortOrder: fields.length,
    };
    setFields((prev) => [...prev, field]);
    setSelectedId(field.id);
  }

  function updateSelected(patch: Partial<BuilderField>) {
    if (!selectedId) return;
    setFields((prev) => prev.map((f) => (f.id === selectedId ? { ...f, ...patch } : f)));
  }

  function moveField(id: string, direction: -1 | 1) {
    setFields((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      if (index < 0) return prev;
      const next = index + direction;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(next, 0, item);
      return copy;
    });
  }

  function duplicateField(id: string) {
    setFields((prev) => {
      const index = prev.findIndex((f) => f.id === id);
      if (index < 0) return prev;
      const source = prev[index];
      const keys = prev.map((f) => f.fieldKey);
      const copy: BuilderField = {
        ...source,
        id: newClientFieldId(),
        fieldKey: suggestFieldKey(`${source.fieldKey}_copy`, keys),
        label: `${source.label} (copy)`,
        sortOrder: index + 1,
      };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
  }

  function removeField(id: string) {
    setFields((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
  }

  function handlePublish() {
    startTransition(async () => {
      const saved = await saveSmartFormBuilderAction(initial.id, buildPayload());
      if (!saved.ok) {
        toast.error(saved.error);
        return;
      }
      setFields(saved.fields);
      const result = await publishSmartFormAction(initial.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setStatus("PUBLISHED");
      toast.success("Form published");
    });
  }

  function handleClose() {
    startTransition(async () => {
      const result = await closeSmartFormAction(initial.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setStatus("CLOSED");
      toast.success("Form closed");
    });
  }

  function handleReopen() {
    startTransition(async () => {
      const result = await reopenSmartFormAction(initial.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setStatus("PUBLISHED");
      toast.success("Form reopened");
    });
  }

  const primary = themeSettings.primaryColor ?? "#0f172a";
  const buttonText = themeSettings.buttonText ?? "Submit";
  const buttonRadius = themeSettings.buttonRadius ?? "0.75rem";
  const backgroundColor = themeSettings.backgroundColor ?? "#f8fafc";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{status}</Badge>
          <span className="text-sm text-muted-foreground">
            <code>/f/{initial.shortCode}</code>
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5"
            disabled={isPending}
            onClick={() => saveDraft()}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save draft
          </Button>
          <Link
            href={`/dashboard/forms/${initial.id}/automation`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            SMS automation
          </Link>
          <Link
            href={previewUrl}
            target="_blank"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </Link>
          {status === "PUBLISHED" ? (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Live form
            </a>
          ) : null}
          {status === "PUBLISHED" ? (
            <Button type="button" variant="outline" size="sm" className="h-9" disabled={isPending} onClick={handleClose}>
              Close form
            </Button>
          ) : status === "CLOSED" ? (
            <Button type="button" size="sm" className="h-9 gap-1.5" disabled={isPending} onClick={handleReopen}>
              <Upload className="h-3.5 w-3.5" />
              Reopen
            </Button>
          ) : (
            <Button type="button" size="sm" className="h-9 gap-1.5" disabled={isPending} onClick={handlePublish}>
              <Upload className="h-3.5 w-3.5" />
              Publish
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2 xl:hidden">
        {(
          [
            { id: "add", label: "Add fields" },
            { id: "preview", label: "Preview" },
            { id: "settings", label: "Settings" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setMobilePanel(tab.id)}
            className={cn(
              "flex-1 h-10 rounded-lg text-sm font-semibold transition-colors",
              mobilePanel === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside
          className={cn(
            "rounded-xl border bg-card p-4 space-y-3 h-fit",
            mobilePanel !== "add" && "hidden xl:block",
          )}
        >
          <p className="text-sm font-semibold">Add fields</p>
          <div className="grid gap-2">
            {FIELD_TYPE_CATALOG.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => addField(item.type)}
                  className="flex items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm hover:bg-muted/60 transition-colors"
                >
                  <Icon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <span>
                    <span className="font-medium block">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div
          className={cn(
            "rounded-xl border p-4 sm:p-6 min-h-[480px]",
            mobilePanel !== "preview" && "hidden xl:block",
          )}
          style={{ backgroundColor }}
        >
          <div
            className="mx-auto max-w-lg rounded-2xl border bg-background p-6 shadow-sm space-y-5"
            style={{ ["--form-primary" as string]: primary }}
          >
            <div className="space-y-1">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0"
                placeholder="Form title"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Form description (optional)"
                className="border-none shadow-none px-0 resize-none focus-visible:ring-0 text-muted-foreground"
              />
            </div>

            {fields.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-xl">
                Add fields from the left panel to build your form.
              </p>
            ) : (
              <div className="space-y-4">
                {fields.map((field) => (
                  <div
                    key={field.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(field.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedId(field.id);
                    }}
                    className={cn(
                      "rounded-lg p-2 -mx-2 transition-colors cursor-pointer",
                      selectedId === field.id ? "ring-2 ring-primary/40 bg-primary/5" : "hover:bg-muted/40",
                    )}
                  >
                    <FormFieldRender field={field} disabled />
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              disabled
              className="w-full h-11 font-semibold text-white"
              style={{ backgroundColor: primary, borderRadius: buttonRadius }}
            >
              {buttonText}
            </button>
          </div>
        </div>

        <aside
          className={cn(
            "rounded-xl border bg-card p-4 h-fit",
            mobilePanel !== "settings" && "hidden xl:block",
          )}
        >
          <Tabs defaultValue={selected ? "field" : "form"}>
            <TabsList className="w-full">
              <TabsTrigger value="field" className="flex-1" disabled={!selected}>
                Field
              </TabsTrigger>
              <TabsTrigger value="form" className="flex-1">
                Form
              </TabsTrigger>
            </TabsList>

            <TabsContent value="field" className="mt-4 space-y-4">
              {!selected ? (
                <p className="text-sm text-muted-foreground">Select a field to edit.</p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input
                      value={selected.label}
                      onChange={(e) => updateSelected({ label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Field key</Label>
                    <Input
                      value={selected.fieldKey}
                      onChange={(e) => updateSelected({ fieldKey: e.target.value })}
                      className="font-mono text-sm"
                    />
                  </div>
                  {getFieldTypeMeta(selected.fieldType).isInput ? (
                    <>
                      <div className="space-y-2">
                        <Label>Placeholder</Label>
                        <Input
                          value={selected.placeholder ?? ""}
                          onChange={(e) => updateSelected({ placeholder: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Helper text</Label>
                        <Input
                          value={selected.helperText ?? ""}
                          onChange={(e) => updateSelected({ helperText: e.target.value })}
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selected.isRequired}
                          onChange={(e) => updateSelected({ isRequired: e.target.checked })}
                        />
                        Required field
                      </label>
                    </>
                  ) : null}
                  {getFieldTypeMeta(selected.fieldType).hasOptions ? (
                    <div className="space-y-2">
                      <Label>Options (one per line)</Label>
                      <Textarea
                        rows={4}
                        value={selected.options.join("\n")}
                        onChange={(e) =>
                          updateSelected({
                            options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
                          })
                        }
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => moveField(selected.id, -1)}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => moveField(selected.id, 1)}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={() => duplicateField(selected.id)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Duplicate
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 text-destructive"
                      onClick={() => removeField(selected.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="form" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Theme color</Label>
                <Input
                  type="color"
                  value={themeSettings.primaryColor ?? "#0f172a"}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({ ...prev, primaryColor: e.target.value }))
                  }
                  className="h-11 p-1"
                />
              </div>
              <div className="space-y-2">
                <Label>Background</Label>
                <Input
                  type="color"
                  value={themeSettings.backgroundColor ?? "#f8fafc"}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))
                  }
                  className="h-11 p-1"
                />
              </div>
              <div className="space-y-2">
                <Label>Button text</Label>
                <Input
                  value={themeSettings.buttonText ?? "Submit"}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({ ...prev, buttonText: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Success title</Label>
                <Input
                  value={successSettings.title ?? ""}
                  onChange={(e) =>
                    setSuccessSettings((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Thank you"
                />
              </div>
              <div className="space-y-2">
                <Label>Success message</Label>
                <Textarea
                  rows={3}
                  value={successSettings.message ?? ""}
                  onChange={(e) =>
                    setSuccessSettings((prev) => ({ ...prev, message: e.target.value }))
                  }
                  placeholder="Your submission has been received."
                />
              </div>
              <div className="space-y-2">
                <Label>Redirect URL (optional)</Label>
                <Input
                  value={successSettings.redirectUrl ?? ""}
                  onChange={(e) =>
                    setSuccessSettings((prev) => ({ ...prev, redirectUrl: e.target.value }))
                  }
                  placeholder="https://yoursite.com/thanks"
                />
              </div>

              <div className="pt-4 border-t space-y-4">
                <h3 className="text-sm font-semibold">Contacts</h3>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={saveToContacts}
                    onChange={(e) => setSaveToContacts(e.target.checked)}
                    className="mt-1"
                  />
                  <span>Save respondents as contacts on submission</span>
                </label>
                <div className="space-y-2">
                  <Label>Contact group</Label>
                  <select
                    value={contactGroupId}
                    onChange={(e) => setContactGroupId(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="">No group</option>
                    {contactGroups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={preventDuplicatePhone}
                    onChange={(e) => setPreventDuplicatePhone(e.target.checked)}
                    className="mt-1"
                  />
                  <span>Block duplicate phone numbers on this form</span>
                </label>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={preventDuplicateEmail}
                    onChange={(e) => setPreventDuplicateEmail(e.target.checked)}
                    className="mt-1"
                  />
                  <span>Block duplicate emails on this form</span>
                </label>
              </div>

              <div className="pt-4 border-t space-y-4">
                <h3 className="text-sm font-semibold">Security</h3>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={captchaEnabled}
                    onChange={(e) => setCaptchaEnabled(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    Require a simple math check before submit (works with honeypot and rate limiting)
                  </span>
                </label>
              </div>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}
