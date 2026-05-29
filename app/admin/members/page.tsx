import { getAdminMembersDashboard } from "@/lib/admin/members-dashboard";
import { AdminMembersView } from "@/components/admin/admin-members-view";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; source?: string }>;
}) {
  const params = await searchParams;
  const data = await getAdminMembersDashboard({
    q: params.q,
    source: params.source,
  });

  return <AdminMembersView data={data} />;
}
