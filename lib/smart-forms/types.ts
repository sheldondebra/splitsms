import type { SmartFormFieldType, SmartFormStatus } from "@/lib/generated/prisma/client";

export type SmartFormLayoutSettings = {
  welcomeMessage?: string;
  bannerPosition?: { x: number; y: number };
};

export type SmartFormThemeSettings = {
  primaryColor?: string;
  buttonText?: string;
  buttonRadius?: string;
  backgroundColor?: string;
  showBranding?: boolean;
};

export type SmartFormSuccessSettings = {
  title?: string;
  message?: string;
  redirectUrl?: string;
  redirectDelayMs?: number;
};

export type BuilderField = {
  id: string;
  label: string;
  fieldKey: string;
  fieldType: SmartFormFieldType;
  placeholder?: string;
  helperText?: string;
  isRequired: boolean;
  options: string[];
  sortOrder: number;
  /** Half width only applies inside a 2-column section */
  width?: "full" | "half";
  /** SECTION fields only — 1 or 2 columns for fields below */
  sectionColumns?: 1 | 2;
};

export type SerializedSmartForm = {
  id: string;
  name: string;
  description: string | null;
  status: SmartFormStatus;
  shortCode: string;
  slug: string;
  bannerUrl: string | null;
  themeSettings: SmartFormThemeSettings;
  layoutSettings: SmartFormLayoutSettings;
  successSettings: SmartFormSuccessSettings;
  saveToContacts: boolean;
  contactGroupId: string | null;
  preventDuplicatePhone: boolean;
  preventDuplicateEmail: boolean;
  captchaEnabled: boolean;
  fields: BuilderField[];
};

export type PublicSmartForm = {
  id: string;
  name: string;
  description: string | null;
  shortCode: string;
  status: SmartFormStatus;
  bannerUrl: string | null;
  themeSettings: SmartFormThemeSettings;
  layoutSettings: SmartFormLayoutSettings;
  successSettings: SmartFormSuccessSettings;
  captchaEnabled: boolean;
  fields: BuilderField[];
};

export type SaveBuilderPayload = {
  name: string;
  description: string;
  bannerUrl: string | null;
  themeSettings: SmartFormThemeSettings;
  layoutSettings: SmartFormLayoutSettings;
  successSettings: SmartFormSuccessSettings;
  saveToContacts: boolean;
  contactGroupId: string | null;
  preventDuplicatePhone: boolean;
  preventDuplicateEmail: boolean;
  captchaEnabled: boolean;
  fields: BuilderField[];
};
