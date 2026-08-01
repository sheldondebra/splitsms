import { prisma } from "@/lib/db";
import type { Prisma, UserRole } from "@/lib/generated/prisma/client";
import {
  EMAIL_MARKETING_INACTIVE_DAYS_DEFAULT,
  EMAIL_MARKETING_MAX_RECIPIENTS,
  type EmailMarketingAudienceType,
} from "@/lib/admin/email-marketing-shared";

export type MarketingRecipient = {
  userId?: string;
  fullName: string;
  email: string;
};

function memberRoles(): UserRole[] {
  return ["MEMBER", "RESELLER", "ENTERPRISE"];
}

function roleFromAudience(audience: EmailMarketingAudienceType): UserRole | null {
  if (audience === "role_member") return "MEMBER";
  if (audience === "role_reseller") return "RESELLER";
  if (audience === "role_enterprise") return "ENTERPRISE";
  return null;
}

export async function resolveMarketingAudience(input: {
  audienceType: EmailMarketingAudienceType;
  inactiveDays?: number;
  manualEmails?: string[];
  max?: number;
}): Promise<MarketingRecipient[]> {
  const max = Math.min(
    Math.max(1, input.max ?? EMAIL_MARKETING_MAX_RECIPIENTS),
    EMAIL_MARKETING_MAX_RECIPIENTS,
  );

  if (input.audienceType === "manual") {
    const emails = [
      ...new Set(
        (input.manualEmails ?? [])
          .map((e) => e.trim().toLowerCase())
          .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
      ),
    ].slice(0, max);

    if (emails.length === 0) return [];

    const existing = await prisma.user.findMany({
      where: { email: { in: emails, mode: "insensitive" } },
      select: { id: true, fullName: true, email: true },
    });
    const byEmail = new Map(
      existing
        .filter((u) => u.email)
        .map((u) => [u.email!.toLowerCase(), u]),
    );

    return emails.map((email) => {
      const user = byEmail.get(email);
      return {
        userId: user?.id,
        fullName: user?.fullName ?? email.split("@")[0] ?? "there",
        email,
      };
    });
  }

  const role = roleFromAudience(input.audienceType);
  const where: Prisma.UserWhereInput = {
    email: { not: null },
    role: role ? role : { in: memberRoles() },
    OR: [{ memberAccount: null }, { memberAccount: { status: "ACTIVE" } }],
  };

  if (input.audienceType === "inactive") {
    const days = input.inactiveDays ?? EMAIL_MARKETING_INACTIVE_DAYS_DEFAULT;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    where.AND = [
      {
        OR: [
          { sessions: { none: {} } },
          { sessions: { every: { lastActiveAt: { lt: cutoff } } } },
        ],
      },
      {
        OR: [
          { messages: { none: {} } },
          { messages: { every: { createdAt: { lt: cutoff } } } },
        ],
      },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true, fullName: true, email: true },
    orderBy: { updatedAt: "desc" },
    take: max,
  });

  return users
    .filter((u) => u.email?.trim())
    .map((u) => ({
      userId: u.id,
      fullName: u.fullName,
      email: u.email!.trim().toLowerCase(),
    }));
}

export async function countMarketingAudience(input: {
  audienceType: EmailMarketingAudienceType;
  inactiveDays?: number;
}) {
  if (input.audienceType === "manual") return 0;
  const recipients = await resolveMarketingAudience({
    ...input,
    max: EMAIL_MARKETING_MAX_RECIPIENTS,
  });
  return recipients.length;
}
