import { verifyPassword } from "@/lib/auth/password";

export async function isCurrentPassword(
  candidate: string,
  currentHash: string,
) {
  return verifyPassword(candidate, currentHash);
}
