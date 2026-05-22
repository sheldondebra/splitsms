"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  changePasswordSchema,
  updateProfileSchema,
} from "@/lib/auth/validation";
import { createAndSendOtp } from "@/lib/auth/otp";
import { checkRateLimit, rateLimitKey } from "@/lib/auth/rate-limit";
import { logAuthEvent } from "@/lib/auth/audit";

function settingsRedirect(params?: Record<string, string>): never {
  const q = params ? `?${new URLSearchParams(params).toString()}` : "";
  redirect(`/dashboard/settings${q}`);
}

export async function updateProfileAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email") ?? "",
  });

  if (!parsed.success) {
    settingsRedirect({ error: "profile" });
  }

  const { fullName, email } = parsed.data;

  if (email) {
    const taken = await prisma.user.findFirst({
      where: { email, id: { not: session.userId } },
    });
    if (taken) settingsRedirect({ error: "email_taken" });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      fullName,
      email: email || null,
    },
  });

  settingsRedirect({ profile: "saved" });
}

export async function changePasswordAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0]?.path[0];
    if (issue === "currentPassword") settingsRedirect({ error: "current_password" });
    settingsRedirect({ error: "weak_password" });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { passwordHash: true },
  });

  if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    settingsRedirect({ error: "wrong_password" });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({
    where: { id: session.userId },
    data: {
      passwordHash,
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });

  await logAuthEvent("PASSWORD_CHANGED", { phone: session.phone }, session.userId);
  settingsRedirect({ password: "changed" });
}

export async function requestPasswordResetSmsAction() {
  const session = await getSession();
  if (!session) redirect("/login");

  const limit = await checkRateLimit(rateLimitKey("forgot", session.phone));
  if (!limit.allowed) {
    settingsRedirect({ error: "rate_limit" });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) settingsRedirect({ error: "user" });

  const otp = await createAndSendOtp(
    user.phone,
    "PASSWORD_RESET",
    user.countryCode,
    user.id,
  );

  if (!otp.ok) {
    settingsRedirect({
      error: "cooldown",
      cooldown: String(otp.cooldownSec),
    });
  }

  await logAuthEvent("PASSWORD_RESET_REQUESTED", { phone: user.phone }, user.id);
  redirect(
    `/verify-otp?phone=${encodeURIComponent(user.phone)}&purpose=reset&country=${encodeURIComponent(user.countryCode)}&returnTo=${encodeURIComponent("/dashboard/settings")}`,
  );
}

export async function saveWebhookAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");

  const url = String(formData.get("url") ?? "").trim();
  if (!url) settingsRedirect({ error: "webhook_url" });

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      settingsRedirect({ error: "webhook_url" });
    }
  } catch {
    settingsRedirect({ error: "webhook_url" });
  }

  const secret = randomBytes(16).toString("hex");

  const existing = await prisma.webhookEndpoint.findFirst({
    where: { userId: session.userId },
  });

  if (existing) {
    await prisma.webhookEndpoint.update({
      where: { id: existing.id },
      data: { url, isActive: true },
    });
  } else {
    await prisma.webhookEndpoint.create({
      data: {
        userId: session.userId,
        url,
        secret,
        events: ["message.delivered", "message.failed", "message.sent"],
      },
    });
  }

  settingsRedirect({ webhook: "saved" });
}

export async function clearWebhookAction() {
  const session = await getSession();
  if (!session) redirect("/login");

  await prisma.webhookEndpoint.updateMany({
    where: { userId: session.userId },
    data: { isActive: false },
  });

  settingsRedirect({ webhook: "cleared" });
}
