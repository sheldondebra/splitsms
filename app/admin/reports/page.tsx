import {
  getAdminReportsOverview,
  parseReportPeriod,
} from "@/lib/reports/admin-reports";
import { AdminReportsOverviewView } from "@/components/admin/admin-reports-views";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days } = await searchParams;
  const period = parseReportPeriod(days);
  const data = await getAdminReportsOverview(period);
  return <AdminReportsOverviewView data={data} />;
}
