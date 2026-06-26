/** Client-safe secret masking for form placeholders (no server/db imports). */
export function maskTailSecret(secret: string) {
  if (!secret) return "";
  if (secret.length <= 6) return "••••••";
  return `${"•".repeat(Math.min(16, secret.length - 4))}${secret.slice(-4)}`;
}
