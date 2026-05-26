import { AdminFraudView } from "@/components/admin/admin-fraud-view";
import {
  getAdminFraudDashboard,
  parseFraudPeriod,
  parseFraudRisk,
} from "@/lib/admin/fraud-dashboard";

export default async function AdminFraudPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; risk?: string; q?: string }>;
}) {
  const params = await searchParams;
  const data = await getAdminFraudDashboard({
    days: parseFraudPeriod(params.days),
    risk: parseFraudRisk(params.risk),
    q: params.q,
  });
  return <AdminFraudView data={data} />;
}
