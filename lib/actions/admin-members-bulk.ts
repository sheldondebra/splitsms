"use server";

import { prisma } from "@/lib/db";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { getOrCreateMemberAccount } from "@/lib/admin/member-account";
import { sendOutreachToRecipients } from "@/lib/admin/outreach-send";
import { withReturnParams } from "@/lib/admin/return-url";
import type { MemberAccountStatus } from "@/lib/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const MAX_BULK = 50;

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

async function logAdmin(
  action: string,
  userId: string,
  adminId: string,
  metadata?: object,
) {
  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action,
      entityType: "User",
      entityId: userId,
      metadata: metadata ?? {},
    },
  });
}

function parseUserIds(formData: FormData) {
  const raw = String(formData.get("userIds") ?? "");
  return [...new Set(raw.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, MAX_BULK);
}

function parseReturnTo(formData: FormData) {
  const returnTo = String(formData.get("returnTo") ?? "/admin/members");
  if (
    !returnTo.startsWith("/admin/members") &&
    !returnTo.startsWith("/admin/outreach")
  ) {
    return "/admin/members";
  }
  return returnTo;
}

const STATUS_ACTIONS: Record<string, MemberAccountStatus> = {
  activate: "ACTIVE",
  suspend: "SUSPENDED",
  block: "BLOCKED",
};

export async function adminBulkMembersAction(formData: FormData) {
  const session = await requireAdmin();
  const action = String(formData.get("action") ?? "");
  const returnTo = parseReturnTo(formData);
  const userIds = parseUserIds(formData);

  if (userIds.length === 0) {
    redirect(withReturnParams(returnTo, { error: "bulk_none" }));
  }

  const members = await prisma.user.findMany({
    where: { id: { in: userIds }, role: "MEMBER" },
    select: { id: true, fullName: true, phone: true, email: true },
  });

  if (members.length === 0) {
    redirect(withReturnParams(returnTo, { error: "bulk_notfound" }));
  }

  const memberIds = members.map((m) => m.id);

  if (action === "verify") {
    await prisma.user.updateMany({
      where: { id: { in: memberIds } },
      data: { isVerified: true, failedLoginCount: 0, lockedUntil: null },
    });
    for (const id of memberIds) {
      await logAdmin("ADMIN_VERIFY_USER", id, session.userId, { bulk: true });
    }
  } else if (action === "unverify") {
    await prisma.user.updateMany({
      where: { id: { in: memberIds } },
      data: { isVerified: false },
    });
    for (const id of memberIds) {
      await logAdmin("ADMIN_UNVERIFY_USER", id, session.userId, { bulk: true });
    }
  } else if (action in STATUS_ACTIONS) {
    const status = STATUS_ACTIONS[action];
    for (const id of memberIds) {
      await getOrCreateMemberAccount(id);
    }
    await prisma.memberAccount.updateMany({
      where: { userId: { in: memberIds } },
      data: {
        status,
        updatedById: session.userId,
        suspendedAt: status === "ACTIVE" ? null : new Date(),
        suspendedReason:
          status === "ACTIVE" ? null : `Bulk ${action} by admin`,
      },
    });
    for (const id of memberIds) {
      await logAdmin("ADMIN_MEMBER_ACCESS", id, session.userId, { status, bulk: true });
    }
  } else if (action === "delete") {
    try {
      await prisma.user.deleteMany({
        where: { id: { in: memberIds }, role: "MEMBER" },
      });
      for (const id of memberIds) {
        await logAdmin("ADMIN_DELETE_MEMBER", id, session.userId, { bulk: true });
      }
    } catch {
      redirect(withReturnParams(returnTo, { error: "bulk_delete_failed" }));
    }
  } else if (action === "send_message") {
    const templateId = String(formData.get("templateId") ?? "custom");
    const sendSms = formData.get("sendSms") === "on";
    const sendEmail = formData.get("sendEmail") === "on";
    const smsBodyRaw = String(formData.get("smsBody") ?? "").trim();
    const emailSubjectRaw = String(formData.get("emailSubject") ?? "").trim();
    const emailTextRaw = String(formData.get("emailText") ?? "").trim();

    if (!sendSms && !sendEmail) {
      redirect(withReturnParams(returnTo, { error: "bulk_outreach_channel" }));
    }
    if (sendSms && !smsBodyRaw) {
      redirect(withReturnParams(returnTo, { error: "bulk_outreach_sms" }));
    }
    if (sendEmail && (!emailSubjectRaw || !emailTextRaw)) {
      redirect(withReturnParams(returnTo, { error: "bulk_outreach_email" }));
    }

    const { sent, failed } = await sendOutreachToRecipients({
      recipients: members.map((m) => ({
        id: m.id,
        fullName: m.fullName,
        phone: m.phone,
        email: m.email,
        role: "MEMBER",
      })),
      templateId,
      sendSms,
      sendEmail,
      smsBodyRaw,
      emailSubjectRaw,
      emailTextRaw,
      adminId: session.userId,
    });

    revalidatePath("/admin/members");
    redirect(
      withReturnParams(returnTo, {
        saved: "bulk_send_message",
        count: String(sent),
        failed: failed > 0 ? String(failed) : undefined,
      }),
    );
  } else {
    redirect(withReturnParams(returnTo, { error: "bulk_invalid" }));
  }

  revalidatePath("/admin/members");
  redirect(
    withReturnParams(returnTo, {
      saved: `bulk_${action}`,
      count: String(members.length),
    }),
  );
}
