import {
  getAdminMembersReport,
  parseReportPeriod,
} from "@/lib/reports/admin-reports";
import { AdminMembersReportView } from "@/components/admin/admin-reports-views";

export default async function AdminMembersReportPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days } = await searchParams;
  const period = parseReportPeriod(days);
  const data = await getAdminMembersReport(period);
  return <AdminMembersReportView data={data} />;
}
