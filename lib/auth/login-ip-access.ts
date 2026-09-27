import type { UserRole } from "@/lib/generated/prisma/client";
import { getRequestIp } from "@/lib/auth/request-ip";
import { logAuthEvent } from "@/lib/auth/audit";
import {
  evaluatePlatformIpAccess,
  loadPlatformIpAccessConfig,
  roleBypassesPlatformIpAccess,
  type PlatformIpAccessDecision,
} from "@/lib/admin/ip-access";

/**
 * Block non-staff logins from blacklisted (or non-whitelisted) IPs.
 * Notifies Slack so an admin can unblock the IP.
 */
export async function enforceLoginIpAccess(params: {
  userId: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  email?: string | null;
  method?: string;
}): Promise<{ ok: true } | { ok: false; decision: Extract<PlatformIpAccessDecision, { allowed: false }> }> {
  if (roleBypassesPlatformIpAccess(params.role)) {
    return { ok: true };
  }

  const ip = await getRequestIp();
  const config = await loadPlatformIpAccessConfig();
  const decision = evaluatePlatformIpAccess(ip, config);

  if (decision.allowed) {
    return { ok: true };
  }

  await logAuthEvent(
    "LOGIN_BLOCKED_IP",
    {
      ip: decision.ip,
      reason: decision.reason,
      matched: decision.matched,
      phone: params.phone,
      method: params.method,
    },
    params.userId,
  );

  void import("@/lib/slack/notify")
    .then(({ notifySlackBlockedIpLogin }) =>
      notifySlackBlockedIpLogin({
        userId: params.userId,
        fullName: params.fullName ?? "Unknown",
        phone: params.phone ?? "—",
        email: params.email,
        ip: decision.ip,
        reason: decision.reason,
        matched: decision.matched,
      }),
    )
    .catch(() => undefined);

  return { ok: false, decision };
}
