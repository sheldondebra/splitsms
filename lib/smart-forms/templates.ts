import type { SmartFormFieldType } from "@/lib/generated/prisma/client";

export type FormTemplateField = {
  label: string;
  fieldKey: string;
  fieldType: SmartFormFieldType;
  placeholder?: string;
  helperText?: string;
  isRequired?: boolean;
  options?: string[];
};

export type FormTemplate = {
  id: string;
  name: string;
  description: string;
  fields: FormTemplateField[];
};

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "blank",
    name: "Blank form",
    description: "Start from scratch and add your own fields.",
    fields: [],
  },
  {
    id: "event",
    name: "Event registration",
    description: "Collect names, phone numbers, and attendance details.",
    fields: [
      { label: "Full name", fieldKey: "full_name", fieldType: "TEXT", isRequired: true },
      { label: "Phone number", fieldKey: "phone", fieldType: "PHONE", isRequired: true },
      { label: "Email", fieldKey: "email", fieldType: "EMAIL" },
      {
        label: "Number of guests",
        fieldKey: "guests",
        fieldType: "NUMBER",
        placeholder: "1",
      },
    ],
  },
  {
    id: "contact",
    name: "Contact collection",
    description: "Capture leads with name, phone, and email.",
    fields: [
      { label: "Full name", fieldKey: "full_name", fieldType: "TEXT", isRequired: true },
      { label: "Phone number", fieldKey: "phone", fieldType: "PHONE", isRequired: true },
      { label: "Email", fieldKey: "email", fieldType: "EMAIL" },
      {
        label: "How did you hear about us?",
        fieldKey: "source",
        fieldType: "SELECT",
        options: ["Social media", "Friend", "Website", "Other"],
      },
    ],
  },
  {
    id: "feedback",
    name: "Customer feedback",
    description: "Short survey with rating and comments.",
    fields: [
      { label: "Your name", fieldKey: "name", fieldType: "TEXT" },
      { label: "Phone number", fieldKey: "phone", fieldType: "PHONE" },
      {
        label: "Overall rating",
        fieldKey: "rating",
        fieldType: "RADIO",
        isRequired: true,
        options: ["Excellent", "Good", "Average", "Poor"],
      },
      {
        label: "Comments",
        fieldKey: "comments",
        fieldType: "TEXTAREA",
        placeholder: "Tell us more…",
      },
    ],
  },
  {
    id: "training",
    name: "Training registration",
    description: "Register participants for a workshop or class.",
    fields: [
      { label: "Full name", fieldKey: "full_name", fieldType: "TEXT", isRequired: true },
      { label: "Phone number", fieldKey: "phone", fieldType: "PHONE", isRequired: true },
      { label: "Email", fieldKey: "email", fieldType: "EMAIL", isRequired: true },
      { label: "Organization", fieldKey: "organization", fieldType: "TEXT" },
    ],
  },
  {
    id: "church",
    name: "Church registration",
    description: "Member or visitor sign-up for events and follow-up.",
    fields: [
      { label: "Full name", fieldKey: "full_name", fieldType: "TEXT", isRequired: true },
      { label: "Phone number", fieldKey: "phone", fieldType: "PHONE", isRequired: true },
      {
        label: "First visit?",
        fieldKey: "first_visit",
        fieldType: "RADIO",
        options: ["Yes", "No"],
      },
    ],
  },
  {
    id: "school",
    name: "School inquiry",
    description: "Parent or student inquiry form.",
    fields: [
      { label: "Parent / guardian name", fieldKey: "guardian_name", fieldType: "TEXT", isRequired: true },
      { label: "Phone number", fieldKey: "phone", fieldType: "PHONE", isRequired: true },
      { label: "Student name", fieldKey: "student_name", fieldType: "TEXT" },
      { label: "Grade level", fieldKey: "grade", fieldType: "TEXT" },
      { label: "Message", fieldKey: "message", fieldType: "TEXTAREA" },
    ],
  },
  {
    id: "order",
    name: "Product order",
    description: "Simple order form with product and quantity.",
    fields: [
      { label: "Full name", fieldKey: "full_name", fieldType: "TEXT", isRequired: true },
      { label: "Phone number", fieldKey: "phone", fieldType: "PHONE", isRequired: true },
      { label: "Product", fieldKey: "product", fieldType: "TEXT", isRequired: true },
      { label: "Quantity", fieldKey: "quantity", fieldType: "NUMBER", isRequired: true },
      { label: "Delivery address", fieldKey: "address", fieldType: "TEXTAREA" },
    ],
  },
  {
    id: "appointment",
    name: "Appointment request",
    description: "Let customers request a date and time.",
    fields: [
      { label: "Full name", fieldKey: "full_name", fieldType: "TEXT", isRequired: true },
      { label: "Phone number", fieldKey: "phone", fieldType: "PHONE", isRequired: true },
      { label: "Preferred date", fieldKey: "date", fieldType: "DATE", isRequired: true },
      { label: "Preferred time", fieldKey: "time", fieldType: "TIME" },
      { label: "Notes", fieldKey: "notes", fieldType: "TEXTAREA" },
    ],
  },
  {
    id: "survey",
    name: "Survey form",
    description: "Multi-question survey with consent.",
    fields: [
      { label: "About you", fieldKey: "section_about", fieldType: "SECTION" },
      { label: "Full name", fieldKey: "full_name", fieldType: "TEXT", isRequired: true },
      { label: "Phone number", fieldKey: "phone", fieldType: "PHONE", isRequired: true },
      { label: "Feedback", fieldKey: "section_feedback", fieldType: "SECTION" },
      {
        label: "Your feedback",
        fieldKey: "feedback",
        fieldType: "TEXTAREA",
        isRequired: true,
      },
      {
        label: "I agree to be contacted about this survey",
        fieldKey: "consent",
        fieldType: "CONSENT",
        isRequired: true,
      },
    ],
  },
];

export function getFormTemplate(id: string): FormTemplate {
  return FORM_TEMPLATES.find((t) => t.id === id) ?? FORM_TEMPLATES[0];
}
