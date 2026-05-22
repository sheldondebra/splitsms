import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { isIpAllowed } from "@/lib/enterprise/context";

export async function verifySmppBind(
  systemId: string,
  password: string,
  clientIp?: string | null,
) {
  const account = await prisma.smppAccount.findUnique({
    where: { systemId },
    include: {
      enterprise: {
        include: { user: true, dedicatedRoute: true },
      },
    },
  });

  if (!account?.isActive || account.enterprise.status !== "ACTIVE") {
    return { ok: false as const, reason: "invalid_account" };
  }

  const whitelist = [...account.ipWhitelist, ...account.enterprise.ipWhitelist];
  if (!isIpAllowed(clientIp, whitelist)) {
    return { ok: false as const, reason: "ip_denied" };
  }

  const valid = await bcrypt.compare(password, account.passwordHash);
  if (!valid) return { ok: false as const, reason: "invalid_credentials" };

  return { ok: true as const, account };
}

export function generateSmppPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 16; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
