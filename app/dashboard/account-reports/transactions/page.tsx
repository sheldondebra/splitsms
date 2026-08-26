import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { parseReportPeriod } from "@/lib/reports/period";
import { getMemberAccountReport } from "@/lib/reports/member-account-report";
import { MemberTransactionsReportView } from "@/components/dashboard/member-account-reports-views";

export default async function MemberTransactionsReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { days } = await searchParams;
  const period = parseReportPeriod(days);
  const report = await getMemberAccountReport(session.userId, period);
  if (!report) redirect("/dashboard");
  return <MemberTransactionsReportView report={report} />;
}
