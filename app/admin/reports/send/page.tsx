import { prisma } from "@/lib/db";
import { parseReportPeriod } from "@/lib/reports/period";
import { getMemberAccountReport } from "@/lib/reports/member-account-report";
import { getAccountReportRecipientSummary, listAccountReportRecipients } from "@/lib/reports/send-member-account-report";
import { AdminSendReportView } from "@/components/admin/admin-send-report-view";

export default async function AdminSendReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    days?: string;
    userId?: string;
    saved?: string;
    error?: string;
    detail?: string;
  }>;
}) {
  const q = await searchParams;
  const period = parseReportPeriod(q.days);
  const userId = q.userId?.trim() || undefined;

  const [members, preview, recipientSummary, recipients] = await Promise.all([
    prisma.user.findMany({
      where: { role: "MEMBER" },
      orderBy: { fullName: "asc" },
      take: 500,
      select: { id: true, fullName: true, phone: true, email: true },
    }),
    userId ? getMemberAccountReport(userId, period, { includeVolume: false }) : Promise.resolve(null),
    getAccountReportRecipientSummary(),
    listAccountReportRecipients(),
  ]);

  return (
    <AdminSendReportView
      period={period}
      members={members}
      selectedUserId={userId}
      preview={preview}
      recipientSummary={recipientSummary}
      recipients={recipients}
      flash={{ saved: q.saved, error: q.error, detail: q.detail }}
    />
  );
}
