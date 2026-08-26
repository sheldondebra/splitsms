import {
  getAdminDeliveryReport,
  parseReportPeriod,
} from "@/lib/reports/admin-reports";
import { AdminDeliveryReportView } from "@/components/admin/admin-reports-views";

export default async function AdminDeliveryReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    days?: string;
    saved?: string;
    error?: string;
    detail?: string;
    member?: string;
    retried?: string;
  }>;
}) {
  const q = await searchParams;
  const period = parseReportPeriod(q.days);
  const data = await getAdminDeliveryReport(period);
  return (
    <AdminDeliveryReportView
      data={data}
      flash={{
        saved: q.saved,
        error: q.error,
        detail: q.detail,
        member: q.member,
        retried: q.retried,
      }}
    />
  );
}
