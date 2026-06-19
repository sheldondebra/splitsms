import { getAdminMembersDashboard } from "@/lib/admin/members-dashboard";
import { AdminMembersView } from "@/components/admin/admin-members-view";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    source?: string;
    status?: string;
    country?: string;
    joined?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await getAdminMembersDashboard(params);

  return <AdminMembersView data={data} />;
}
