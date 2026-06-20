import type { SmartFormFieldType } from "@/lib/generated/prisma/client";
import type { BuilderField } from "@/lib/smart-forms/types";
import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  Calendar,
  CheckSquare,
  CircleDot,
  Clock,
  Hash,
  List,
  Mail,
  Minus,
  Phone,
  TextCursorInput,
  Type,
} from "lucide-react";
import { slugifyFormName } from "@/lib/smart-forms/slugify";

export type FieldTypeMeta = {
  type: SmartFormFieldType;
  label: string;
  description: string;
  icon: LucideIcon;
  hasOptions: boolean;
  isInput: boolean;
};

export const FIELD_TYPE_CATALOG: FieldTypeMeta[] = [
  { type: "TEXT", label: "Short text", description: "Single-line input", icon: TextCursorInput, hasOptions: false, isInput: true },
  { type: "TEXTAREA", label: "Long text", description: "Multi-line paragraph", icon: AlignLeft, hasOptions: false, isInput: true },
  { type: "PHONE", label: "Phone number", description: "Validated mobile number", icon: Phone, hasOptions: false, isInput: true },
  { type: "EMAIL", label: "Email", description: "Email address", icon: Mail, hasOptions: false, isInput: true },
  { type: "NUMBER", label: "Number", description: "Numeric value", icon: Hash, hasOptions: false, isInput: true },
  { type: "SELECT", label: "Dropdown", description: "Pick one option", icon: List, hasOptions: true, isInput: true },
  { type: "RADIO", label: "Radio buttons", description: "Choose one", icon: CircleDot, hasOptions: true, isInput: true },
  { type: "CHECKBOX", label: "Checkboxes", description: "Choose multiple", icon: CheckSquare, hasOptions: true, isInput: true },
  { type: "DATE", label: "Date", description: "Calendar date", icon: Calendar, hasOptions: false, isInput: true },
  { type: "TIME", label: "Time", description: "Time of day", icon: Clock, hasOptions: false, isInput: true },
  { type: "CONSENT", label: "Consent", description: "Agreement checkbox", icon: CheckSquare, hasOptions: false, isInput: true },
  { type: "SECTION", label: "Section / step", description: "Heading or page break", icon: Type, hasOptions: false, isInput: false },
  { type: "DIVIDER", label: "Divider", description: "Visual separator", icon: Minus, hasOptions: false, isInput: false },
];

export function getFieldTypeMeta(type: SmartFormFieldType): FieldTypeMeta {
  return FIELD_TYPE_CATALOG.find((f) => f.type === type) ?? FIELD_TYPE_CATALOG[0];
}

export function defaultLabelForType(type: SmartFormFieldType): string {
  return getFieldTypeMeta(type).label;
}

export function fieldKeyFromLabel(label: string): string {
  return slugifyFormName(label).replace(/-/g, "_") || "field";
}

export function suggestFieldKey(label: string, existing: string[]): string {
  const base = fieldKeyFromLabel(label);
  if (!existing.includes(base)) return base;
  let i = 2;
  while (existing.includes(`${base}_${i}`)) i += 1;
  return `${base}_${i}`;
}

export function newClientFieldId(): string {
  return `new_${Math.random().toString(36).slice(2, 10)}`;
}

export function parseFieldOptions(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return raw.split("\n").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

export type FieldValidationRules = {
  width?: "full" | "half";
  sectionColumns?: 1 | 2;
  startsStep?: boolean;
  dynamicValue?: string;
};

export function parseFieldValidationRules(raw: unknown): FieldValidationRules {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const obj = raw as Record<string, unknown>;
  const width = obj.width === "half" ? "half" : obj.width === "full" ? "full" : undefined;
  const sectionColumns =
    obj.sectionColumns === 2 ? 2 : obj.sectionColumns === 1 ? 1 : undefined;
  const startsStep = obj.startsStep === true ? true : undefined;
  const dynamicValue = typeof obj.dynamicValue === "string" ? obj.dynamicValue : undefined;
  return { width, sectionColumns, startsStep, dynamicValue };
}

export function toFieldValidationRules(
  field: Pick<BuilderField, "width" | "sectionColumns" | "startsStep" | "dynamicValue" | "fieldType">,
): FieldValidationRules | undefined {
  const rules: FieldValidationRules = {};
  if (field.fieldType === "SECTION" && field.sectionColumns === 2) {
    rules.sectionColumns = 2;
  }
  if (field.fieldType === "SECTION" && field.startsStep) {
    rules.startsStep = true;
  }
  if (field.dynamicValue) rules.dynamicValue = field.dynamicValue;
  if (field.width === "half") rules.width = "half";
  if (Object.keys(rules).length === 0) return undefined;
  return rules;
}
