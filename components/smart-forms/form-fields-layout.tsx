"use client";

import { FormFieldRender } from "@/components/smart-forms/form-field-render";
import { buildFieldLayoutBlocks } from "@/lib/smart-forms/field-layout";
import type { BuilderField } from "@/lib/smart-forms/types";
import { cn } from "@/lib/utils";

type FormFieldsLayoutProps = {
  fields: BuilderField[];
  variant?: "default" | "public";
  values?: Record<string, string | string[]>;
  errors?: Record<string, string>;
  validationStates?: Record<string, "valid">;
  onChange?: (fieldKey: string, value: string | string[]) => void;
  disabled?: boolean;
  selectedId?: string | null;
  onSelectField?: (id: string) => void;
};

export function FormFieldsLayout({
  fields,
  variant = "default",
  values,
  errors,
  validationStates,
  onChange,
  disabled,
  selectedId,
  onSelectField,
}: FormFieldsLayoutProps) {
  const blocks = buildFieldLayoutBlocks(fields);
  const isBuilder = Boolean(onSelectField);

  return (
    <div className="space-y-5">
      {blocks.map((block) => {
        if (block.kind === "section") {
          const sectionWrap = (
            <div>
              <FormFieldRender field={block.field} disabled={disabled} variant={variant} />
              {isBuilder && block.columns === 2 ? (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Half-width fields appear 2 per row in this section.
                </p>
              ) : null}
            </div>
          );

          if (!isBuilder) return <div key={block.field.id}>{sectionWrap}</div>;

          return (
            <div
              key={block.field.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectField?.(block.field.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelectField?.(block.field.id);
              }}
              className={cn(
                "rounded-lg p-2 -mx-2 transition-colors cursor-pointer",
                selectedId === block.field.id
                  ? "ring-2 ring-primary/40 bg-primary/5"
                  : "hover:bg-muted/40",
              )}
            >
              {sectionWrap}
            </div>
          );
        }

        if (block.kind === "divider") {
          const divider = (
            <FormFieldRender field={block.field} disabled={disabled} variant={variant} />
          );
          if (!isBuilder) return <div key={block.field.id}>{divider}</div>;
          return (
            <div
              key={block.field.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectField?.(block.field.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelectField?.(block.field.id);
              }}
              className={cn(
                "rounded-lg p-2 -mx-2 transition-colors cursor-pointer",
                selectedId === block.field.id
                  ? "ring-2 ring-primary/40 bg-primary/5"
                  : "hover:bg-muted/40",
              )}
            >
              {divider}
            </div>
          );
        }

        const gridCols = block.columns === 2 ? "sm:grid-cols-2" : "";

        return (
          <div
            key={`row-${block.fields.map((f) => f.id).join("-")}`}
            className={cn("grid gap-4", gridCols)}
          >
            {block.fields.map((field) => {
              const inner = (
                <FormFieldRender
                  field={field}
                  value={values?.[field.fieldKey]}
                  onChange={onChange}
                  error={errors?.[field.fieldKey]}
                  validationState={validationStates?.[field.fieldKey]}
                  disabled={disabled}
                  variant={variant}
                />
              );

              if (!isBuilder) return <div key={field.id}>{inner}</div>;

              return (
                <div
                  key={field.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectField?.(field.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onSelectField?.(field.id);
                  }}
                  className={cn(
                    "rounded-lg p-2 -mx-2 transition-colors cursor-pointer",
                    selectedId === field.id
                      ? "ring-2 ring-primary/40 bg-primary/5"
                      : "hover:bg-muted/40",
                  )}
                >
                  {inner}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
