import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { getRealSession, isAdminRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DEFAULT_API_PERMISSIONS } from "@/lib/api/permissions";
import { RATE_LIMIT_TIERS } from "@/lib/api/rate-limit";
import { normalizeApiKeyBaseLabel } from "@/lib/api/key-labels";
import { sendEmail, isEmailConfiguredAsync } from "@/lib/email";
import { apiKeyIssuedEmailContent } from "@/lib/email/templates";

function hashKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getRealSession();
  if (!session || !isAdminRole(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const emailToMember = Boolean(body?.emailToMember);

  const site = await prisma.wordPressSite.findUnique({
    where: { id },
    select: {
      id: true,
      apiKeyId: true,
      userId: true,
      user: { select: { fullName: true, email: true } },
    },
  });
  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const existingKey = site.apiKeyId
    ? await prisma.apiKey.findUnique({
        where: { id: site.apiKeyId },
        select: { label: true, permissions: true, isSandbox: true, rateLimitPerMinute: true },
      })
    : null;

  const label = existingKey ? normalizeApiKeyBaseLabel(existingKey.label) : "WordPress";
  const isSandbox = existingKey?.isSandbox ?? false;
  const permissions = existingKey?.permissions.length ? existingKey.permissions : [...DEFAULT_API_PERMISSIONS];
  const rateLimitPerMinute = existingKey?.rateLimitPerMinute ?? RATE_LIMIT_TIERS.standard;

  const raw = isSandbox
    ? `sk_test_${randomBytes(24).toString("hex")}`
    : `sk_live_${randomBytes(24).toString("hex")}`;

  const created = await prisma.apiKey.create({
    data: {
      userId: site.userId,
      label,
      keyHash: hashKey(raw),
      keyPrefix: raw.slice(0, 14),
      isSandbox,
      permissions,
      rateLimitPerMinute,
    },
  });

  await prisma.wordPressSite.update({
    where: { id: site.id },
    data: { apiKeyId: created.id },
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "wordpress_site.issue_api_key",
      entityType: "WordPressSite",
      entityId: site.id,
      metadata: { newKeyId: created.id, previousKeyId: site.apiKeyId ?? null, emailToMember },
    },
  });

  let emailed = false;
  let emailError: string | null = null;
  if (emailToMember) {
    if (!site.user.email) {
      emailError = "Member has no email on file.";
    } else if (!(await isEmailConfiguredAsync())) {
      emailError = "Email sending is not configured.";
    } else {
      const content = await apiKeyIssuedEmailContent({
        memberName: site.user.fullName,
        label,
        rawKey: raw,
        reason: "An admin issued a new API key for your WordPress plugin connection.",
      });
      const result = await sendEmail({
        to: site.user.email,
        toName: site.user.fullName,
        subject: content.subject,
        text: content.text,
        html: content.html,
      });
      emailed = result.ok;
      if (!result.ok) emailError = result.error;
    }
  }

  return NextResponse.json({
    success: true,
    rawKey: raw,
    keyId: created.id,
    label,
    keyPrefix: created.keyPrefix,
    emailed,
    emailError,
  });
}
