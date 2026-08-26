import { prisma } from "@/lib/db";
import { getMemberAccountReport } from "@/lib/reports/member-account-report";
import { buildMemberAccountReportPdf } from "@/lib/reports/pdf";
import { sendEmail } from "@/lib/email";
import { accountReportEmailContent } from "@/lib/email/templates";
import { createNotification } from "@/lib/notifications";
import { getSiteUrl } from "@/lib/site-config";
import type { ReportPeriodDays } from "@/lib/reports/period";
import type { MemberAccountStatus, Prisma } from "@/lib/generated/prisma/client";

export const ACCOUNT_REPORT_BATCH_SIZE = 3;

export function isAccountReportRecipient(member: {
  email: string | null | undefined;
  accountStatus?: MemberAccountStatus | null;
}) {
  if (!member.email?.trim()) return false;
  if (member.accountStatus === "SUSPENDED" || member.accountStatus === "BLOCKED") {
    return false;
  }
  return true;
}

export const accountReportRecipientWhere = {
  role: "MEMBER",
  email: { not: null },
  NOT: { email: "" },
  OR: [{ memberAccount: null }, { memberAccount: { status: "ACTIVE" } }],
} satisfies Prisma.UserWhereInput;

export async function getAccountReportRecipientSummary() {
  const [eligible, noEmail, inactive] = await Promise.all([
    prisma.user.count({ where: accountReportRecipientWhere }),
    prisma.user.count({
      where: {
        role: "MEMBER",
        OR: [{ email: null }, { email: "" }],
      },
    }),
    prisma.user.count({
      where: {
        role: "MEMBER",
        memberAccount: { status: { in: ["SUSPENDED", "BLOCKED"] } },
      },
    }),
  ]);

  return { eligible, noEmail, inactive };
}

export async function listAccountReportRecipients() {
  const rows = await prisma.user.findMany({
    where: accountReportRecipientWhere,
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, phone: true, email: true },
  });
  return rows.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    phone: row.phone,
    email: row.email?.trim() ?? "",
  }));
}

export async function listNextAccountReportRecipients(cursor?: string, take = ACCOUNT_REPORT_BATCH_SIZE) {
  return prisma.user.findMany({
    where: {
      ...accountReportRecipientWhere,
      ...(cursor ? { id: { gt: cursor } } : {}),
    },
    orderBy: { id: "asc" },
    take,
    select: { id: true, fullName: true, email: true },
  });
}

export type SendMemberAccountReportResult =
  | { status: "sent"; email: string }
  | { status: "skipped_no_email" }
  | { status: "not_found" }
  | { status: "failed"; error: string };

export async function sendMemberAccountReportToUser(params: {
  userId: string;
  period: ReportPeriodDays;
  actorId: string;
}): Promise<SendMemberAccountReportResult> {
  const report = await getMemberAccountReport(params.userId, params.period, {
    includeVolume: false,
  });
  if (!report) return { status: "not_found" };

  const email = report.member.email?.trim();
  if (!email) return { status: "skipped_no_email" };

  try {
    const pdf = await buildMemberAccountReportPdf(report);
    const filename = `splitsms-account-report-${params.period}d.pdf`;
    const reportsUrl = `${getSiteUrl()}/dashboard/account-reports?days=${params.period}`;
    const content = await accountReportEmailContent({
      memberName: report.member.fullName,
      memberId: report.member.accountId,
      senderIds: report.senderIds,
      periodDays: params.period,
      messages: report.kpis.messages,
      delivered: report.kpis.delivered,
      failed: report.kpis.failed,
      transactions: report.kpis.transactions,
      logins: report.kpis.logins,
      credits: report.member.credits,
      walletBalance: report.member.walletBalance,
      walletCurrency: report.member.walletCurrency,
      reportsUrl,
      failureReasons: report.charts.failureReasons,
    });

    const sent = await sendEmail({
      to: email,
      toName: report.member.fullName,
      subject: content.subject,
      text: content.text,
      html: content.html,
      attachments: [
        {
          filename,
          content: pdf,
          contentType: "application/pdf",
        },
      ],
    });

    await createNotification(
      params.userId,
      "SYSTEM",
      "Account report ready",
      `An admin emailed your ${params.period}-day account report PDF. Open My reports to review online.`,
      {
        href: "/dashboard/account-reports",
        ctaLabel: "Open My reports",
        periodDays: params.period,
      },
    ).catch(() => undefined);

    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: "ADMIN_SEND_ACCOUNT_REPORT",
        entityType: "User",
        entityId: params.userId,
        metadata: {
          periodDays: params.period,
          emailOk: sent.ok,
          email,
        },
      },
    });

    if (!sent.ok) {
      return { status: "failed", error: sent.error ?? "send_failed" };
    }
    return { status: "sent", email };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "send_failed",
    };
  }
}
