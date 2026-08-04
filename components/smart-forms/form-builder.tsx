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
import { FormFieldsLayout } from "@/components/smart-forms/form-fields-layout";
import { FormHeaderBanner } from "@/components/smart-forms/form-header-banner";
import { HeaderBannerEditor } from "@/components/smart-forms/header-banner-editor";
import {
  DEFAULT_BANNER_POSITION,
  type BannerPosition,
} from "@/lib/smart-forms/banner-image";
import {
  fieldCanBeHalfWidth,
  getSectionColumnsForField,
  getTrailingSectionColumns,
} from "@/lib/smart-forms/field-layout";
import type { BuilderField, SerializedSmartForm } from "@/lib/smart-forms/types";
import { DEFAULT_FORM_BACKGROUND, resolveFormBackground } from "@/lib/smart-forms/theme";
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
  ImageIcon,
  Loader2,
  Save,
  Trash2,
  Upload,
  MessageSquare,
} from "lucide-react";
import type { SmartFormFieldType } from "@/lib/generated/prisma/client";

const BASIC_DYNAMIC_VALUES = [
  { key: "name", label: "Full name", tag: "{{name}}" },
  { key: "first_name", label: "First name", tag: "{{first_name}}" },
  { key: "last_name", label: "Last name", tag: "{{last_name}}" },
  { key: "phone", label: "Phone number", tag: "{{phone}}" },
  { key: "email", label: "Email address", tag: "{{email}}" },
] as const;

const FORM_DYNAMIC_VALUES = [
  { key: "form_name", label: "Form name", tag: "{{form_name}}" },
  { key: "submission_date", label: "Submission date", tag: "{{submission_date}}" },
  { key: "submission_time", label: "Submission time", tag: "{{submission_time}}" },
] as const;

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
  const [layoutSettings, setLayoutSettings] = useState(initial.layoutSettings);
  const [bannerUrl, setBannerUrl] = useState(initial.bannerUrl ?? "");
  const [successSettings, setSuccessSettings] = useState(initial.successSettings);
  const [saveToContacts, setSaveToContacts] = useState(initial.saveToContacts);
  const [contactGroupId, setContactGroupId] = useState(initial.contactGroupId ?? "");
  const [preventDuplicatePhone, setPreventDuplicatePhone] = useState(initial.preventDuplicatePhone);
  const [preventDuplicateEmail, setPreventDuplicateEmail] = useState(initial.preventDuplicateEmail);
  const [captchaEnabled, setCaptchaEnabled] = useState(initial.captchaEnabled);
  const [status, setStatus] = useState(initial.status);
  const [mobilePanel, setMobilePanel] = useState<"add" | "preview" | "settings">("preview");
  const [settingsTab, setSettingsTab] = useState<"field" | "form">("form");
  const [isPending, startTransition] = useTransition();
  const [manualFieldKeys, setManualFieldKeys] = useState<Set<string>>(() => new Set());

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
      bannerUrl: bannerUrl.trim() || null,
      themeSettings,
      layoutSettings,
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

  function openFormSettings() {
    setSettingsTab("form");
    setMobilePanel("settings");
  }

  function addField(type: SmartFormFieldType) {
    const keys = fields.map((f) => f.fieldKey);
    const label = defaultLabelForType(type);
    const inTwoColSection = getTrailingSectionColumns(fields) === 2;
    const defaultWidth =
      type !== "SECTION" &&
      type !== "DIVIDER" &&
      getFieldTypeMeta(type).isInput &&
      type !== "TEXTAREA" &&
      inTwoColSection
        ? ("half" as const)
        : ("full" as const);
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
      ...(type === "SECTION" ? { sectionColumns: 1 as const } : {}),
      width: defaultWidth,
    };
    setFields((prev) => [...prev, field]);
    setSelectedId(field.id);
  }

  function addStep() {
    const stepCount = fields.filter((f) => f.fieldType === "SECTION" && f.startsStep).length + 1;
    const label = `Step ${stepCount}`;
    const keys = fields.map((f) => f.fieldKey);
    const field: BuilderField = {
      id: newClientFieldId(),
      label,
      fieldKey: suggestFieldKey(label, keys),
      fieldType: "SECTION",
      isRequired: false,
      options: [],
      sortOrder: fields.length,
      sectionColumns: 1,
      startsStep: true,
      width: "full",
    };
    setFields((prev) => [...prev, field]);
    setSelectedId(field.id);
    setSettingsTab("field");
    setMobilePanel("settings");
  }

  function updateSelected(patch: Partial<BuilderField>) {
    if (!selectedId) return;
    setFields((prev) => prev.map((f) => (f.id === selectedId ? { ...f, ...patch } : f)));
  }

  function handleLabelChange(label: string) {
    if (!selectedId) return;
    setFields((prev) => {
      const existingKeys = prev.filter((f) => f.id !== selectedId).map((f) => f.fieldKey);
      return prev.map((f) => {
        if (f.id !== selectedId) return f;
        const next: BuilderField = { ...f, label };
        if (!manualFieldKeys.has(selectedId)) {
          next.fieldKey = suggestFieldKey(label, existingKeys);
        }
        return next;
      });
    });
  }

  function handleFieldKeyChange(fieldKey: string) {
    if (!selectedId) return;
    setManualFieldKeys((prev) => new Set(prev).add(selectedId));
    updateSelected({ fieldKey });
  }

  function handleDynamicValueChange(dynamicValue: string) {
    if (!selectedId) return;
    setFields((prev) =>
      prev.map((field) => {
        if (field.id === selectedId) {
          return { ...field, dynamicValue: dynamicValue || undefined };
        }
        if (dynamicValue && field.dynamicValue === dynamicValue) {
          return { ...field, dynamicValue: undefined };
        }
        return field;
      }),
    );
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
    setManualFieldKeys((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setFields((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
  }

  function insertSuccessMessageTag(tag: string) {
    setSuccessSettings((prev) => {
      const current = prev.message ?? "";
      const separator = current && !/\s$/.test(current) ? " " : "";
      return { ...prev, message: `${current}${separator}${tag}` };
    });
  }

  function handlePublish() {
    const wasPublished = status === "PUBLISHED";
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
      toast.success(wasPublished ? "Live form updated" : "Form published");
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

  const primary = themeSettings.primaryColor ?? "#18181b";
  const buttonText = themeSettings.buttonText ?? "Submit";
  const buttonRadius = themeSettings.buttonRadius ?? "0.625rem";
  const formBackground = resolveFormBackground(themeSettings);
  const selectedSectionColumns = selected
    ? getSectionColumnsForField(fields, selected.id)
    : 1;
  const fieldKeyIsAuto = selected ? !manualFieldKeys.has(selected.id) : true;
  const bannerPosition: BannerPosition =
    layoutSettings.bannerPosition ?? DEFAULT_BANNER_POSITION;
  const selectedDynamicValueOptions =
    selected?.fieldType === "PHONE"
      ? BASIC_DYNAMIC_VALUES.filter((item) => item.key === "phone")
      : selected?.fieldType === "EMAIL"
        ? BASIC_DYNAMIC_VALUES.filter((item) => item.key === "email")
        : BASIC_DYNAMIC_VALUES;
  const successMessageTags = [
    ...BASIC_DYNAMIC_VALUES.map((item) => ({
      tag: item.tag,
      label: item.label,
      helper: "Basic",
    })),
    ...FORM_DYNAMIC_VALUES.map((item) => ({
      tag: item.tag,
      label: item.label,
      helper: "Form",
    })),
    ...fields
      .filter((field) => getFieldTypeMeta(field.fieldType).isInput)
      .map((field) => ({
        tag: `{{${field.fieldKey}}}`,
        label: field.label,
        helper: field.dynamicValue
          ? BASIC_DYNAMIC_VALUES.find((item) => item.key === field.dynamicValue)?.label ?? "Mapped"
          : "Field",
      })),
  ].filter((item, index, arr) => arr.findIndex((other) => other.tag === item.tag) === index);
  const fieldGroups = [
    {
      label: "Contact",
      types: ["TEXT", "PHONE", "EMAIL"] satisfies SmartFormFieldType[],
    },
    {
      label: "Answers",
      types: ["TEXTAREA", "SELECT", "RADIO", "CHECKBOX", "NUMBER"] satisfies SmartFormFieldType[],
    },
    {
      label: "Schedule",
      types: ["DATE", "TIME"] satisfies SmartFormFieldType[],
    },
    {
      label: "Structure",
      types: ["CONSENT", "SECTION", "DIVIDER"] satisfies SmartFormFieldType[],
    },
  ].map((group) => ({
    ...group,
    items: group.types
      .map((type) => FIELD_TYPE_CATALOG.find((item) => item.type === type))
      .filter((item): item is (typeof FIELD_TYPE_CATALOG)[number] => Boolean(item)),
  }));

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
            <>
              <Button
                type="button"
                size="sm"
                className="h-9 gap-1.5"
                disabled={isPending}
                onClick={handlePublish}
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                Update live
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                disabled={isPending}
                onClick={handleClose}
              >
                Close form
              </Button>
            </>
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

      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside
          className={cn(
            "overflow-hidden rounded-2xl border bg-card shadow-sm xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)]",
            mobilePanel !== "add" && "hidden xl:block",
          )}
        >
          <div className="border-b bg-muted/30 px-4 py-4">
            <p className="text-sm font-semibold">Build your form</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Add steps, questions, and layout blocks to the preview.
            </p>
          </div>

          <div className="max-h-[calc(100dvh-13rem)] space-y-4 overflow-y-auto p-4">
            <button
              type="button"
              onClick={addStep}
              className="group relative w-full overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-3 text-left transition-colors hover:bg-primary/10"
            >
              <div
                className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10"
                aria-hidden
              />
              <div className="relative flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                  +1
                </span>
                <span>
                  <span className="block text-sm font-semibold">Add step</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    Split long forms into simple pages.
                  </span>
                </span>
              </div>
            </button>

            {fieldGroups.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {group.label}
                  </p>
                  <span className="text-[11px] text-muted-foreground">{group.items.length}</span>
                </div>
                <div className="grid gap-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => addField(item.type)}
                        className="group flex items-start gap-3 rounded-xl border bg-background px-3 py-2.5 text-left text-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/40 hover:shadow-sm"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{item.label}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                            {item.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div
          className={cn(
            "rounded-xl border p-4 sm:p-6 min-h-[520px] flex items-start justify-center",
            mobilePanel !== "preview" && "hidden xl:block",
          )}
          style={{ backgroundColor: formBackground }}
        >
          <div
            className="mx-auto w-full max-w-[620px] overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]"
            style={{ ["--form-primary" as string]: primary }}
          >
            {bannerUrl.trim() ? (
              <FormHeaderBanner
                src={bannerUrl.trim()}
                position={bannerPosition}
                onClick={openFormSettings}
                heightClass="h-32"
              />
            ) : (
              <button
                type="button"
                onClick={openFormSettings}
                className="flex h-20 w-full items-center justify-center border-b border-dashed border-zinc-200 bg-zinc-50 text-xs text-zinc-400 hover:bg-zinc-100/80 transition-colors"
              >
                <ImageIcon className="mr-1.5 h-4 w-4" />
                Add header image (Form settings)
              </button>
            )}

            <div className="space-y-5 p-5 sm:p-6">
              <div className="space-y-1 border-b border-zinc-100 pb-4">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-lg font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0 text-zinc-900"
                  placeholder="Form title"
                />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Short description (optional)"
                  className="border-none shadow-none px-0 resize-none focus-visible:ring-0 text-sm text-zinc-500"
                />
                {layoutSettings.welcomeMessage ? (
                  <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
                    {layoutSettings.welcomeMessage}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={openFormSettings}
                    className="w-full rounded-lg border border-dashed border-zinc-200 bg-zinc-50/50 px-3 py-2 text-left text-xs text-zinc-400 hover:bg-zinc-50 transition-colors"
                  >
                    Add a welcome message for visitors (Form settings)
                  </button>
                )}
              </div>

              {fields.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-10 border border-dashed border-zinc-200 rounded-xl">
                  Add fields from the left panel.
                </p>
              ) : (
                <FormFieldsLayout
                  fields={fields}
                  disabled
                  selectedId={selectedId}
                  onSelectField={(id) => {
                    setSelectedId(id);
                    setSettingsTab("field");
                    setMobilePanel("settings");
                  }}
                />
              )}

              <button
                type="button"
                disabled
                className="w-full h-11 text-sm font-semibold text-white"
                style={{ backgroundColor: primary, borderRadius: buttonRadius }}
              >
                {buttonText}
              </button>
            </div>
          </div>
        </div>

        <aside
          className={cn(
            "rounded-xl border bg-card p-4 h-fit",
            mobilePanel !== "settings" && "hidden xl:block",
          )}
        >
          <Tabs
            value={settingsTab}
            onValueChange={(v) => setSettingsTab(v as "field" | "form")}
          >
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
                      onChange={(e) => handleLabelChange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Field key</Label>
                    <Input
                      value={selected.fieldKey}
                      onChange={(e) => handleFieldKeyChange(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {fieldKeyIsAuto
                        ? "Generated from the label. Edit to set a custom key."
                        : "Custom key — label changes will no longer update this."}
                    </p>
                  </div>
                  {getFieldTypeMeta(selected.fieldType).isInput ? (
                    <>
                      <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
                        <Label>Dynamic value</Label>
                        <select
                          value={selected.dynamicValue ?? ""}
                          onChange={(e) => handleDynamicValueChange(e.target.value)}
                          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                        >
                          <option value="">No basic dynamic value</option>
                          {selectedDynamicValueOptions.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.label} ({item.tag})
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                          Use this field as a basic merge value in success messages and SMS templates.
                        </p>
                      </div>
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

                  {selected.fieldType === "SECTION" ? (
                    <div className="space-y-4 rounded-lg border bg-muted/20 p-3">
                      <label className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selected.startsStep === true}
                          onChange={(e) => updateSelected({ startsStep: e.target.checked })}
                          className="mt-1"
                        />
                        <span>
                          <span className="block font-medium">Start a new step here</span>
                          <span className="block text-xs text-muted-foreground">
                            Visitors will see fields below this section on a separate page.
                          </span>
                        </span>
                      </label>

                      <div className="space-y-2">
                        <Label>Section layout</Label>
                        <select
                          value={selected.sectionColumns ?? 1}
                          onChange={(e) =>
                            updateSelected({
                              sectionColumns: Number(e.target.value) === 2 ? 2 : 1,
                            })
                          }
                          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                        >
                          <option value={1}>Single column</option>
                          <option value={2}>Two columns (side by side)</option>
                        </select>
                        <p className="text-xs text-muted-foreground">
                          Set fields below to half width to place 2 per row.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {fieldCanBeHalfWidth(selected) && selectedSectionColumns === 2 ? (
                    <div className="space-y-2">
                      <Label>Field width</Label>
                      <select
                        value={selected.width ?? "full"}
                        onChange={(e) =>
                          updateSelected({
                            width: e.target.value === "half" ? "half" : "full",
                          })
                        }
                        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                      >
                        <option value="full">Full width</option>
                        <option value="half">Half width (2 per row)</option>
                      </select>
                    </div>
                  ) : fieldCanBeHalfWidth(selected) ? (
                    <p className="text-xs text-muted-foreground rounded-lg border bg-muted/30 px-3 py-2">
                      Set the section above to two columns to place fields side by side.
                    </p>
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
              <HeaderBannerEditor
                bannerUrl={bannerUrl}
                position={bannerPosition}
                onBannerUrlChange={setBannerUrl}
                onPositionChange={(pos) =>
                  setLayoutSettings((prev) => ({ ...prev, bannerPosition: pos }))
                }
              />
              <div className="space-y-2">
                <Label>Message for visitors</Label>
                <Textarea
                  rows={3}
                  value={layoutSettings.welcomeMessage ?? ""}
                  onChange={(e) =>
                    setLayoutSettings((prev) => ({
                      ...prev,
                      welcomeMessage: e.target.value,
                    }))
                  }
                  placeholder="Welcome! Please fill out this form and we'll get back to you shortly."
                />
                <p className="text-xs text-muted-foreground">
                  A friendly note shown below the title on the live form.
                </p>
              </div>

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
                  value={themeSettings.backgroundColor ?? DEFAULT_FORM_BACKGROUND}
                  onChange={(e) =>
                    setThemeSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))
                  }
                  className="h-11 p-1"
                />
                <p className="text-xs text-muted-foreground">
                  Page background behind your form card on the live form and preview.
                </p>
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
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-foreground">Insert submitted value</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Click a dynamic value to personalize the thank-you message.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {successMessageTags.map((item) => (
                      <button
                        key={item.tag}
                        type="button"
                        onClick={() => insertSuccessMessageTag(item.tag)}
                        className="rounded-lg border bg-background px-2.5 py-1.5 text-left text-[11px] transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                        title={item.tag}
                      >
                        <span className="block font-medium">{item.label}</span>
                        <span className="block font-mono text-[10px] text-muted-foreground">
                          {item.tag}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
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
