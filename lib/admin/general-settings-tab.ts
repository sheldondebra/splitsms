export const GENERAL_SETTINGS_TABS = ["email", "alerts", "slack", "sms_test", "maintenance"] as const;

export type GeneralSettingsTab = (typeof GENERAL_SETTINGS_TABS)[number];

export type GeneralSettingsTabParams = {
  tab?: string;
  saved?: string;
  test?: string;
  error?: string;
};

const EMAIL_SAVED = new Set(["email", "mailjet"]);
const EMAIL_TESTS = new Set(["connection", "send"]);
const EMAIL_ERRORS = new Set([
  "from_email",
  "from_name",
  "smtp_host",
  "smtp_user",
  "email",
  "not_configured",
]);

function isTab(value: string | undefined): value is GeneralSettingsTab {
  return (
    value === "email" ||
    value === "alerts" ||
    value === "slack" ||
    value === "sms_test" ||
    value === "maintenance"
  );
}

/** Pick the settings tab from flash/query params so save/test lands on the right panel. */
export function resolveGeneralSettingsTab(
  params: GeneralSettingsTabParams,
): GeneralSettingsTab {
  if (isTab(params.tab)) return params.tab;
  if (params.saved === "alerts") return "alerts";
  if (params.saved === "slack" || params.test === "slack") return "slack";
  if (
    (params.saved && EMAIL_SAVED.has(params.saved)) ||
    (params.test && EMAIL_TESTS.has(params.test)) ||
    (params.error && EMAIL_ERRORS.has(params.error))
  ) {
    return "email";
  }
  return "email";
}
