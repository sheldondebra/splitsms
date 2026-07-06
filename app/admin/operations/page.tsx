import { getAdminOperationsDashboard } from "@/lib/admin/operations-dashboard";
import { AdminOperationsView } from "@/components/admin/admin-operations-view";

function parseFlashParam(value: string | undefined) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default async function AdminOperationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    processed?: string;
    sent?: string;
    failed?: string;
    remaining?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await getAdminOperationsDashboard();

  const processed = parseFlashParam(params.processed);
  const flash =
    processed != null
      ? {
          processed,
          sent: parseFlashParam(params.sent),
          failed: parseFlashParam(params.failed),
          remaining: parseFlashParam(params.remaining),
        }
      : undefined;

  return <AdminOperationsView data={data} flash={flash} />;
}
