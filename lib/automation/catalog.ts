import type { AutomationTrigger } from "@/lib/generated/prisma/client";

export type TriggerMeta = {
  value: AutomationTrigger;
  label: string;
  description: string;
  /** Runs automatically when the event fires */
  live: boolean;
  hint?: string;
};

/** Client-facing triggers — SMS to the business owner's contacts/customers. */
export const CLIENT_AUTOMATION_TRIGGERS: TriggerMeta[] = [
  {
    value: "SIGNUP",
    label: "New contact",
    description: "Send a welcome SMS when someone is added to your contact list.",
    live: true,
    hint: "Fires when you add a contact manually or import them for the first time.",
  },
  {
    value: "BIRTHDAY",
    label: "Birthday",
    description: "Send a birthday message to contacts on their special day.",
    live: false,
    hint: "Requires birth dates on contacts — coming in a future release.",
  },
  {
    value: "MANUAL",
    label: "Manual",
    description: "Save a message template — no automatic send yet.",
    live: false,
    hint: "Use for drafts until manual run is available.",
  },
];

export const AUTOMATION_TEMPLATES = [
  {
    id: "welcome",
    name: "Welcome SMS",
    trigger: "SIGNUP" as AutomationTrigger,
    message:
      "Hi {firstName}, thanks for joining us! We're glad to have you. Reply if you need anything.",
  },
  {
    id: "welcome-offer",
    name: "Welcome + offer",
    trigger: "SIGNUP" as AutomationTrigger,
    message:
      "Welcome {firstName}! Enjoy 10% off your first order. Show this SMS at checkout or visit our store today.",
  },
  {
    id: "birthday",
    name: "Birthday wish",
    trigger: "BIRTHDAY" as AutomationTrigger,
    message:
      "Happy birthday {firstName}! 🎂 We hope your day is wonderful. Visit us for a special treat.",
  },
] as const;

export function getTriggerMeta(trigger: AutomationTrigger): TriggerMeta {
  const found = CLIENT_AUTOMATION_TRIGGERS.find((t) => t.value === trigger);
  if (found) return found;

  if (HIDDEN_AUTOMATION_TRIGGERS.has(trigger)) {
    return {
      value: trigger,
      label: trigger.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
      description: "This workflow type is no longer used. Delete it or create a new contact workflow.",
      live: false,
      hint: "Automations now send SMS to your contacts, not platform alerts.",
    };
  }

  return CLIENT_AUTOMATION_TRIGGERS[0];
}

export function isClientAutomationTrigger(trigger: AutomationTrigger): boolean {
  return CLIENT_AUTOMATION_TRIGGERS.some((t) => t.value === trigger);
}

/** Legacy/platform triggers kept in DB but hidden from the client UI. */
export const HIDDEN_AUTOMATION_TRIGGERS = new Set<AutomationTrigger>([
  "LOW_BALANCE",
  "CAMPAIGN_COMPLETE",
]);
