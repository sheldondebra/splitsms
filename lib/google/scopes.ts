export const GOOGLE_SCOPES = {
  openid: "openid",
  email: "email",
  profile: "profile",
  contactsReadonly: "https://www.googleapis.com/auth/contacts.readonly",
  contacts: "https://www.googleapis.com/auth/contacts",
  spreadsheets: "https://www.googleapis.com/auth/spreadsheets",
  driveReadonly: "https://www.googleapis.com/auth/drive.readonly",
  formsBodyReadonly: "https://www.googleapis.com/auth/forms.body.readonly",
  formsResponsesReadonly: "https://www.googleapis.com/auth/forms.responses.readonly",
} as const;

export const GOOGLE_BASE_SCOPES = [
  GOOGLE_SCOPES.openid,
  GOOGLE_SCOPES.email,
  GOOGLE_SCOPES.profile,
] as const;

export const GOOGLE_CONTACTS_IMPORT_SCOPES = [GOOGLE_SCOPES.contactsReadonly] as const;
export const GOOGLE_CONTACTS_EXPORT_SCOPES = [GOOGLE_SCOPES.contacts] as const;
export const GOOGLE_SHEETS_SCOPES = [
  GOOGLE_SCOPES.spreadsheets,
  GOOGLE_SCOPES.driveReadonly,
] as const;
export const GOOGLE_FORMS_SCOPES = [
  GOOGLE_SCOPES.formsBodyReadonly,
  GOOGLE_SCOPES.formsResponsesReadonly,
  GOOGLE_SCOPES.driveReadonly,
] as const;
