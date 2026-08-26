import {
  getAdminTransactionsReport,
  parseReportPeriod,
} from "@/lib/reports/admin-reports";
import { AdminTransactionsReportView } from "@/components/admin/admin-reports-views";

export default async function AdminTransactionsReportPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days } = await searchParams;
  const period = parseReportPeriod(days);
  const data = await getAdminTransactionsReport(period);
  return <AdminTransactionsReportView data={data} />;
}
