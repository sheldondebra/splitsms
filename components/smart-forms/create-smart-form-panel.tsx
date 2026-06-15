"use client";

import { useState } from "react";
import { createSmartFormAction } from "@/lib/actions/smart-forms";
import { FORM_TEMPLATES } from "@/lib/smart-forms/templates";
import { AppCard, AppCardBody } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Group = { id: string; name: string };

export function CreateSmartFormPanel({ groups }: { groups: Group[] }) {
  const [templateId, setTemplateId] = useState("blank");

  return (
    <form action={createSmartFormAction} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <AppCard>
          <AppCardBody className="p-5 sm:p-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Form name</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="e.g. Summer event registration"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Shown on the public form and in your dashboard."
              />
            </div>
          </AppCardBody>
        </AppCard>

        <div>
          <h2 className="text-lg font-semibold">Choose a template</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start blank or pick a preset — you can customize fields in the builder.
          </p>
          <input type="hidden" name="templateId" value={templateId} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40 hover:bg-muted/50",
                  )}
                >
                  {selected ? (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : null}
                  <p className="font-semibold pr-8">{template.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
                  {template.fields.length > 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {template.fields.length} starter fields
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <AppCard>
          <AppCardBody className="p-5 space-y-4">
            <h2 className="font-semibold">Contact group</h2>
            <p className="text-sm text-muted-foreground">
              Optionally save respondents into a contact group for future campaigns.
            </p>
            <div className="space-y-2">
              <Label htmlFor="contactGroupId">Group</Label>
              <select
                id="contactGroupId"
                name="contactGroupId"
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                defaultValue=""
              >
                <option value="">Do not save to a group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="saveToContacts" className="mt-1" />
              <span>Save respondents as contacts when the form is submitted</span>
            </label>
          </AppCardBody>
        </AppCard>

        <Button type="submit" className="w-full h-11">
          Create form & open builder
        </Button>
      </div>
    </form>
  );
}
