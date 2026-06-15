import type { SmartFormFieldType, SmartFormStatus } from "@/lib/generated/prisma/client";

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
};

export type SerializedSmartForm = {
  id: string;
  name: string;
  description: string | null;
  status: SmartFormStatus;
  shortCode: string;
  slug: string;
  themeSettings: SmartFormThemeSettings;
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
  themeSettings: SmartFormThemeSettings;
  successSettings: SmartFormSuccessSettings;
  captchaEnabled: boolean;
  fields: BuilderField[];
};

export type SaveBuilderPayload = {
  name: string;
  description: string;
  themeSettings: SmartFormThemeSettings;
  successSettings: SmartFormSuccessSettings;
  saveToContacts: boolean;
  contactGroupId: string | null;
  preventDuplicatePhone: boolean;
  preventDuplicateEmail: boolean;
  captchaEnabled: boolean;
  fields: BuilderField[];
};
