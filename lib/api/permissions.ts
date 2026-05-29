export const API_PERMISSIONS = [
  "sms.send",
  "sms.read",
  "wallet.read",
  "contacts.read",
  "contacts.write",
  "campaigns.read",
  "connect.customers",
  "sender_ids.read",
  "sender_ids.write",
] as const;

export type ApiPermission = (typeof API_PERMISSIONS)[number];

export const DEFAULT_API_PERMISSIONS: ApiPermission[] = [
  "sms.send",
  "sms.read",
  "wallet.read",
  "contacts.read",
  "contacts.write",
  "campaigns.read",
  "connect.customers",
  "sender_ids.read",
  "sender_ids.write",
];

export function hasPermission(
  permissions: string[],
  required: ApiPermission,
): boolean {
  return permissions.includes(required);
}
