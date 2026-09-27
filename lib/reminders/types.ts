/** Campaign names for Reminder SMS are prefixed so list/filter stays simple. */
export const REMINDER_NAME_PREFIX = "[Reminder]";

export const REMINDER_PRESETS = [
  {
    id: "payment",
    label: "Payment",
    description: "Due-date reminders for fees, gold, or subscriptions",
    earlyMessage:
      "Hi {name}, friendly reminder: your payment is due soon. Please pay before the due date.",
    dueMessage:
      "Hi {name}, today is your payment due date. Please complete your payment. Thank you.",
    earlyDaysDefault: 3,
  },
  {
    id: "birthday",
    label: "Birthday",
    description: "Wish contacts on a chosen date",
    earlyMessage: "",
    dueMessage: "Happy birthday {name}! Wishing you a wonderful day.",
    earlyDaysDefault: 0,
  },
  {
    id: "meeting",
    label: "Meeting",
    description: "Remind people before a meeting",
    earlyMessage:
      "Hi {name}, reminder: we have a meeting coming up. See you there.",
    dueMessage: "Hi {name}, our meeting is today. See you soon.",
    earlyDaysDefault: 1,
  },
  {
    id: "holiday",
    label: "Holiday",
    description: "Seasonal or holiday greetings",
    earlyMessage: "",
    dueMessage: "Hi {name}, warm wishes for the holiday season from us.",
    earlyDaysDefault: 0,
  },
  {
    id: "custom",
    label: "Custom",
    description: "Any other reminder",
    earlyMessage: "",
    dueMessage: "Hi {name}, this is a reminder from us.",
    earlyDaysDefault: 0,
  },
] as const;

export type ReminderPresetId = (typeof REMINDER_PRESETS)[number]["id"];

export function reminderCampaignName(title: string, kind: "early" | "due") {
  const clean = title.trim() || "Reminder";
  const tag = kind === "early" ? "Early" : "Due";
  return `${REMINDER_NAME_PREFIX} ${clean} · ${tag}`;
}

export function isReminderCampaignName(name: string) {
  return name.startsWith(REMINDER_NAME_PREFIX);
}

export function reminderTitleFromCampaignName(name: string) {
  if (!isReminderCampaignName(name)) return name;
  return name
    .replace(REMINDER_NAME_PREFIX, "")
    .replace(/\s*·\s*(Early|Due)(\s*\(recurring\))?$/i, "")
    .trim();
}

/** Subtract calendar days from a Date (local wall clock). */
export function subtractDays(from: Date, days: number) {
  const next = new Date(from);
  next.setDate(next.getDate() - days);
  return next;
}
