import { prisma } from "@/lib/db";
import {
  notifySlackAuthFailure,
  notifySlackUserLogin,
  notifySlackUserRegistration,
} from "@/lib/slack/notify";

export async function dispatchSlackAuthEvent(
  action: string,
  metadata: Record<string, unknown>,
  actorId?: string,
) {
  // Password reset request/complete must never ping Slack.
  if (
    action === "PASSWORD_RESET_REQUESTED" ||
    action === "PASSWORD_RESET_OTP_VERIFIED" ||
    action === "PASSWORD_RESET_COMPLETED" ||
    action === "PASSWORD_RESET_LINK_SENT"
  ) {
    return;
  }

  if (action === "LOGIN_FAILED") {
    await notifySlackAuthFailure({
      identifier: String(metadata.identifier ?? metadata.phone ?? "unknown"),
    });
    return;
  }

  if (!actorId) return;

  const user = await prisma.user.findUnique({
    where: { id: actorId },
    select: { id: true, fullName: true, phone: true, email: true, role: true },
  });
  if (!user || user.role !== "MEMBER") return;

  if (action === "PROFILE_COMPLETED") {
    await notifySlackUserRegistration({
      userId: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
    });
    return;
  }

  if (action === "LOGIN_SUCCESS") {
    await notifySlackUserLogin({
      userId: user.id,
      fullName: user.fullName,
      phone: user.phone,
    });
  }
}
