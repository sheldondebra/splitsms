"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getRealSession as getSession, isAdminRole } from "@/lib/auth/session";
import { parseReportPeriod } from "@/lib/reports/period";
import { sendMemberAccountReportToUser } from "@/lib/reports/send-member-account-report";
import { sendEmail } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { getSiteUrl } from "@/lib/site-config";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) redirect("/admin");
  return session;
}

export async function adminSendMemberAccountReportAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();
  const period = parseReportPeriod(String(formData.get("days") ?? "30"));

  if (!userId) {
    redirect("/admin/reports/send?error=member");
  }

  const result = await sendMemberAccountReportToUser({
    userId,
    period,
    actorId: session.userId,
  });

  revalidatePath("/admin/reports/send");
  revalidatePath(`/admin/members/${userId}`);

  if (result.status === "not_found") {
    redirect(`/admin/reports/send?error=member&days=${period}`);
  }
  if (result.status === "skipped_no_email") {
    redirect(`/admin/reports/send?error=no_email&userId=${userId}&days=${period}`);
  }
  if (result.status === "failed") {
    redirect(
      `/admin/reports/send?error=email&userId=${userId}&days=${period}&detail=${encodeURIComponent(result.error)}`,
    );
  }

  redirect(`/admin/reports/send?saved=1&userId=${userId}&days=${period}`);
}

export async function adminSendOneMemberAccountReportAction(input: {
  userId: string;
  days?: number | string;
}): Promise<{
  ok: boolean;
  status: "sent" | "failed" | "skipped" | "unauthorized";
  member: string;
  email?: string;
  error?: string;
}> {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return { ok: false, status: "unauthorized", member: "", error: "Unauthorized" };
  }

  const userId = input.userId.trim();
  const period = parseReportPeriod(String(input.days ?? "30"));
  if (!userId) {
    return { ok: false, status: "failed", member: "", error: "Missing member" };
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, role: "MEMBER" },
    select: { fullName: true },
  });
  const memberName = user?.fullName ?? "Member";

  const result = await sendMemberAccountReportToUser({
    userId,
    period,
    actorId: session.userId,
  });

  if (result.status === "sent") {
    return { ok: true, status: "sent", member: memberName, email: result.email };
  }
  if (result.status === "skipped_no_email" || result.status === "not_found") {
    return { ok: false, status: "skipped", member: memberName, error: "No email on file" };
  }
  return { ok: false, status: "failed", member: memberName, error: result.error };
}

export async function adminSendAllMemberAccountReportsBatchAction(input: {
  days?: number | string;
  cursor?: string;
}): Promise<
  | {
      ok: true;
      sent: number;
      failed: number;
      skipped: number;
      processed: number;
      done: boolean;
      nextCursor?: string;
      failures: { member: string; error: string }[];
    }
  | { ok: false; error: string }
> {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return { ok: false, error: "Unauthorized" };
  }

  const period = parseReportPeriod(String(input.days ?? "30"));
  const cursor = input.cursor?.trim() || undefined;
  const {
    ACCOUNT_REPORT_BATCH_SIZE,
    listNextAccountReportRecipients,
  } = await import("@/lib/reports/send-member-account-report");

  const rows = await listNextAccountReportRecipients(
    cursor,
    ACCOUNT_REPORT_BATCH_SIZE + 1,
  );
  const recipients = rows.slice(0, ACCOUNT_REPORT_BATCH_SIZE);
  const done = rows.length <= ACCOUNT_REPORT_BATCH_SIZE;

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const failures: { member: string; error: string }[] = [];

  for (const member of recipients) {
    const result = await sendMemberAccountReportToUser({
      userId: member.id,
      period,
      actorId: session.userId,
    });
    if (result.status === "sent") sent += 1;
    else if (result.status === "failed") {
      failed += 1;
      failures.push({
        member: member.fullName,
        error: result.error,
      });
    } else {
      skipped += 1;
    }
  }

  const nextCursor = recipients.at(-1)?.id;

  revalidatePath("/admin/reports/send");

  return {
    ok: true,
    sent,
    failed,
    skipped,
    processed: recipients.length,
    done,
    nextCursor: done ? undefined : nextCursor,
    failures,
  };
}

export async function adminSendDeliveryFailureNoticeAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const failedCount = Math.max(1, Number(formData.get("failedCount") ?? 1) || 1);
  const lastFailedAt = String(formData.get("lastFailedAt") ?? "").trim();
  const period = parseReportPeriod(String(formData.get("days") ?? "30"));
  const returnTo =
    String(formData.get("returnTo") ?? "").trim() ||
    `/admin/reports/delivery?days=${period}`;

  if (!userId || !reason) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=failure_notice`);
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, role: "MEMBER" },
    select: { id: true, fullName: true, email: true },
  });
  if (!user) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=failure_notice`);
  }

  const email = user.email?.trim();
  if (!email) {
    redirect(
      `${returnTo}${returnTo.includes("?") ? "&" : "?"}error=no_email&member=${encodeURIComponent(user.fullName)}`,
    );
  }

  const whenLabel = lastFailedAt
    ? new Date(lastFailedAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined;

  const { deliveryFailureNoticeEmailContent } = await import("@/lib/email/templates");
  const content = await deliveryFailureNoticeEmailContent({
    memberName: user.fullName,
    failedCount,
    reason,
    periodDays: period,
    lastFailedAt: whenLabel,
    reportsUrl: `${getSiteUrl()}/dashboard/account-reports/delivery?days=${period}`,
  });

  const sent = await sendEmail({
    to: email,
    toName: user.fullName,
    subject: content.subject,
    text: content.text,
    html: content.html,
  });

  await createNotification(
    userId,
    "SMS_FAILED",
    "Delivery failure notice",
    `${failedCount} SMS failed — ${reason}`,
    {
      href: "/dashboard/account-reports/delivery",
      ctaLabel: "View delivery report",
      reason,
      failedCount,
    },
  ).catch(() => undefined);

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "ADMIN_SEND_DELIVERY_FAILURE_NOTICE",
      entityType: "User",
      entityId: userId,
      metadata: { reason, failedCount, periodDays: period, emailOk: sent.ok },
    },
  });

  revalidatePath("/admin/reports/delivery");

  if (!sent.ok) {
    redirect(
      `${returnTo}${returnTo.includes("?") ? "&" : "?"}error=email&detail=${encodeURIComponent(sent.error ?? "send_failed")}`,
    );
  }

  redirect(
    `${returnTo}${returnTo.includes("?") ? "&" : "?"}saved=failure_notice&member=${encodeURIComponent(user.fullName)}`,
  );
}

function truncateFailureReason(reason: string | null) {
  if (!reason?.trim()) return "Unknown / no reason recorded";
  const clean = reason.trim().replace(/\s+/g, " ");
  return clean.length > 80 ? `${clean.slice(0, 77)}…` : clean;
}

/** Retry failed SMS for one member (optionally matching a delivery-report reason). */
export async function adminRetryMemberDeliveryFailuresAction(formData: FormData) {
  const session = await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const period = parseReportPeriod(String(formData.get("days") ?? "30"));
  const returnTo =
    String(formData.get("returnTo") ?? "").trim() ||
    `/admin/reports/delivery?days=${period}`;

  if (!userId) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=retry`);
  }

  const since = new Date();
  since.setDate(since.getDate() - period);
  since.setHours(0, 0, 0, 0);

  const failed = await prisma.message.findMany({
    where: {
      userId,
      status: "FAILED",
      isSandbox: false,
      createdAt: { gte: since },
    },
    orderBy: { failedAt: "asc" },
    take: 200,
    select: {
      id: true,
      countryCode: true,
      priority: true,
      userId: true,
      smsUnits: true,
      cost: true,
      failureReason: true,
    },
  });

  const matched = reason
    ? failed.filter((m) => truncateFailureReason(m.failureReason) === reason)
    : failed;

  if (matched.length === 0) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}retried=0`);
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, role: "MEMBER" },
    select: { fullName: true, email: true, phone: true },
  });
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  const credit = await prisma.smsCredit.findUnique({
    where: { userId },
    select: { balance: true },
  });
  const balance = credit?.balance ?? 0;
  const unitsNeeded = matched.reduce((s, m) => s + m.smsUnits, 0);
  const costNeeded = matched.reduce((s, m) => s + (m.cost?.toNumber() ?? 0), 0);

  const { deductSmsCredits } = await import("@/lib/sms/billing");
  try {
    await deductSmsCredits(
      userId,
      unitsNeeded,
      costNeeded,
      wallet?.currency ?? "GHS",
      `Admin retry ${matched.length} failed messages`,
      matched[0]?.countryCode ?? "GH",
    );
  } catch {
    await createNotification(
      userId,
      "LOW_BALANCE",
      "Not enough SMS credits",
      `Retry blocked — your account does not have enough SMS credits for a re-send. ${matched.length} failed message${matched.length === 1 ? "" : "s"} need about ${unitsNeeded} credits (you have ${balance}). Top up credits to continue.`,
      {
        href: "/dashboard/wallet",
        ctaLabel: "Top up wallet",
        creditsNeeded: unitsNeeded,
        balance,
        messagesBlocked: matched.length,
        source: "admin_retry_blocked",
      },
    ).catch(() => undefined);

    if (user?.email?.trim()) {
      const { insufficientCreditsRetryEmailContent } = await import("@/lib/email/templates");
      const content = await insufficientCreditsRetryEmailContent({
        memberName: user.fullName,
        balance,
        messagesBlocked: matched.length,
        creditsNeeded: unitsNeeded,
      });
      await sendEmail({
        to: user.email.trim(),
        toName: user.fullName,
        subject: content.subject,
        text: content.text,
        html: content.html,
      }).catch(() => undefined);
    }

    redirect(
      `${returnTo}${returnTo.includes("?") ? "&" : "?"}error=credits&member=${encodeURIComponent(user?.fullName ?? "")}`,
    );
  }

  await prisma.message.updateMany({
    where: { id: { in: matched.map((m) => m.id) } },
    data: { status: "PENDING", failureReason: null, failedAt: null },
  });

  const { warmDatabaseConnection } = await import("@/lib/db");
  const { enqueueSmsJobsInline } = await import("@/lib/queue/enqueue-sms");
  await warmDatabaseConnection().catch(() => undefined);
  await enqueueSmsJobsInline(
    matched.map((msg) => ({
      messageId: msg.id,
      countryCode: msg.countryCode ?? "GH",
      priority: msg.priority,
    })),
  );

  if (user?.email?.trim()) {
    const { failedMessagesRetryEmailContent } = await import("@/lib/email/templates");
    const content = await failedMessagesRetryEmailContent({
      memberName: user.fullName,
      messageCount: matched.length,
      dashboardUrl: `${getSiteUrl()}/dashboard/reports`,
    });
    await sendEmail({
      to: user.email.trim(),
      toName: user.fullName,
      subject: content.subject,
      text: content.text,
      html: content.html,
    }).catch(() => undefined);
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.userId,
      action: "SMS_FAILED_RETRIED",
      entityType: "Message",
      entityId: userId,
      metadata: { count: matched.length, reason: reason || null, periodDays: period },
    },
  });

  revalidatePath("/admin/reports/delivery");
  revalidatePath("/admin/messages");
  revalidatePath(`/admin/members/${userId}`);

  redirect(
    `${returnTo}${returnTo.includes("?") ? "&" : "?"}retried=${matched.length}&member=${encodeURIComponent(user?.fullName ?? "")}`,
  );
}
