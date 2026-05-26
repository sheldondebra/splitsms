import { AdminAnalyticsView } from "@/components/admin/admin-analytics-view";
import {
  getAdminAnalyticsDashboard,
  parseAnalyticsPeriod,
} from "@/lib/admin/analytics";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days } = await searchParams;
  const period = parseAnalyticsPeriod(days);
  const data = await getAdminAnalyticsDashboard(period);
  return <AdminAnalyticsView data={data} />;
}
