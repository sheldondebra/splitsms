export const API_PERMISSIONS = [
  "sms.send",
  "sms.read",
  "wallet.read",
  "contacts.read",
  "contacts.write",
  "campaigns.read",
] as const;

export type ApiPermission = (typeof API_PERMISSIONS)[number];

export const DEFAULT_API_PERMISSIONS: ApiPermission[] = [
  "sms.send",
  "sms.read",
  "wallet.read",
  "contacts.read",
  "contacts.write",
  "campaigns.read",
];

export function hasPermission(
  permissions: string[],
  required: ApiPermission,
): boolean {
  return permissions.includes(required);
}
