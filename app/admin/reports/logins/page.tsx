import {
  getAdminLoginsReport,
  parseReportPeriod,
} from "@/lib/reports/admin-reports";
import { AdminLoginsReportView } from "@/components/admin/admin-reports-views";

export default async function AdminLoginsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days } = await searchParams;
  const period = parseReportPeriod(days);
  const data = await getAdminLoginsReport(period);
  return <AdminLoginsReportView data={data} />;
}
